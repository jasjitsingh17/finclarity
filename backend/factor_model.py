import numpy as np
import pandas as pd


TRADING_DAYS = 252


# ========================================
# HELPERS
# ========================================

def safe_standardise(
    values,
):
    """
    Cross-sectional z-score.

    Returns zeros when dispersion is
    effectively zero.
    """

    values = np.asarray(
        values,
        dtype=float,
    )

    mean = np.mean(
        values
    )

    standard_deviation = np.std(
        values
    )


    if (
        standard_deviation
        < 1e-12
    ):
        return np.zeros_like(
            values
        )


    return (
        values - mean
    ) / standard_deviation


# ========================================
# MARKET BETA
# ========================================

def calculate_beta(
    asset_returns,
    market_returns,
):
    """
    Beta relative to the selected
    market benchmark.
    """

    asset_returns = np.asarray(
        asset_returns,
        dtype=float,
    )

    market_returns = np.asarray(
        market_returns,
        dtype=float,
    )


    market_variance = np.var(
        market_returns,
        ddof=1,
    )


    if market_variance <= 0:
        return 0.0


    covariance = np.cov(
        asset_returns,
        market_returns,
        ddof=1,
    )[0, 1]


    return float(
        covariance
        / market_variance
    )


# ========================================
# MOMENTUM
# ========================================

def calculate_momentum(
    prices,
    lookback_days=252,
    skip_days=21,
):
    """
    Approximate 12-1 momentum.

    Uses the price roughly 12 months ago
    versus the price roughly one month ago.
    """

    prices = np.asarray(
        prices,
        dtype=float,
    )


    required = (
        lookback_days
        + 1
    )


    if len(prices) < required:

        raise ValueError(
            "Not enough price history "
            "for momentum calculation."
        )


    start_price = prices[
        -required
    ]


    end_index = (
        -skip_days - 1
        if skip_days > 0
        else -1
    )


    end_price = prices[
        end_index
    ]


    if start_price <= 0:
        return 0.0


    return float(
        end_price
        / start_price
        - 1.0
    )


# ========================================
# VOLATILITY
# ========================================

def calculate_volatility(
    returns,
):
    returns = np.asarray(
        returns,
        dtype=float,
    )


    return float(
        np.std(
            returns,
            ddof=1,
        )
        * np.sqrt(
            TRADING_DAYS
        )
    )


# ========================================
# IDIOSYNCRATIC RISK
# ========================================

def calculate_idiosyncratic_volatility(
    asset_returns,
    market_returns,
):
    """
    Residual volatility from a simple
    market-model regression.
    """

    asset_returns = np.asarray(
        asset_returns,
        dtype=float,
    )

    market_returns = np.asarray(
        market_returns,
        dtype=float,
    )


    beta = calculate_beta(
        asset_returns,
        market_returns,
    )


    alpha = (
        np.mean(
            asset_returns
        )
        -
        beta
        * np.mean(
            market_returns
        )
    )


    residuals = (
        asset_returns
        -
        (
            alpha
            +
            beta
            * market_returns
        )
    )


    return float(
        np.std(
            residuals,
            ddof=1,
        )
        * np.sqrt(
            TRADING_DAYS
        )
    )


# ========================================
# COMPLETE FACTOR MODEL
# ========================================


DEFAULT_FACTOR_WEIGHTS = {
    "momentum": 0.35,
    "low_volatility": 0.20,
    "low_idiosyncratic_risk": 0.15,
    "sentiment_alpha": 0.30,
}


def resolve_factor_weights(
    factor_weights=None,
):

    if factor_weights is None:
        return dict(
            DEFAULT_FACTOR_WEIGHTS
        )


    if not isinstance(
        factor_weights,
        dict,
    ):
        raise ValueError(
            "Factor weights must be supplied "
            "as a dictionary."
        )


    required_keys = set(
        DEFAULT_FACTOR_WEIGHTS
    )

    supplied_keys = set(
        factor_weights
    )


    missing = (
        required_keys
        - supplied_keys
    )

    extra = (
        supplied_keys
        - required_keys
    )


    if missing:
        raise ValueError(
            "Missing factor weights: "
            + ", ".join(
                sorted(missing)
            )
        )


    if extra:
        raise ValueError(
            "Unknown factor weights: "
            + ", ".join(
                sorted(extra)
            )
        )


    resolved = {
        key: float(
            factor_weights[key]
        )
        for key in DEFAULT_FACTOR_WEIGHTS
    }


    for key, value in resolved.items():

        if (
            not np.isfinite(value)
            or value < 0
        ):
            raise ValueError(
                f"Factor weight '{key}' must "
                "be a finite non-negative number."
            )


    total = sum(
        resolved.values()
    )


    if not np.isclose(
        total,
        1.0,
        atol=1e-8,
    ):
        raise ValueError(
            "Factor weights must sum to 1.00. "
            f"Received {total:.6f}."
        )


    return resolved


