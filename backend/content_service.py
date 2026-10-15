from datetime import datetime, timezone
import re
import time
from urllib.parse import quote_plus, urlparse

import feedparser
import requests

from backend.news_service import (
    COMPANY_ALIASES,
    USER_AGENT,
    clean_ticker,
    fetch_ticker_news,
    headline_relevance,
    parse_published_time,
    recency_weight,
)


REDDIT_SOURCE_WEIGHT = 0.45
MIN_CONTENT_RELEVANCE = 0.50
DEDUP_SIMILARITY = 0.84

REDDIT_COOLDOWN_SECONDS = 900

_REDDIT_BLOCKED_UNTIL = 0.0


def _rank_score(item):
    return (
        float(
            item.get(
                "relevance_score",
                0.0,
            )
        )
        *
        float(
            item.get(
                "source_weight",
                0.0,
            )
        )
        *
        float(
            item.get(
                "recency_weight",
                0.0,
            )
        )
    )


def _normalise_title(title):
    text = (
        str(title or "")
        .lower()
    )

    text = re.sub(
        r"[^a-z0-9\s]",
        " ",
        text,
    )

    # Normalise common UK / US spelling differences
    # before duplicate comparison.
    spelling_map = {
        "centre":
            "center",

        "centres":
            "centers",

        "organisation":
            "organization",

        "organisations":
            "organizations",

        "optimisation":
            "optimization",

        "optimise":
            "optimize",

        "analyse":
            "analyze",

        "analysed":
            "analyzed",
    }

    words = []

    for word in text.split():

        words.append(
            spelling_map.get(
                word,
                word,
            )
        )

    return " ".join(
        words
    )


def _title_tokens(title):
    return set(
        _normalise_title(
            title
        ).split()
    )


def _similar_title(
    left,
    right,
):
    left_clean = (
        _normalise_title(
            left
        )
    )

    right_clean = (
        _normalise_title(
            right
        )
    )

    if (
        not left_clean
        or not right_clean
    ):
        return False

    if (
        left_clean
        == right_clean
    ):
        return True

    left_tokens = (
        _title_tokens(
            left
        )
    )

    right_tokens = (
        _title_tokens(
            right
        )
    )

    union = (
        left_tokens
        | right_tokens
    )

    if not union:
        return False

    similarity = (
        len(
            left_tokens
            & right_tokens
        )
        /
        len(union)
    )

    return (
        similarity
        >= DEDUP_SIMILARITY
    )


def deduplicate_content(
    items,
):
    """
    Keep the strongest version of duplicated
    or near-duplicated stories.
    """

    ranked = sorted(
        items,
        key=_rank_score,
        reverse=True,
    )

    kept = []

    for item in ranked:

        duplicate = any(
            _similar_title(
                item.get(
                    "title",
                    "",
                ),
                existing.get(
                    "title",
                    "",
                ),
            )
            for existing
            in kept
        )

        if duplicate:
            continue

        kept.append(
            item
        )

    return kept


def _reddit_source(link):
    """
    Convert a Reddit URL into a useful
    source label such as r/stocks.
    """

    try:
        path = (
            urlparse(
                link
            )
            .path
            .split("/")
        )

        if "r" in path:
            index = (
                path.index(
                    "r"
                )
            )

            if (
                index + 1
                < len(path)
            ):
                return (
                    f"r/{path[index + 1]}"
                )

    except Exception:
        pass

    return "Reddit"


def _social_relevance(
    ticker,
    aliases,
    title,
):
    """
    Minimum entity relevance for a social post.
    Existing news relevance remains the primary
    relevance engine.
    """

    text = (
        str(title or "")
        .lower()
    )

    symbol = (
        ticker
        .split(".")[0]
        .lower()
    )

    terms = [
        ticker.lower(),
        symbol,
    ]

    terms.extend(
        str(alias).lower()
        for alias
        in aliases
    )

    matched = any(
        term
        and len(term) > 1
        and term in text
        for term
        in terms
    )

    if not matched:
        return 0.0

    return 0.55


