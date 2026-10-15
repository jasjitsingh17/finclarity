from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf


TRADING_DAYS = 252
MINIMUM_OBSERVATIONS = 60


# ========================================
# HISTORICAL MARKET PRICES
# ========================================

def get_historical_prices(
    tickers,
    years=3,
):
    """
    Download adjusted historical closing prices.

    Uses a network timeout and disables
    yfinance threading to make local
    development more predictable.
    """

    clean_tickers = [
        ticker.strip().upper()
        for ticker in tickers
        if ticker.strip()
    ]


    if len(clean_tickers) < 1:
        raise ValueError(
            "At least one valid ticker "
            "is required."
        )


    end_date = datetime.today()

    start_date = (
        end_date -
        timedelta(
            days=365 * years
        )
    )


    try:

        data = yf.download(
            tickers=clean_tickers,
            start=start_date,
            end=end_date,
            auto_adjust=True,
            progress=False,
            threads=False,
            timeout=10,
        )

    except Exception as error:

        raise ValueError(
            "Market data download failed. "
            "Please try again."
        ) from error


    if data.empty:

        raise ValueError(
            "No historical market data "
            "was returned."
        )


    # ------------------------------------
    # EXTRACT CLOSING PRICES
    # ------------------------------------

    try:

        prices = data["Close"]

    except KeyError as error:

        raise ValueError(
            "Closing-price data was unavailable."
        ) from error


    if isinstance(
        prices,
        pd.Series,
    ):

        prices = prices.to_frame(
            name=clean_tickers[0]
        )


    prices = (
        prices
        .sort_index()
        .ffill()
        .dropna(
            how="all"
        )
    )


    # ------------------------------------
    # CHECK AVAILABLE TICKERS
    # ------------------------------------

    # A Yahoo column existing does not necessarily
    # mean that usable market data exists. Invalid
    # symbols can be returned as columns containing
    # only NaN values.
    #
    # Treat an instrument as available only when it
    # has enough genuine historical observations to
    # support the downstream analytics.
    available_tickers = []


    for ticker in clean_tickers:

        if ticker not in prices.columns:
            continue


        usable = (
            pd.to_numeric(
                prices[
                    ticker
                ],
                errors="coerce",
            )
            .dropna()
        )


        if (
            len(
                usable
            )
            >= MINIMUM_OBSERVATIONS
        ):

            available_tickers.append(
                ticker
            )


    minimum_available = (
        1
        if len(clean_tickers) == 1
        else 2
    )


    if len(available_tickers) < minimum_available:

        if minimum_available == 1:

            raise ValueError(
                "Historical data could not be "
                "retrieved for the requested asset."
            )


        raise ValueError(
            "Historical data could not be "
            "retrieved for at least two assets."
        )


    prices = (
        prices[
            available_tickers
        ]
        .dropna()
    )


    if (
        len(prices)
        < MINIMUM_OBSERVATIONS
    ):

        raise ValueError(
            "Not enough overlapping historical "
            "observations were available."
        )


    return (
        prices,
        clean_tickers,
        available_tickers,
    )


# ========================================
# DAILY RETURNS
# ========================================

def calculate_daily_returns(
    prices,
):
    """
    Calculate simple daily percentage returns.
    """

    returns = (
        prices
        .pct_change(
            fill_method=None
        )
        .dropna()
    )


    if returns.empty:

        raise ValueError(
            "Unable to calculate historical returns."
        )


    return returns


# ========================================
# EXPECTED RETURNS
# ========================================

def annualised_expected_returns(
    daily_returns,
):
    """
    Annualised arithmetic mean return.

    This is our first estimator.
    We will improve it later with
    shrinkage / factor-based estimates.
    """

    return (
        daily_returns.mean()
        * TRADING_DAYS
    )


# ========================================
# COVARIANCE MATRIX
# ========================================

def annualised_covariance_matrix(
    daily_returns,
):
    """
    Annualised historical covariance matrix.
    """

    return (
        daily_returns.cov()
        * TRADING_DAYS
    )


# ========================================
# BUILD MARKET MODEL
# ========================================

# ========================================
# INTERNAL MARKET ANALYSIS
# ========================================

def build_market_analysis(
    tickers,
    years=3,
):
    """
    Build both the JSON-safe market model
    and the internal daily-return dataset.
    """

    (
        prices,
        requested_tickers,
        available_tickers,
    ) = get_historical_prices(
        tickers,
        years,
    )

    daily_returns = (
        calculate_daily_returns(
            prices
        )
    )

    expected_returns = (
        annualised_expected_returns(
            daily_returns
        )
    )

    covariance_matrix = (
        annualised_covariance_matrix(
            daily_returns
        )
    )

    missing_tickers = [
        ticker
        for ticker in requested_tickers
        if ticker not in available_tickers
    ]

    market_model = {

        "tickers":
            available_tickers,

        "missing_tickers":
            missing_tickers,

        "expected_returns":
            expected_returns.tolist(),

        "covariance_matrix":
            covariance_matrix
            .values
            .tolist(),

        "observations":
            int(
                len(daily_returns)
            ),

        "start_date":
            prices.index[0]
            .strftime("%Y-%m-%d"),

        "end_date":
            prices.index[-1]
            .strftime("%Y-%m-%d"),

        "methodology": {
            "return_estimator":
                "Annualised arithmetic mean",

            "covariance_estimator":
                "Historical sample covariance",

            "trading_days":
                TRADING_DAYS,
        },
    }

    return (
        market_model,
        daily_returns,
    )


# ========================================
# PUBLIC MARKET MODEL
# ========================================

def build_market_model(
    tickers,
    years=3,
):
    """
    JSON-safe model used by
    /api/market/model.
    """

    market_model, _ = (
        build_market_analysis(
            tickers,
            years,
        )
    )

    return market_model
