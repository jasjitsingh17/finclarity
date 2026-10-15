import math

import numpy as np
import pandas as pd

from backend.market_data import (
    calculate_daily_returns,
    get_historical_prices,
)

from backend.base_currency_market_service import (
    prepare_performance_market_data,
)


TRADING_DAYS = 252


def _normalise_weights(
    tickers,
    weights,
):
    if len(tickers) != len(weights):
        raise ValueError(
            "Tickers and weights must have the same length."
        )


    if not tickers:
        raise ValueError(
            "At least one holding is required."
        )


    values = np.asarray(
        weights,
        dtype=float,
    )


    if not np.all(
        np.isfinite(
            values
        )
    ):
        raise ValueError(
            "Weights must be finite numbers."
        )


    if np.any(
        values < 0
    ):
        raise ValueError(
            "Weights cannot be negative."
        )


    total = float(
        values.sum()
    )


    if total <= 0:
        raise ValueError(
            "Weights must sum to a positive value."
        )


    values = (
        values
        / total
    )


    return {
        ticker:
            float(weight)
        for ticker, weight
        in zip(
            tickers,
            values,
        )
    }


def _compound_return(
    returns,
):
    values = np.asarray(
        returns,
        dtype=float,
    )


    return float(
        np.prod(
            1.0 + values
        )
        - 1.0
    )


def _annualised_return(
    returns,
):
    observations = len(
        returns
    )


    if observations <= 0:
        return 0.0


    cumulative = (
        _compound_return(
            returns
        )
    )


    if cumulative <= -1.0:
        return -1.0


    return float(
        (
            1.0
            + cumulative
        )
        ** (
            TRADING_DAYS
            / observations
        )
        - 1.0
    )


def _annualised_volatility(
    returns,
):
    return float(
        pd.Series(
            returns
        ).std(
            ddof=1
        )
        * math.sqrt(
            TRADING_DAYS
        )
    )


def _wealth_index(
    returns,
):
    series = pd.Series(
        returns
    )


    return (
        1.0
        + series
    ).cumprod()


def _max_drawdown(
    returns,
):
    wealth = (
        _wealth_index(
            returns
        )
    )


    running_peak = (
        wealth.cummax()
    )


    drawdown = (
        wealth
        / running_peak
        - 1.0
    )


    return float(
        drawdown.min()
    )


def _safe_beta(
    portfolio,
    benchmark,
):
    benchmark_variance = float(
        np.var(
            benchmark,
            ddof=1,
        )
    )


    if benchmark_variance <= 0:
        return None


    covariance = float(
        np.cov(
            portfolio,
            benchmark,
            ddof=1,
        )[0, 1]
    )


    return float(
        covariance
        / benchmark_variance
    )


def _safe_correlation(
    portfolio,
    benchmark,
):
    if (
        np.std(
            portfolio,
            ddof=1,
        ) == 0
        or np.std(
            benchmark,
            ddof=1,
        ) == 0
    ):
        return None


    return float(
        np.corrcoef(
            portfolio,
            benchmark,
        )[0, 1]
    )


def _tracking_error(
    portfolio,
    benchmark,
):
    active_returns = (
        portfolio
        - benchmark
    )


    return float(
        np.std(
            active_returns,
            ddof=1,
        )
        * math.sqrt(
            TRADING_DAYS
        )
    )


def _information_ratio(
    portfolio,
    benchmark,
):
    active_returns = (
        portfolio
        - benchmark
    )


    tracking_error = (
        _tracking_error(
            portfolio,
            benchmark,
        )
    )


    if tracking_error <= 0:
        return None


    annualised_active_return = float(
        np.mean(
            active_returns
        )
        * TRADING_DAYS
    )


    return float(
        annualised_active_return
        / tracking_error
    )


