from datetime import datetime, timezone
from functools import lru_cache
from urllib.parse import (
    quote_plus,
    urlparse,
)

import re

import feedparser
import requests
import yfinance as yf

from backend.news_service import (
    clean_ticker,
    parse_published_time,
)


USER_AGENT = (
    "Mozilla/5.0 "
    "(compatible; FinClarity/0.1)"
)


GOOGLE_NEWS_RSS = (
    "https://news.google.com/rss/search"
)


COMPANY_HIGH_VALUE_TERMS = (
    "earnings",
    "quarterly results",
    "annual results",
    "financial results",
    "revenue",
    "profit",
    "financial guidance",
    "earnings guidance",
    "revenue guidance",
    "profit guidance",
    "outlook",
    "investor",
    "investor relations",
    "press release",
    "newsroom",
    "announces",
    "announced",
    "acquisition",
    "acquires",
    "merger",
    "partnership",
    "strategic partnership",
    "investment",
    "launches",
    "launched",
    "appoints",
    "appointed",
    "chief executive",
    "chief financial officer",
    "ceo",
    "cfo",
    "dividend",
    "share repurchase",
    "buyback",
    "capital return",
    "restructuring",
    "layoffs",
    "regulatory",
    "settlement",
    "contract",
    "agreement",
)


COMPANY_STRONG_TERMS = (
    "earnings",
    "quarterly results",
    "annual results",
    "financial results",
    "financial guidance",
    "earnings guidance",
    "revenue guidance",
    "profit guidance",
    "investor relations",
    "press release",
    "acquisition",
    "merger",
    "dividend",
    "share repurchase",
    "buyback",
)


COMPANY_NOISE_TERMS = (
    "support",
    "help center",
    "help centre",
    "free download",
    "download and install",
    "app store",
    "microsoft store",
    "marketplace",
    "update catalog",
    "community hub",
    "user guide",
    "how to",
    "troubleshooting",
    "documentation",
    "microsoft learn",
    "cloud adoption framework",
    "training",
    "learning path",
    "security fundamentals",
    "developer documentation",
    "technical documentation",
    "buy ",
    "shop ",
    "special edition",
    "create your",
    "wallpaper",
    "manual",
)


CATEGORY_TERMS = {
    "Earnings":
        (
            "earnings",
            "quarterly results",
            "annual results",
            "financial results",
            "revenue",
            "profit",
            "financial guidance",
            "earnings guidance",
            "revenue guidance",
            "profit guidance",
            "outlook",
        ),

    "M&A":
        (
            "acquisition",
            "acquires",
            "merger",
        ),

    "Capital":
        (
            "dividend",
            "share repurchase",
            "buyback",
            "capital return",
        ),

    "Management":
        (
            "appoints",
            "appointed",
            "chief executive",
            "chief financial officer",
            "ceo",
            "cfo",
        ),

    "Strategic":
        (
            "partnership",
            "strategic partnership",
            "investment",
            "agreement",
            "contract",
        ),

    "Product":
        (
            "launches",
            "launched",
        ),

    "Regulatory":
        (
            "regulatory",
            "settlement",
        ),
}


def _normalise_text(
    value,
):
    return " ".join(
        re.sub(
            r"[^a-z0-9\s]",
            " ",
            str(
                value
                or ""
            ).lower(),
        ).split()
    )


def _is_noise_title(
    title,
):
    value = (
        _normalise_text(
            title
        )
    )

    return any(
        term.strip()
        in value
        for term
        in COMPANY_NOISE_TERMS
    )


def company_content_relevance(
    title,
):
    """
    Investor relevance for first-party company
    content.

    Official-domain membership alone is not
    sufficient. The title must contain a
    financially or strategically meaningful
    corporate event.
    """

    value = (
        _normalise_text(
            title
        )
    )

    if not value:
        return 0.0


    if (
        _is_noise_title(
            value
        )
    ):
        return 0.0


    matches = [
        term
        for term
        in COMPANY_HIGH_VALUE_TERMS
        if term
        in value
    ]


    if not matches:
        return 0.0


    score = 0.55


    if any(
        term
        in value
        for term
        in COMPANY_STRONG_TERMS
    ):
        score += 0.30


    if (
        len(matches)
        >= 2
    ):
        score += 0.10


    return min(
        score,
        1.0,
    )


def classify_company_update(
    title,
):
    value = (
        _normalise_text(
            title
        )
    )


    for (
        category,
        terms,
    ) in CATEGORY_TERMS.items():

        if any(
            term
            in value
            for term
            in terms
        ):
            return category


    return "Corporate Update"