def fetch_reddit_posts(
    ticker,
    max_items=4,
    lookback_hours=72,
):
    """
    Fetch recent public Reddit search results.

    This is intentionally treated as a
    lower-authority social source than
    established financial news.
    """

    ticker = clean_ticker(
        ticker
    )

    if not ticker:
        raise ValueError(
            "Ticker cannot be empty."
        )

    aliases = (
        COMPANY_ALIASES.get(
            ticker,
            [ticker],
        )
    )

    primary_name = (
        aliases[0]
    )

    symbol = (
        ticker.split(".")[0]
    )

    query = quote_plus(
        f'"{primary_name}" OR '
        f'"{symbol}" stock'
    )

    url = (
        "https://www.reddit.com/"
        "search.rss"
        f"?q={query}"
        "&sort=new"
        "&t=week"
    )

    global _REDDIT_BLOCKED_UNTIL

    now_monotonic = (
        time.monotonic()
    )

    if (
        now_monotonic
        < _REDDIT_BLOCKED_UNTIL
    ):

        remaining = int(
            _REDDIT_BLOCKED_UNTIL
            - now_monotonic
        )

        raise RuntimeError(
            "Reddit source temporarily "
            f"rate-limited. Retry in "
            f"approximately {remaining}s."
        )


    response = requests.get(
        url,
        headers={
            "User-Agent":
                USER_AGENT,

            "Accept":
                (
                    "application/rss+xml,"
                    "application/xml;q=0.9"
                ),
        },
        timeout=10,
    )


    if (
        response.status_code
        == 429
    ):

        _REDDIT_BLOCKED_UNTIL = (
            time.monotonic()
            + REDDIT_COOLDOWN_SECONDS
        )

        raise RuntimeError(
            "Reddit source temporarily "
            "rate-limited. 15-minute "
            "cooldown activated."
        )


    response.raise_for_status()

    feed = feedparser.parse(
        response.content
    )

    now = datetime.now(
        timezone.utc
    )

    posts = []

    seen_titles = set()

    for entry in feed.entries:

        title = (
            entry.get(
                "title",
                "",
            )
            .strip()
        )

        if not title:
            continue

        title_key = (
            _normalise_title(
                title
            )
        )

        if (
            title_key
            in seen_titles
        ):
            continue

        published_at = (
            parse_published_time(
                entry
            )
        )

        if published_at is None:
            continue

        age_hours = (
            now
            - published_at
        ).total_seconds() / 3600

        age_hours = max(
            age_hours,
            0.0,
        )

        if (
            age_hours
            > lookback_hours
        ):
            continue

        relevance = max(
            headline_relevance(
                ticker,
                title,
            ),
            _social_relevance(
                ticker,
                aliases,
                title,
            ),
        )

        if (
            relevance
            < MIN_CONTENT_RELEVANCE
        ):
            continue

        link = (
            entry.get(
                "link",
                "",
            )
        )

        post = {
            "ticker":
                ticker,

            "title":
                title,

            "source":
                _reddit_source(
                    link
                ),

            "link":
                link,

            "published_at":
                published_at.isoformat(),

            "age_hours":
                round(
                    age_hours,
                    2,
                ),

            "recency_weight":
                recency_weight(
                    age_hours
                ),

            "source_weight":
                REDDIT_SOURCE_WEIGHT,

            "relevance_score":
                round(
                    relevance,
                    4,
                ),

            "provider":
                "Reddit RSS",

            "source_type":
                "social",

            "platform":
                "Reddit",
        }

        posts.append(
            post
        )

        seen_titles.add(
            title_key
        )

    posts.sort(
        key=_rank_score,
        reverse=True,
    )

    return posts[
        :max_items
    ]


def fetch_ticker_content(
    ticker,
    news_items=8,
    social_items=4,
    lookback_hours=72,
):
    """
    Combine independent content sources while
    allowing any one provider to fail safely.
    """

    ticker = clean_ticker(
        ticker
    )

    items = []

    errors = {}

    try:
        news = fetch_ticker_news(
            ticker=ticker,
            max_articles=news_items,
            lookback_hours=(
                lookback_hours
            ),
        )

        for article in news:
            item = dict(
                article
            )

            item.setdefault(
                "source_type",
                "news",
            )

            item.setdefault(
                "platform",
                "News",
            )

            items.append(
                item
            )

    except Exception as exc:
        errors[
            "news"
        ] = str(exc)

    try:
        social = (
            fetch_reddit_posts(
                ticker=ticker,
                max_items=(
                    social_items
                ),
                lookback_hours=(
                    lookback_hours
                ),
            )
        )

        items.extend(
            social
        )

    except Exception as exc:
        errors[
            "reddit"
        ] = str(exc)

    items = (
        deduplicate_content(
            items
        )
    )

    return {
        "ticker":
            ticker,

        "items":
            items,

        "errors":
            errors,
    }


def fetch_portfolio_content(
    tickers,
    articles_per_ticker=8,
    lookback_hours=72,
):
    """
    Drop-in replacement for fetch_portfolio_news.

    Response keeps the existing
    articles_by_ticker structure so the current
    FinBERT pipeline can continue unchanged.
    """

    cleaned_tickers = []

    for ticker in tickers:

        cleaned = clean_ticker(
            ticker
        )

        if (
            cleaned
            and cleaned
            not in cleaned_tickers
        ):
            cleaned_tickers.append(
                cleaned
            )

    if not cleaned_tickers:
        raise ValueError(
            "At least one valid ticker is required."
        )

    articles_by_ticker = {}

    errors = {}

    source_counts = {
        "news": 0,
        "social": 0,
    }

    total_articles = 0

    social_items = max(
        2,
        min(
            5,
            (
                articles_per_ticker
                // 2
            )
            + 1,
        ),
    )

    for ticker in cleaned_tickers:

        result = (
            fetch_ticker_content(
                ticker=ticker,
                news_items=(
                    articles_per_ticker
                ),
                social_items=(
                    social_items
                ),
                lookback_hours=(
                    lookback_hours
                ),
            )
        )

        items = result[
            "items"
        ]

        articles_by_ticker[
            ticker
        ] = items

        total_articles += len(
            items
        )

        for item in items:

            source_type = (
                item.get(
                    "source_type",
                    "news",
                )
            )

            if (
                source_type
                not in source_counts
            ):
                source_counts[
                    source_type
                ] = 0

            source_counts[
                source_type
            ] += 1

        if result[
            "errors"
        ]:

            errors[
                ticker
            ] = result[
                "errors"
            ]

    return {
        "tickers":
            cleaned_tickers,

        "articles_by_ticker":
            articles_by_ticker,

        "total_articles":
            total_articles,

        "errors":
            errors,

        "source_counts":
            source_counts,

        "sources":
            [
                "Google News RSS",
                "Reddit RSS",
            ],
    }
