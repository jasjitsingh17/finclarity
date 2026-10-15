from functools import lru_cache

import yfinance as yf

from backend.fx_service import (
    normalise_currency,
)


# ==========================================================
# LOW-LEVEL METADATA HELPERS
# ==========================================================

def _clean_ticker(
    ticker,
):
    value = str(
        ticker
        or ""
    ).strip().upper()


    if not value:

        raise ValueError(
            "Ticker cannot be empty."
        )


    return value


def _extract_fast_info_currency(
    ticker_object,
):
    """
    Best-effort read from yfinance fast_info.

    fast_info can behave like either a mapping
    or an object depending on yfinance version.
    """

    try:

        fast_info = (
            ticker_object.fast_info
        )

    except Exception:

        return None


    if fast_info is None:
        return None


    # Mapping-style access.
    try:

        value = (
            fast_info.get(
                "currency"
            )
        )

        if value:
            return str(
                value
            ).strip()

    except Exception:

        pass


    # Attribute-style access.
    try:

        value = (
            getattr(
                fast_info,
                "currency",
                None,
            )
        )

        if value:
            return str(
                value
            ).strip()

    except Exception:

        pass


    return None


def _extract_info_currency(
    ticker_object,
):
    """
    Fallback to standard Yahoo metadata.

    We deliberately use `currency`, which
    describes the security's trading/quote
    currency. We do NOT substitute
    `financialCurrency`, because that can
    describe the company's reporting currency
    rather than the listed security's quote.
    """

    try:

        info = (
            ticker_object.info
        )

    except Exception:

        return None


    if not isinstance(
        info,
        dict,
    ):
        return None


    value = (
        info.get(
            "currency"
        )
    )


    if not value:
        return None


    return str(
        value
    ).strip()


# ==========================================================
# PUBLIC RESOLVER
# ==========================================================

@lru_cache(
    maxsize=256
)
def resolve_trading_currency(
    ticker,
):
    """
    Resolve the security's Yahoo trading
    currency and normalise it for FX use.

    Returns explicit metadata instead of
    silently guessing when Yahoo does not
    provide a currency.
    """

    clean_ticker = (
        _clean_ticker(
            ticker
        )
    )


    try:

        ticker_object = (
            yf.Ticker(
                clean_ticker
            )
        )

    except Exception as exc:

        return {
            "ticker":
                clean_ticker,

            "status":
                "unavailable",

            "raw_currency":
                None,

            "currency":
                None,

            "price_scale":
                None,

            "source":
                None,

            "error":
                (
                    "Unable to initialise "
                    "Yahoo instrument metadata."
                ),
        }


    raw_currency = (
        _extract_fast_info_currency(
            ticker_object
        )
    )


    source = (
        "yahoo_fast_info"
        if raw_currency
        else None
    )


    if not raw_currency:

        raw_currency = (
            _extract_info_currency(
                ticker_object
            )
        )


        if raw_currency:

            source = (
                "yahoo_info"
            )


    if not raw_currency:

        return {
            "ticker":
                clean_ticker,

            "status":
                "unavailable",

            "raw_currency":
                None,

            "currency":
                None,

            "price_scale":
                None,

            "source":
                None,

            "error":
                (
                    "Trading currency was not "
                    "available from Yahoo metadata."
                ),
        }


    try:

        (
            currency,
            price_scale,
        ) = (
            normalise_currency(
                raw_currency
            )
        )

    except ValueError:

        return {
            "ticker":
                clean_ticker,

            "status":
                "unavailable",

            "raw_currency":
                raw_currency,

            "currency":
                None,

            "price_scale":
                None,

            "source":
                source,

            "error":
                (
                    "Trading currency could not "
                    "be normalised."
                ),
        }


    return {
        "ticker":
            clean_ticker,

        "status":
            "available",

        "raw_currency":
            raw_currency,

        "currency":
            currency,

        "price_scale":
            float(
                price_scale
            ),

        "source":
            source,

        "error":
            None,
    }


def resolve_currency_map(
    tickers,
):
    """
    Resolve multiple instruments while
    preserving explicit unavailable states.
    """

    results = {}


    for ticker in tickers:

        clean_ticker = (
            _clean_ticker(
                ticker
            )
        )


        if clean_ticker in results:
            continue


        results[
            clean_ticker
        ] = (
            resolve_trading_currency(
                clean_ticker
            )
        )


    return results
