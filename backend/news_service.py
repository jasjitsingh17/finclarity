from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus

import feedparser
import requests


USER_AGENT = (
    "FinClarity/0.1 "
    "(portfolio research project)"
)


# ========================================
# COMPANY ALIASES
# ========================================

COMPANY_ALIASES = {

    "AAPL": [
        "apple",
        "apple inc",
        "aapl",
    ],

    "MSFT": [
        "microsoft",
        "microsoft corp",
        "msft",
    ],

    "NVDA": [
        "nvidia",
        "nvidia corp",
        "nvda",
    ],
}


# ========================================
# SOURCE QUALITY
# ========================================

SOURCE_WEIGHTS = {

    "reuters": 1.00,
    "bloomberg": 1.00,
    "financial times": 1.00,
    "wall street journal": 1.00,

    "cnbc": 0.90,

    "yahoo finance": 0.85,

    "marketwatch": 0.85,

    "fortune": 0.80,

    "business insider": 0.75,

    "investing.com": 0.70,

    "marketbeat": 0.60,

    "seeking alpha": 0.65,
}


# ========================================
# LOW-VALUE PATTERNS
# ========================================

NOISE_PHRASES = [

    "interactive stock chart",

    "option chain",

    "options chain",

    "call option",

    "put option",

    "strike price",

    "unusual options activity",

    "shares you'd need",

    "shares you would need",

    "how many shares",

    "stock position cut by",

    "stock position boosted by",

    "stock position reduced by",

    "stake lowered by",

    "stake boosted by",

    "stake increased by",

    "stock sold by",

    "stock bought by",

    "interactive chart",

    "historical stock chart",
]


HIGH_VALUE_TERMS = [

    "earnings",
    "revenue",
    "profit",
    "guidance",
    "forecast",

    "acquisition",
    "merger",
    "deal",

    "investment",
    "partnership",

    "launch",
    "product",

    "regulatory",
    "antitrust",
    "lawsuit",

    "upgrade",
    "downgrade",
    "price target",

    "sales",
    "margin",
    "cash flow",

    "ceo",
    "cfo",

    "ai",
    "artificial intelligence",

    "chip",
    "semiconductor",

    "results",
    "eps",
    "earnings per share",

    "outlook",
    "estimates",
    "analyst",

    "target",
    "rating",
    "upgrade",
    "downgrade",

    "contract",
    "order",

    "demand",
    "supply",

    "tariff",
    "export",

    "investigation",
    "fine",

    "buyback",

    "layoff",
    "restructuring",
]


def clean_ticker(
    ticker,
):

    return (
        str(ticker)
        .strip()
        .upper()
    )


# ========================================
# SOURCE WEIGHT
# ========================================

def source_quality_weight(
    source,
):

    source_lower = (
        source
        .strip()
        .lower()
    )


    for name, weight in (
        SOURCE_WEIGHTS.items()
    ):

        if name in source_lower:

            return weight


    return 0.55


# ========================================
# RECENCY WEIGHT
# ========================================

def recency_weight(
    age_hours,
):

    if age_hours <= 6:
        return 1.00

    if age_hours <= 24:
        return 0.90

    if age_hours <= 48:
        return 0.75

    if age_hours <= 72:
        return 0.60

    if age_hours <= 168:
        return 0.45

    return 0.30


# ========================================
# RELEVANCE ENGINE
# ========================================

def headline_relevance(
    ticker,
    title,
):
    """
    Score whether a headline is genuinely
    useful for company-level investment
    research.

    Range:
    0.0 = unusable
    1.0 = highly relevant
    """

    title_lower = (
        title
        .lower()
        .strip()
    )


    for phrase in NOISE_PHRASES:

        if phrase in title_lower:

            return 0.0


    aliases = COMPANY_ALIASES.get(
        ticker,
        [
            ticker.lower(),
        ],
    )


    entity_match = any(
        alias.lower()
        in title_lower

        for alias in aliases
    )


    if not entity_match:

        return 0.25


    score = 0.35


    if any(
        term in title_lower
        for term in HIGH_VALUE_TERMS
    ):

        score += 0.45


    # Headlines that explicitly use both
    # company name and ticker receive a
    # small relevance boost.

    if (
        ticker.lower()
        in title_lower
    ):

        score += 0.10


    return min(
        score,
        1.0,
    )


# ========================================
# SOURCE EXTRACTION
# ========================================

