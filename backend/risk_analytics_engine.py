import numpy as np
import pandas as pd


TRADING_DAYS = 252


def normalise_weights(
    weights,
):
    weights = np.asarray(
        weights,
        dtype=float,
    )

    if len(weights) == 0:
        raise ValueError(
            "Weights cannot be empty."
        )

    if np.any(weights < 0):
        raise ValueError(
            "Weights must be non-negative."
        )

    total = weights.sum()

    if total <= 0:
        raise ValueError(
            "Weights must sum to more than zero."
        )

    return weights / total


def portfolio_return_series(
    asset_returns,
    weights,
):
    weights = normalise_weights(
        weights
    )

    if (
        asset_returns.shape[1]
        != len(weights)
    ):
        raise ValueError(
            "Number of weights must match "
            "number of assets."
        )

    values = (
        asset_returns.values
        @ weights
    )

    return pd.Series(
        values,
        index=asset_returns.index,
        name="portfolio",
    )


def historical_var(
    returns,
    confidence=0.95,
):
    returns = pd.Series(
        returns,
        dtype=float,
    ).dropna()

    alpha = 1.0 - confidence

    return float(
        returns.quantile(
            alpha
        )
    )


def historical_cvar(
    returns,
    confidence=0.95,
):
    returns = pd.Series(
        returns,
        dtype=float,
    ).dropna()

    var = historical_var(
        returns,
        confidence,
    )

    tail = returns[
        returns <= var
    ]

    if tail.empty:
        return var

    return float(
        tail.mean()
    )


def maximum_drawdown(
    returns,
):
    wealth = (
        1.0
        + pd.Series(
            returns,
            dtype=float,
        ).dropna()
    ).cumprod()

    peak = wealth.cummax()

    drawdown = (
        wealth / peak
        - 1.0
    )

    return float(
        drawdown.min()
    )


def calculate_beta(
    portfolio_returns,
    benchmark_returns,
):
    aligned = pd.concat(
        [
            portfolio_returns,
            benchmark_returns,
        ],
        axis=1,
    ).dropna()

    portfolio = (
        aligned.iloc[:, 0]
    )

    benchmark = (
        aligned.iloc[:, 1]
    )

    benchmark_variance = (
        benchmark.var(
            ddof=1
        )
    )

    if benchmark_variance <= 0:
        return 0.0

    covariance = np.cov(
        portfolio,
        benchmark,
        ddof=1,
    )[0, 1]

    return float(
        covariance
        / benchmark_variance
    )


def calculate_sortino(
    returns,
    risk_free_rate=0.0,
):
    returns = pd.Series(
        returns,
        dtype=float,
    ).dropna()

    annual_return = (
        returns.mean()
        * TRADING_DAYS
    )

    downside = returns[
        returns < 0
    ]

    if downside.empty:
        return 0.0

    downside_deviation = (
        downside.std(
            ddof=1
        )
        * np.sqrt(
            TRADING_DAYS
        )
    )

    if downside_deviation <= 0:
        return 0.0

    return float(
        (
            annual_return
            - risk_free_rate
        )
        / downside_deviation
    )


def rolling_period_return(
    returns,
    window,
):
    returns = pd.Series(
        returns,
        dtype=float,
    ).dropna()

    if len(returns) < window:
        return None

    compounded = (
        1.0 + returns
    ).rolling(
        window
    ).apply(
        np.prod,
        raw=True,
    ) - 1.0

    compounded = (
        compounded.dropna()
    )

    if compounded.empty:
        return None

    worst_date = (
        compounded.idxmin()
    )

    return {
        "return":
            float(
                compounded.loc[
                    worst_date
                ]
            ),

        "end_date":
            worst_date.strftime(
                "%Y-%m-%d"
            ),
    }


