import pandas as pd
import yfinance as yf


# ==========================================================
# CURRENCY NORMALISATION
# ==========================================================

def normalise_currency(
    currency,
):
    """
    Return:
        major currency code,
        price scale factor.

    GBp / GBX are pence-denominated GBP prices.
    A quoted price of 250 GBp therefore equals £2.50.
    """

    code = str(
        currency
        or ""
    ).strip()


    if not code:

        raise ValueError(
            "Currency cannot be empty."
        )


    upper = (
        code.upper()
    )


    # Pence-denominated London prices must be
    # identified BEFORE generic GBP handling.
    # "GBp".upper() is "GBP", so checking GBP
    # first would incorrectly assign scale 1.0.
    if (
        code == "GBp"
        or upper in (
            "GBPENCE",
            "GBX",
        )
    ):

        return (
            "GBP",
            0.01,
        )


    if upper == "GBP":

        return (
            "GBP",
            1.0,
        )


    return (
        upper,
        1.0,
    )


# ==========================================================
# FX SYMBOLS
# ==========================================================

def yahoo_fx_symbol(
    source_currency,
    target_currency,
):
    source, _ = (
        normalise_currency(
            source_currency
        )
    )

    target, _ = (
        normalise_currency(
            target_currency
        )
    )


    if source == target:
        return None


    return (
        f"{source}{target}=X"
    )


# ==========================================================
# SERIES VALIDATION
# ==========================================================

def _clean_series(
    series,
    name,
):

    if not isinstance(
        series,
        pd.Series,
    ):

        raise TypeError(
            f"{name} must be a pandas Series."
        )


    cleaned = (
        pd.to_numeric(
            series,
            errors="coerce",
        )
        .sort_index()
        .dropna()
    )


    if cleaned.empty:

        raise ValueError(
            f"{name} contains no usable observations."
        )


    if (
        cleaned <= 0
    ).any():

        raise ValueError(
            f"{name} must contain positive values."
        )


    return cleaned


# ==========================================================
# PURE PRICE CONVERSION
# ==========================================================

def convert_price_series(
    prices,
    source_currency,
    base_currency,
    fx_rates=None,
):
    """
    Convert a security price series into the
    portfolio base currency.

    FX convention:
        target currency units per
        1 source currency unit.

    Example:
        AAPL price = 200 USD
        USDGBP = 0.78
        GBP value = 156 GBP
    """

    prices = (
        _clean_series(
            prices,
            "prices",
        )
    )


    source, scale = (
        normalise_currency(
            source_currency
        )
    )


    base, _ = (
        normalise_currency(
            base_currency
        )
    )


    major_unit_prices = (
        prices
        * scale
    )


    if source == base:

        return (
            major_unit_prices
            .rename(
                prices.name
            )
        )


    if fx_rates is None:

        raise ValueError(
            "FX rates are required when "
            "source and base currencies differ."
        )


    fx_rates = (
        _clean_series(
            fx_rates,
            "fx_rates",
        )
    )


    # Align without using future FX observations.
    #
    # We first create the union of FX dates and
    # security-price dates so a rate observed
    # BEFORE the first security date can be
    # forward-filled into that date.
    #
    # We deliberately do not backfill because
    # that would introduce look-ahead bias.
    combined_index = (
        fx_rates.index
        .union(
            major_unit_prices.index
        )
        .sort_values()
    )


    aligned_fx = (
        fx_rates
        .reindex(
            combined_index
        )
        .ffill()
        .reindex(
            major_unit_prices.index
        )
    )


    if aligned_fx.isna().any():

        raise ValueError(
            "FX history could not be aligned "
            "without using future observations."
        )


    converted = (
        major_unit_prices
        * aligned_fx
    )


    converted.name = (
        prices.name
    )


    return converted


# ==========================================================
# YAHOO HISTORICAL FX DOWNLOAD
# ==========================================================

# ==========================================================
# LATEST / CURRENT FX QUOTE
# ==========================================================

def _download_latest_fx(
    symbol,
):
    """
    Return the latest usable Yahoo closing FX rate.

    Yahoo quotes SYMBOL as:
        destination currency units
        per one source currency unit.

    Example:
        USDGBP=X = GBP per 1 USD.
    """

    try:

        data = yf.download(
            tickers=symbol,
            period="5d",
            interval="1d",
            auto_adjust=True,
            progress=False,
            threads=False,
            timeout=10,
        )

    except Exception:

        return None


    if (
        data is None
        or data.empty
    ):

        return None


    try:

        close = (
            data[
                "Close"
            ]
        )

    except (
        KeyError,
        TypeError,
    ):

        return None


    if isinstance(
        close,
        pd.DataFrame,
    ):

        if close.shape[1] < 1:
            return None


        close = (
            close.iloc[
                :,
                0
            ]
        )


    close = (
        pd.to_numeric(
            close,
            errors="coerce",
        )
        .dropna()
    )


    if close.empty:
        return None


    rate = float(
        close.iloc[
            -1
        ]
    )


    if (
        not pd.notna(
            rate
        )
        or rate <= 0
    ):

        return None


    timestamp = (
        pd.Timestamp(
            close.index[
                -1
            ]
        )
    )


    return {
        "rate":
            rate,

        "timestamp":
            timestamp,
    }