def analyse_performance_from_returns(
    asset_returns,
    tickers,
    weights,
    benchmark_returns,
    benchmark_ticker="ACWI",
):
    """
    Historical constant-weight simulation.

    Today's portfolio weights are applied to
    historical daily returns. This is not the
    investor's realised historical performance.
    """

    if not isinstance(
        asset_returns,
        pd.DataFrame,
    ):
        raise TypeError(
            "asset_returns must be a pandas DataFrame."
        )


    if not isinstance(
        benchmark_returns,
        pd.Series,
    ):
        raise TypeError(
            "benchmark_returns must be a pandas Series."
        )


    weight_map = (
        _normalise_weights(
            tickers,
            weights,
        )
    )


    available = [
        ticker
        for ticker
        in tickers
        if ticker
        in asset_returns.columns
    ]


    if not available:
        raise ValueError(
            "No holdings have usable historical return data."
        )


    data = (
        asset_returns[
            available
        ]
        .join(
            benchmark_returns.rename(
                "benchmark"
            ),
            how="inner",
        )
        .dropna()
    )


    if len(data) < 30:
        raise ValueError(
            "Insufficient overlapping return history."
        )


    available_weights = np.array(
        [
            weight_map[
                ticker
            ]
            for ticker
            in available
        ],
        dtype=float,
    )


    available_weights = (
        available_weights
        / available_weights.sum()
    )


    portfolio_returns = (
        data[
            available
        ].to_numpy()
        @ available_weights
    )


    benchmark = (
        data[
            "benchmark"
        ].to_numpy(
            dtype=float
        )
    )


    portfolio_cumulative = (
        _compound_return(
            portfolio_returns
        )
    )


    benchmark_cumulative = (
        _compound_return(
            benchmark
        )
    )


    portfolio_annualised = (
        _annualised_return(
            portfolio_returns
        )
    )


    benchmark_annualised = (
        _annualised_return(
            benchmark
        )
    )


    portfolio_volatility = (
        _annualised_volatility(
            portfolio_returns
        )
    )


    benchmark_volatility = (
        _annualised_volatility(
            benchmark
        )
    )


    portfolio_drawdown = (
        _max_drawdown(
            portfolio_returns
        )
    )


    benchmark_drawdown = (
        _max_drawdown(
            benchmark
        )
    )


    beta = (
        _safe_beta(
            portfolio_returns,
            benchmark,
        )
    )


    correlation = (
        _safe_correlation(
            portfolio_returns,
            benchmark,
        )
    )


    tracking_error = (
        _tracking_error(
            portfolio_returns,
            benchmark,
        )
    )


    information_ratio = (
        _information_ratio(
            portfolio_returns,
            benchmark,
        )
    )


    portfolio_wealth = (
        _wealth_index(
            portfolio_returns
        )
    )


    benchmark_wealth = (
        _wealth_index(
            benchmark
        )
    )


    baseline_date = (
        pd.Timestamp(
            data.index[0]
        )
        - pd.offsets.BDay(
            1
        )
    )


    start_date = (
        baseline_date
    )


    end_date = (
        data.index[-1]
    )


    chart = []


    # Add an explicit starting wealth index of 1.0.
    # Without this baseline, a "Growth of £10,000"
    # chart begins after the first daily return and
    # can therefore appear to start above/below £10,000.



    chart.append(
        {
            "date":
                str(
                    baseline_date.date()
                ),

            "portfolio":
                1.0,

            "benchmark":
                1.0,
        }
    )


    for (
        date,
        portfolio_value,
        benchmark_value,
    ) in zip(
        data.index,
        portfolio_wealth,
        benchmark_wealth,
    ):

        chart.append(
            {
                "date":
                    str(
                        pd.Timestamp(
                            date
                        ).date()
                    ),

                "portfolio":
                    round(
                        float(
                            portfolio_value
                        ),
                        6,
                    ),

                "benchmark":
                    round(
                        float(
                            benchmark_value
                        ),
                        6,
                    ),
            }
        )


    holding_metrics = []


    for (
        ticker,
        weight,
    ) in zip(
        available,
        available_weights,
    ):

        holding_return = (
            _compound_return(
                data[
                    ticker
                ].to_numpy(
                    dtype=float
                )
            )
        )


        holding_metrics.append(
            {
                "ticker":
                    ticker,

                "weight":
                    round(
                        float(
                            weight
                        ),
                        6,
                    ),

                "historical_return":
                    round(
                        holding_return,
                        6,
                    ),

                "annualised_volatility":
                    round(
                        _annualised_volatility(
                            data[
                                ticker
                            ].to_numpy(
                                dtype=float
                            )
                        ),
                        6,
                    ),
            }
        )


    holding_metrics.sort(
        key=lambda item:
            item[
                "weight"
            ],
        reverse=True,
    )


    daily_outperformance_rate = float(
        np.mean(
            portfolio_returns
            > benchmark
        )
    )


    return {
        "benchmark":
            benchmark_ticker,

        "observations":
            int(
                len(data)
            ),

        "start_date":
            str(
                pd.Timestamp(
                    start_date
                ).date()
            ),

        "end_date":
            str(
                pd.Timestamp(
                    end_date
                ).date()
            ),

        "portfolio":
            {
                "cumulative_return":
                    round(
                        portfolio_cumulative,
                        6,
                    ),

                "annualised_return":
                    round(
                        portfolio_annualised,
                        6,
                    ),

                "annualised_volatility":
                    round(
                        portfolio_volatility,
                        6,
                    ),

                "max_drawdown":
                    round(
                        portfolio_drawdown,
                        6,
                    ),
            },

        "benchmark_metrics":
            {
                "cumulative_return":
                    round(
                        benchmark_cumulative,
                        6,
                    ),

                "annualised_return":
                    round(
                        benchmark_annualised,
                        6,
                    ),

                "annualised_volatility":
                    round(
                        benchmark_volatility,
                        6,
                    ),

                "max_drawdown":
                    round(
                        benchmark_drawdown,
                        6,
                    ),
            },

        "relative":
            {
                "cumulative_return_difference":
                    round(
                        portfolio_cumulative
                        - benchmark_cumulative,
                        6,
                    ),

                "annualised_return_difference":
                    round(
                        portfolio_annualised
                        - benchmark_annualised,
                        6,
                    ),

                "beta":
                    (
                        round(
                            beta,
                            6,
                        )
                        if beta
                        is not None
                        else None
                    ),

                "correlation":
                    (
                        round(
                            correlation,
                            6,
                        )
                        if correlation
                        is not None
                        else None
                    ),

                "tracking_error":
                    round(
                        tracking_error,
                        6,
                    ),

                "information_ratio":
                    (
                        round(
                            information_ratio,
                            6,
                        )
                        if information_ratio
                        is not None
                        else None
                    ),

                "daily_outperformance_rate":
                    round(
                        daily_outperformance_rate,
                        6,
                    ),
            },

        "holding_metrics":
            holding_metrics,

        "chart":
            chart,

        "methodology":
            {
                "simulation":
                    "constant_weight_daily_rebalanced",

                "description":
                    (
                        "Historical performance is a hypothetical "
                        "constant-weight simulation using today's "
                        "portfolio weights. It is not the investor's "
                        "realised historical return and does not include "
                        "taxes, transaction costs or historical cash flows."
                    ),
            },
    }