@lru_cache(maxsize=256)
def get_company_identity(
    ticker,
):
    ticker = clean_ticker(
        ticker
    )


    if not ticker:
        raise ValueError(
            "Ticker cannot be empty."
        )


    stock = yf.Ticker(
        ticker
    )


    info = {}

    try:
        info = (
            stock.get_info()
            or {}
        )

    except Exception:

        try:
            info = (
                stock.info
                or {}
            )

        except Exception:
            info = {}


    name = (
        info.get(
            "longName"
        )
        or info.get(
            "shortName"
        )
        or ticker
    )


    website = (
        info.get(
            "website"
        )
        or ""
    )


    domain = ""


    if website:

        try:

            parsed = urlparse(
                website
            )


            domain = (
                parsed.netloc
                .lower()
                .removeprefix(
                    "www."
                )
            )


        except Exception:
            domain = ""


    return {
        "ticker":
            ticker,

        "name":
            name,

        "website":
            website,

        "domain":
            domain,
    }


def _age_hours(
    published_at,
):

    if published_at is None:
        return None


    now = datetime.now(
        timezone.utc
    )


    return max(
        (
            now
            - published_at
        ).total_seconds()
        / 3600,
        0.0,
    )


def fetch_company_updates(
    ticker,
    max_items=6,
    lookback_hours=720,
):
    """
    Retrieve recent investor-relevant first-party
    company communications.

    First-party evidence is kept outside the
    FinBERT portfolio sentiment aggregate.
    """

    identity = (
        get_company_identity(
            ticker
        )
    )


    domain = (
        identity[
            "domain"
        ]
    )


    if not domain:

        return {
            "ticker":
                identity[
                    "ticker"
                ],

            "company":
                identity[
                    "name"
                ],

            "website":
                identity[
                    "website"
                ],

            "domain":
                "",

            "items":
                [],

            "count":
                0,

            "error":
                (
                    "Official company domain "
                    "could not be resolved."
                ),
        }


    # Restrict Google News to the official domain,
    # but request corporate/investor material rather
    # than every indexed page on that domain.
    search_terms = (
        "earnings OR results OR guidance "
        "OR announces OR acquisition "
        "OR partnership OR investor "
        "OR dividend OR buyback "
        "OR appoints"
    )


    query = quote_plus(
        f"site:{domain} "
        f"({search_terms})"
    )


    url = (
        f"{GOOGLE_NEWS_RSS}"
        f"?q={query}"
        "&hl=en-GB"
        "&gl=GB"
        "&ceid=GB:en"
    )


    response = requests.get(
        url,
        headers={
            "User-Agent":
                USER_AGENT,
        },
        timeout=12,
    )


    response.raise_for_status()


    feed = feedparser.parse(
        response.content
    )


    candidates = []

    seen_titles = set()


    for entry in feed.entries:

        title = (
            entry.get(
                "title",
                ""
            )
            .strip()
        )


        if not title:
            continue


        clean_title = (
            _normalise_text(
                title
            )
        )


        if (
            clean_title
            in seen_titles
        ):
            continue


        relevance = (
            company_content_relevance(
                title
            )
        )


        if (
            relevance
            < 0.55
        ):
            continue


        published_at = (
            parse_published_time(
                entry
            )
        )


        age_hours = (
            _age_hours(
                published_at
            )
        )


        if (
            age_hours
            is not None
            and age_hours
            > lookback_hours
        ):
            continue


        link = (
            entry.get(
                "link",
                ""
            )
        )


        candidates.append(
            {
                "ticker":
                    identity[
                        "ticker"
                    ],

                "title":
                    title,

                "source":
                    identity[
                        "name"
                    ],

                "provider":
                    (
                        "Google News RSS "
                        "(official-domain query)"
                    ),

                "source_type":
                    "company",

                "platform":
                    "Company",

                "evidence_type":
                    "first_party",

                "category":
                    classify_company_update(
                        title
                    ),

                "relevance_score":
                    round(
                        relevance,
                        4,
                    ),

                "company_domain":
                    domain,

                "company_website":
                    identity[
                        "website"
                    ],

                "published_at":
                    (
                        published_at
                        .isoformat()
                        if published_at
                        else None
                    ),

                "age_hours":
                    (
                        round(
                            age_hours,
                            2,
                        )
                        if age_hours
                        is not None
                        else None
                    ),

                "link":
                    link,

                "sentiment":
                    None,
            }
        )


        seen_titles.add(
            clean_title
        )


    candidates.sort(
        key=lambda item: (
            item.get(
                "relevance_score",
                0
            ),
            -(
                item.get(
                    "age_hours"
                )
                or 0
            ),
        ),
        reverse=True,
    )


    items = candidates[
        :max_items
    ]


    return {
        "ticker":
            identity[
                "ticker"
            ],

        "company":
            identity[
                "name"
            ],

        "website":
            identity[
                "website"
            ],

        "domain":
            domain,

        "items":
            items,

        "count":
            len(items),
    }