def calculate_risk_contributions(
    covariance_matrix,
    weights,
    tickers,
):
    weights = normalise_weights(
        weights
    )

    covariance_matrix = np.asarray(
        covariance_matrix,
        dtype=float,
    )

    portfolio_variance = float(
        weights.T
        @ covariance_matrix
        @ weights
    )

    if portfolio_variance <= 0:
        contributions = np.zeros(
            len(weights)
        )

    else:
        marginal = (
            covariance_matrix
            @ weights
        )

        contributions = (
            weights
            * marginal
            / portfolio_variance
        )

    return [
        {
            "ticker":
                ticker,

            "weight":
                float(weight),

            "risk_contribution":
                float(contribution),
        }

        for (
            ticker,
            weight,
            contribution,
        ) in zip(
            tickers,
            weights,
            contributions,
        )
    ]


def build_risk_analytics(
    asset_returns,
    benchmark_returns,
    weights,
    tickers,
    risk_free_rate=0.04,
):
    weights = normalise_weights(
        weights
    )

    portfolio_returns = (
        portfolio_return_series(
            asset_returns,
            weights,
        )
    )

    annual_return = float(
        portfolio_returns.mean()
        * TRADING_DAYS
    )

    annual_volatility = float(
        portfolio_returns.std(
            ddof=1
        )
        * np.sqrt(
            TRADING_DAYS
        )
    )

    sharpe = (
        (
            annual_return
            - risk_free_rate
        )
        / annual_volatility
        if annual_volatility > 0
        else 0.0
    )

    sortino = (
        calculate_sortino(
            portfolio_returns,
            risk_free_rate,
        )
    )

    beta = calculate_beta(
        portfolio_returns,
        benchmark_returns,
    )

    correlation = float(
        portfolio_returns.corr(
            benchmark_returns
        )
    )

    covariance_matrix = (
        asset_returns.cov()
        * TRADING_DAYS
    ).values

    contributions = (
        calculate_risk_contributions(
            covariance_matrix,
            weights,
            tickers,
        )
    )

    hhi = float(
        np.sum(
            weights ** 2
        )
    )

    effective_holdings = (
        float(
            1.0 / hhi
        )
        if hhi > 0
        else 0.0
    )

    largest_index = int(
        np.argmax(
            weights
        )
    )

    worst_day_index = (
        portfolio_returns.idxmin()
    )

    correlation_matrix = (
        asset_returns.corr()
    )

    matrix = {
        row: {
            column:
                float(
                    correlation_matrix.loc[
                        row,
                        column,
                    ]
                )

            for column in tickers
        }

        for row in tickers
    }

    return {
        "summary": {
            "annualised_return":
                annual_return,

            "annualised_volatility":
                annual_volatility,

            "sharpe_ratio":
                float(
                    sharpe
                ),

            "sortino_ratio":
                float(
                    sortino
                ),

            "var_95":
                historical_var(
                    portfolio_returns,
                    0.95,
                ),

            "cvar_95":
                historical_cvar(
                    portfolio_returns,
                    0.95,
                ),

            "var_99":
                historical_var(
                    portfolio_returns,
                    0.99,
                ),

            "cvar_99":
                historical_cvar(
                    portfolio_returns,
                    0.99,
                ),

            "max_drawdown":
                maximum_drawdown(
                    portfolio_returns
                ),

            "beta":
                beta,

            "benchmark_correlation":
                correlation,
        },

        "concentration": {
            "hhi":
                hhi,

            "effective_holdings":
                effective_holdings,

            "largest_position": {
                "ticker":
                    tickers[
                        largest_index
                    ],

                "weight":
                    float(
                        weights[
                            largest_index
                        ]
                    ),
            },
        },

        "risk_contributions":
            contributions,

        "correlation_matrix":
            matrix,

        "historical_stress": {
            "worst_day": {
                "return":
                    float(
                        portfolio_returns.loc[
                            worst_day_index
                        ]
                    ),

                "date":
                    worst_day_index.strftime(
                        "%Y-%m-%d"
                    ),
            },

            "worst_5_day":
                rolling_period_return(
                    portfolio_returns,
                    5,
                ),

            "worst_21_day":
                rolling_period_return(
                    portfolio_returns,
                    21,
                ),
        },
    }
