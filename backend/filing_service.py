from functools import lru_cache
from datetime import datetime, timezone
import time

import requests

from backend.news_service import (
    clean_ticker,
)


SEC_HEADERS = {
    "User-Agent":
        (
            "FinClarity research prototype "
            "contact@example.com"
        ),

    "Accept-Encoding":
        "gzip, deflate",
}


SEC_TICKERS_URL = (
    "https://www.sec.gov/files/"
    "company_tickers.json"
)

SEC_SUBMISSIONS_URL = (
    "https://data.sec.gov/submissions/"
)


IMPORTANT_FORMS = {
    "10-K",
    "10-Q",
    "8-K",
    "20-F",
    "6-K",
    "40-F",
}


@lru_cache(maxsize=1)
def get_sec_ticker_map():
    """
    Download and cache SEC's ticker -> CIK map.
    """

    response = requests.get(
        SEC_TICKERS_URL,
        headers=SEC_HEADERS,
        timeout=12,
    )

    response.raise_for_status()

    raw = response.json()

    mapping = {}

    for item in raw.values():

        ticker = (
            str(
                item.get(
                    "ticker",
                    ""
                )
            )
            .upper()
            .strip()
        )

        cik = item.get(
            "cik_str"
        )

        title = item.get(
            "title"
        )

        if (
            ticker
            and cik is not None
        ):

            mapping[
                ticker
            ] = {
                "cik":
                    int(cik),

                "name":
                    title,
            }

    return mapping


def _base_symbol(
    ticker,
):
    """
    SEC mapping generally uses the US trading
    symbol without Yahoo-style exchange suffixes.
    """

    ticker = clean_ticker(
        ticker
    )

    if not ticker:
        return ""

    return (
        ticker
        .split(".")[0]
        .upper()
    )


def _filing_age_hours(
    date_string,
):
    try:

        filed = datetime.strptime(
            date_string,
            "%Y-%m-%d",
        ).replace(
            tzinfo=timezone.utc
        )

        now = datetime.now(
            timezone.utc
        )

        return max(
            (
                now
                - filed
            ).total_seconds()
            / 3600,
            0.0,
        )

    except Exception:

        return None


def fetch_sec_filings(
    ticker,
    max_items=6,
    lookback_days=365,
):
    """
    Return recent important SEC filings.

    Filings are context/evidence and are NOT
    treated as FinBERT sentiment observations.
    """

    ticker = clean_ticker(
        ticker
    )

    # Yahoo-style exchange suffixes such as
    # AZN.L, RELIANCE.NS or SAP.DE represent
    # non-US listings. Do not silently map
    # those securities to a US ADR.
    if (
        not ticker
        or "." in ticker
    ):
        return []

    symbol = _base_symbol(
        ticker
    )

    if not symbol:
        return []


    ticker_map = (
        get_sec_ticker_map()
    )

    company = (
        ticker_map.get(
            symbol
        )
    )

    if not company:
        return []


    cik = str(
        company[
            "cik"
        ]
    ).zfill(
        10
    )


    url = (
        f"{SEC_SUBMISSIONS_URL}"
        f"CIK{cik}.json"
    )


    response = requests.get(
        url,
        headers=SEC_HEADERS,
        timeout=12,
    )

    response.raise_for_status()


    payload = response.json()

    recent = (
        payload
        .get(
            "filings",
            {}
        )
        .get(
            "recent",
            {}
        )
    )


    forms = recent.get(
        "form",
        []
    )

    dates = recent.get(
        "filingDate",
        []
    )

    accessions = recent.get(
        "accessionNumber",
        []
    )

    documents = recent.get(
        "primaryDocument",
        []
    )


    filings = []


    for (
        form,
        filing_date,
        accession,
        document,
    ) in zip(
        forms,
        dates,
        accessions,
        documents,
    ):

        if (
            form
            not in IMPORTANT_FORMS
        ):
            continue


        age_hours = (
            _filing_age_hours(
                filing_date
            )
        )


        if (
            age_hours is None
            or age_hours
            > (
                lookback_days
                * 24
            )
        ):
            continue


        accession_clean = (
            accession.replace(
                "-",
                ""
            )
        )


        filing_url = (
            "https://www.sec.gov/"
            "Archives/edgar/data/"
            f"{company['cik']}/"
            f"{accession_clean}/"
            f"{document}"
        )


        filings.append(
            {
                "ticker":
                    ticker,

                "title":
                    (
                        f"{company['name']} "
                        f"filed Form {form}"
                    ),

                "source":
                    "SEC EDGAR",

                "provider":
                    "SEC EDGAR",

                "source_type":
                    "filing",

                "platform":
                    "SEC",

                "form":
                    form,

                "filed_at":
                    filing_date,

                "age_hours":
                    round(
                        age_hours,
                        2,
                    ),

                "link":
                    filing_url,

                "sentiment":
                    None,
            }
        )


        if (
            len(filings)
            >= max_items
        ):
            break


    return filings


def fetch_portfolio_filings(
    tickers,
    max_items_per_ticker=4,
):
    results = {}

    errors = {}


    for ticker in tickers:

        clean = clean_ticker(
            ticker
        )

        if not clean:
            continue


        try:

            results[
                clean
            ] = (
                fetch_sec_filings(
                    clean,
                    max_items=(
                        max_items_per_ticker
                    ),
                )
            )

        except Exception as exc:

            results[
                clean
            ] = []

            errors[
                clean
            ] = str(exc)


        # Be respectful of SEC infrastructure.
        time.sleep(
            0.05
        )


    return {
        "filings_by_ticker":
            results,

        "errors":
            errors,
    }