def extract_source(
    entry,
):

    source_object = entry.get(
        "source",
        {},
    )


    if hasattr(
        source_object,
        "get",
    ):

        source = source_object.get(
            "title",
            "",
        )

        if source:
            return source.strip()


    title = entry.get(
        "title",
        "",
    )


    if " - " in title:

        return (
            title
            .rsplit(
                " - ",
                1,
            )[-1]
            .strip()
        )


    return "Unknown"


# ========================================
# PUBLISHED TIME
# ========================================

def parse_published_time(
    entry,
):

    published = entry.get(
        "published"
    )


    if not published:
        return None


    try:

        timestamp = (
            parsedate_to_datetime(
                published
            )
        )

    except (
        TypeError,
        ValueError,
        OverflowError,
    ):

        return None


    if timestamp.tzinfo is None:

        timestamp = (
            timestamp.replace(
                tzinfo=timezone.utc
            )
        )


    return timestamp.astimezone(
        timezone.utc
    )


# ========================================
# TICKER NEWS
# ========================================

def fetch_ticker_news(
    ticker,
    max_articles=8,
    lookback_hours=72,
):

    ticker = clean_ticker(
        ticker
    )


    if not ticker:

        raise ValueError(
            "Ticker cannot be empty."
        )


    aliases = COMPANY_ALIASES.get(
        ticker,
        [ticker],
    )


    primary_name = aliases[0]


    query = quote_plus(
        f'"{primary_name}" OR "{ticker}" '
        "stock finance"
    )


    url = (
        "https://news.google.com/"
        "rss/search"
        f"?q={query}"
        "&hl=en-US"
        "&gl=US"
        "&ceid=US:en"
    )


    response = requests.get(
        url,
        headers={
            "User-Agent":
                USER_AGENT,
        },
        timeout=10,
    )


    response.raise_for_status()


    feed = feedparser.parse(
        response.content
    )


    now = datetime.now(
        timezone.utc
    )


    candidate_articles = []

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


        title_key = title.lower()


        if title_key in seen_titles:
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
            0,
        )


        if (
            age_hours
            > lookback_hours
        ):

            continue


        relevance = headline_relevance(
            ticker,
            title,
        )


        # Do not allow irrelevant/noise
        # headlines into FinBERT.

        if relevance < 0.50:
            continue


        source = extract_source(
            entry
        )


        article = {

            "ticker":
                ticker,

            "title":
                title,

            "source":
                source,

            "link":
                entry.get(
                    "link",
                    "",
                ),

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
                source_quality_weight(
                    source
                ),

            "relevance_score":
                round(
                    relevance,
                    4,
                ),

            "provider":
                "Google News RSS",
        }


        candidate_articles.append(
            article
        )


        seen_titles.add(
            title_key
        )


    # ====================================
    # RANK ARTICLES
    # ====================================

    candidate_articles.sort(
        key=lambda article: (
            article[
                "relevance_score"
            ]
            *
            article[
                "source_weight"
            ]
            *
            article[
                "recency_weight"
            ]
        ),
        reverse=True,
    )


    return (
        candidate_articles[
            :max_articles
        ]
    )


# ========================================
# PORTFOLIO NEWS
# ========================================

def fetch_portfolio_news(
    tickers,
    articles_per_ticker=8,
    lookback_hours=72,
):

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
            "At least one valid ticker "
            "is required."
        )


    articles_by_ticker = {}

    errors = {}

    total_articles = 0


    for ticker in cleaned_tickers:

        try:

            articles = fetch_ticker_news(
                ticker=ticker,
                max_articles=(
                    articles_per_ticker
                ),
                lookback_hours=(
                    lookback_hours
                ),
            )


            articles_by_ticker[
                ticker
            ] = articles


            total_articles += len(
                articles
            )


        except Exception as error:

            articles_by_ticker[
                ticker
            ] = []

            errors[
                ticker
            ] = str(
                error
            )


    return {

        "tickers":
            cleaned_tickers,

        "total_articles":
            total_articles,

        "articles_per_ticker":
            articles_per_ticker,

        "lookback_hours":
            lookback_hours,

        "articles_by_ticker":
            articles_by_ticker,

        "errors":
            errors,

        "methodology": {

            "news_provider":
                "Google News RSS",

            "analysis_scope":
                "Financial headlines",

            "relevance_filter":
                (
                    "Entity matching + "
                    "investment relevance"
                ),

            "article_ranking":
                (
                    "relevance × source quality "
                    "× recency"
                ),

            "sentiment_model":
                "ProsusAI/finbert",
        },
    }