def build_factor_model(
    prices,
    market_prices,
    sentiment_scores=None,
    factor_weights=None,):

    factor_weights = (
        resolve_factor_weights(
            factor_weights
        )
    )

    """
    Build FinClarity's first
    cross-sectional factor model.

    Factors:
    - momentum
    - low volatility
    - low idiosyncratic volatility
    - sentiment alpha

    Beta is reported as a risk exposure
    but is not rewarded mechanically.
    """

    if not isinstance(
        prices,
        pd.DataFrame,
    ):

        raise ValueError(
            "Asset prices must be a DataFrame."
        )


    if not isinstance(
        market_prices,
        pd.Series,
    ):

        market_prices = pd.Series(
            market_prices
        )


    combined = prices.join(
        market_prices.rename(
            "MARKET"
        ),
        how="inner",
    ).dropna()


    if len(combined) < 260:

        raise ValueError(
            "At least approximately one year "
            "of overlapping market data is required."
        )


    returns = (
        combined
        .pct_change(
            fill_method=None
        )
        .dropna()
    )


    market_returns = returns[
        "MARKET"
    ]


    tickers = list(
        prices.columns
    )


    rows = []


    for ticker in tickers:

        asset_returns = returns[
            ticker
        ]


        beta = calculate_beta(
            asset_returns,
            market_returns,
        )


        momentum = calculate_momentum(
            combined[
                ticker
            ].values
        )


        volatility = calculate_volatility(
            asset_returns
        )


        idiosyncratic_volatility = (
            calculate_idiosyncratic_volatility(
                asset_returns,
                market_returns,
            )
        )


        sentiment = 0.0


        if sentiment_scores:

            sentiment = float(
                sentiment_scores.get(
                    ticker,
                    0.0,
                )
            )


        rows.append(
            {
                "ticker":
                    ticker,

                "beta":
                    beta,

                "momentum":
                    momentum,

                "volatility":
                    volatility,

                "idiosyncratic_volatility":
                    idiosyncratic_volatility,

                "sentiment":
                    sentiment,
            }
        )


    momentum_values = [
        row["momentum"]
        for row in rows
    ]


    volatility_values = [
        row["volatility"]
        for row in rows
    ]


    idio_values = [
        row[
            "idiosyncratic_volatility"
        ]
        for row in rows
    ]


    sentiment_values = [
        row["sentiment"]
        for row in rows
    ]


    momentum_z = safe_standardise(
        momentum_values
    )


    low_vol_z = -safe_standardise(
        volatility_values
    )


    low_idio_z = -safe_standardise(
        idio_values
    )


    sentiment_z = safe_standardise(
        sentiment_values
    )


    for index, row in enumerate(
        rows
    ):

        composite_score = (
            factor_weights["momentum"]
            * momentum_z[index]
            +
            factor_weights["low_volatility"]
            * low_vol_z[index]
            +
            factor_weights["low_idiosyncratic_risk"]
            * low_idio_z[index]
            +
            factor_weights["sentiment_alpha"]
            * sentiment_z[index]
        )


        row[
            "factor_scores"
        ] = {

            "momentum":
                float(
                    momentum_z[index]
                ),

            "low_volatility":
                float(
                    low_vol_z[index]
                ),

            "low_idiosyncratic_risk":
                float(
                    low_idio_z[index]
                ),

            "sentiment_alpha":
                float(
                    sentiment_z[index]
                ),
        }


        row[
            "composite_alpha_score"
        ] = float(
            composite_score
        )


    ranked = sorted(
        rows,
        key=lambda row:
            row[
                "composite_alpha_score"
            ],
        reverse=True,
    )


    for rank, row in enumerate(
        ranked,
        start=1,
    ):

        row[
            "rank"
        ] = rank


    return {

        "assets":
            ranked,

        "factor_weights": dict(factor_weights),

        "methodology": {

            "momentum":
                "Approximate 12-1 price momentum",

            "beta":
                "OLS-style market beta exposure",

            "volatility":
                "Annualised historical volatility",

            "idiosyncratic_risk":
                (
                    "Annualised residual volatility "
                    "from single-factor market model"
                ),

            "sentiment":
                "FinBERT aggregated ticker sentiment",

            "composite":
                (
                    "Weighted cross-sectional "
                    "standardised factor score"
                ),
        },
    }