def analyse_performance(
    tickers,
    weights,
    benchmark="ACWI",
    years=3,
    base_currency="USD",
):
    """
    Historical constant-weight portfolio
    simulation in one common investor
    base currency.

    Adjusted security and benchmark prices
    are converted into the portfolio base
    currency BEFORE daily returns and risk
    statistics are calculated.

    This is not realised investor performance.
    """

    cleaned_tickers = [
        str(
            ticker
        )
        .strip()
        .upper()
        for ticker
        in tickers
    ]


    if any(
        not ticker
        for ticker
        in cleaned_tickers
    ):

        raise ValueError(
            "Ticker values cannot be empty."
        )


    if (
        len(
            set(
                cleaned_tickers
            )
        )
        != len(
            cleaned_tickers
        )
    ):

        raise ValueError(
            "Ticker list cannot contain duplicates."
        )


    # Validate weights before any network work.
    _normalise_weights(
        cleaned_tickers,
        weights,
    )


    benchmark = (
        str(
            benchmark
            or ""
        )
        .strip()
        .upper()
    )


    if not benchmark:

        raise ValueError(
            "Benchmark cannot be empty."
        )


    base_currency = (
        str(
            base_currency
            or ""
        )
        .strip()
    )


    if not base_currency:

        raise ValueError(
            "Base currency cannot be empty."
        )


    prepared = (
        prepare_performance_market_data(
            tickers=
                cleaned_tickers,

            benchmark=
                benchmark,

            years=
                years,

            base_currency=
                base_currency,
        )
    )


    result = (
        analyse_performance_from_returns(
            asset_returns=
                prepared[
                    "asset_returns"
                ],

            tickers=
                cleaned_tickers,

            weights=
                weights,

            benchmark_returns=
                prepared[
                    "benchmark_returns"
                ],

            benchmark_ticker=
                benchmark,
        )
    )


    # ------------------------------------------------------
    # MARKET / AVAILABILITY METADATA
    # ------------------------------------------------------

    result[
        "benchmark"
    ] = benchmark


    # ------------------------------------------------------
    # PORTFOLIO DATA COVERAGE
    # ------------------------------------------------------
    #
    # The metric engine re-normalises weights across
    # holdings that have usable historical data.
    # Preserve the original requested-weight coverage
    # so consumers can clearly disclose when part of
    # the portfolio was excluded.

    requested_weight_map = (
        _normalise_weights(
            cleaned_tickers,
            weights,
        )
    )


    analysed_weight = float(
        sum(
            requested_weight_map[
                ticker
            ]
            for ticker
            in prepared[
                "available_tickers"
            ]
            if ticker
            in requested_weight_map
        )
    )


    analysed_weight = min(
        max(
            analysed_weight,
            0.0,
        ),
        1.0,
    )


    excluded_weight = (
        1.0
        - analysed_weight
    )


    result[
        "data_coverage"
    ] = {
        "requested_holding_count":
            len(
                cleaned_tickers
            ),

        "analysed_holding_count":
            len(
                prepared[
                    "available_tickers"
                ]
            ),

        "weight_coverage":
            round(
                analysed_weight,
                6,
            ),

        "excluded_weight":
            round(
                excluded_weight,
                6,
            ),

        "weights_renormalised":
            bool(
                excluded_weight
                > 1e-9
            ),

        "excluded_tickers":
            prepared[
                "missing_tickers"
            ],
    }


    result[
        "requested_tickers"
    ] = prepared[
        "requested_tickers"
    ]


    result[
        "available_tickers"
    ] = prepared[
        "available_tickers"
    ]


    result[
        "missing_tickers"
    ] = prepared[
        "missing_tickers"
    ]


    result[
        "lookback_years"
    ] = years


    result[
        "benchmark_available"
    ] = prepared[
        "benchmark_available"
    ]


    # ------------------------------------------------------
    # COMMON-CURRENCY METADATA
    # ------------------------------------------------------

    result[
        "base_currency"
    ] = prepared[
        "base_currency"
    ]


    result[
        "currency_conversion"
    ] = prepared[
        "conversion"
    ]


    result[
        "market_data"
    ] = {
        "observations":
            prepared[
                "observations"
            ],

        "start_date":
            prepared[
                "start_date"
            ],

        "end_date":
            prepared[
                "end_date"
            ],
    }


    methodology = (
        result.get(
            "methodology"
        )
    )


    if not isinstance(
        methodology,
        dict,
    ):

        methodology = {}


    methodology[
        "base_currency"
    ] = prepared[
        "base_currency"
    ]


    methodology[
        "currency_treatment"
    ] = (
        "Historical adjusted prices for holdings "
        "and the benchmark are converted into the "
        "portfolio base currency before returns, "
        "volatility, drawdown, beta, correlation, "
        "tracking error and relative performance "
        "are calculated."
    )


    methodology[
        "fx_alignment"
    ] = (
        "Historical FX observations may be "
        "forward-filled across non-FX trading "
        "days; future FX observations are never "
        "backfilled into earlier dates."
    )


    result[
        "methodology"
    ] = methodology


    return result