def get_fx_quote(
    from_currency,
    to_currency,
):
    """
    Return the latest available FX conversion rate.

    `rate` always means:
        units of destination currency
        per one unit of source currency.

    Example:
        from USD to GBP
        rate 0.75
        => 1 USD = 0.75 GBP.

    Direct Yahoo pairs are preferred. If Yahoo
    only provides the inverse pair, FinClarity
    safely inverts it.
    """

    source, _ = (
        normalise_currency(
            from_currency
        )
    )


    destination, _ = (
        normalise_currency(
            to_currency
        )
    )


    # Same-currency conversion requires
    # no market-data request.
    if source == destination:

        return {
            "from_currency":
                source,

            "to_currency":
                destination,

            "rate":
                1.0,

            "symbol":
                None,

            "source":
                "identity",

            "as_of":
                None,
        }


    direct_symbol = (
        f"{source}"
        f"{destination}=X"
    )


    direct = (
        _download_latest_fx(
            direct_symbol
        )
    )


    if direct is not None:

        timestamp = (
            direct[
                "timestamp"
            ]
        )


        return {
            "from_currency":
                source,

            "to_currency":
                destination,

            "rate":
                round(
                    float(
                        direct[
                            "rate"
                        ]
                    ),
                    8,
                ),

            "symbol":
                direct_symbol,

            "source":
                "Yahoo Finance",

            "as_of":
                timestamp.isoformat(),
        }


    # ------------------------------------------------------
    # FALLBACK: INVERSE PAIR
    # ------------------------------------------------------

    inverse_symbol = (
        f"{destination}"
        f"{source}=X"
    )


    inverse = (
        _download_latest_fx(
            inverse_symbol
        )
    )


    if inverse is None:

        raise ValueError(
            "FX rate could not be retrieved for "
            f"{source}/{destination}."
        )


    inverse_rate = float(
        inverse[
            "rate"
        ]
    )


    if inverse_rate <= 0:

        raise ValueError(
            "Invalid inverse FX rate returned "
            f"for {destination}/{source}."
        )


    timestamp = (
        inverse[
            "timestamp"
        ]
    )


    return {
        "from_currency":
            source,

        "to_currency":
            destination,

        "rate":
            round(
                1.0
                / inverse_rate,
                8,
            ),

        "symbol":
            inverse_symbol,

        "source":
            "Yahoo Finance (inverse)",

        "as_of":
            timestamp.isoformat(),
    }


def get_historical_fx_rates(
    source_currency,
    base_currency,
    start_date,
    end_date,
):
    """
    Download historical FX rates.

    Returns target/base currency units per
    one source currency unit.

    If Yahoo does not provide the direct pair,
    FinClarity attempts the inverse pair.
    """

    source, _ = (
        normalise_currency(
            source_currency
        )
    )


    base, _ = (
        normalise_currency(
            base_currency
        )
    )


    if source == base:

        return None


    direct_symbol = (
        f"{source}{base}=X"
    )


    inverse_symbol = (
        f"{base}{source}=X"
    )


    direct = _download_fx(
        direct_symbol,
        start_date,
        end_date,
    )


    if direct is not None:

        direct.name = (
            direct_symbol
        )

        return direct


    inverse = _download_fx(
        inverse_symbol,
        start_date,
        end_date,
    )


    if inverse is None:

        raise ValueError(
            "Historical FX data could not be "
            f"retrieved for {source}/{base}."
        )


    converted = (
        1.0
        / inverse
    )


    converted.name = (
        direct_symbol
    )


    return converted


def _download_fx(
    symbol,
    start_date,
    end_date,
):

    try:

        data = yf.download(
            tickers=symbol,
            start=start_date,
            end=end_date,
            auto_adjust=True,
            progress=False,
            threads=False,
            timeout=10,
        )

    except Exception:

        return None


    if (
        data is None
        or data.empty
    ):
        return None


    try:

        close = (
            data[
                "Close"
            ]
        )

    except (
        KeyError,
        TypeError,
    ):

        return None


    if isinstance(
        close,
        pd.DataFrame,
    ):

        if close.shape[1] < 1:
            return None

        close = (
            close.iloc[
                :,
                0
            ]
        )


    close = (
        pd.to_numeric(
            close,
            errors="coerce",
        )
        .sort_index()
        .dropna()
    )


    if close.empty:

        return None


    if (
        close <= 0
    ).any():

        return None


    return close
