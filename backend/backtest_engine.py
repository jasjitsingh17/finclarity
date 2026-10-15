import numpy as np
import pandas as pd

from backend.optimizer import (
    maximise_sharpe,
)


TRADING_DAYS = 252


# ========================================
# PERFORMANCE METRICS
# ========================================

def calculate_performance_metrics(
    returns,
    risk_free_rate=0.0,
):
    """
    Calculate standard portfolio
    performance statistics.
    """

    returns = pd.Series(
        returns,
        dtype=float,
    ).dropna()


    if returns.empty:

        raise ValueError(
            "Return series is empty."
        )


    observations = len(
        returns
    )


    annualised_return = (
        returns.mean()
        * TRADING_DAYS
    )


    annualised_volatility = (
        returns.std(
            ddof=1
        )
        * np.sqrt(
            TRADING_DAYS
        )
    )


    if annualised_volatility > 0:

        sharpe_ratio = (
            annualised_return
            - risk_free_rate
        ) / annualised_volatility

    else:

        sharpe_ratio = 0.0


    wealth = (
        1.0 + returns
    ).cumprod()


    cumulative_return = (
        wealth.iloc[-1]
        - 1.0
    )


    years = (
        observations
        / TRADING_DAYS
    )


    ending_wealth = float(
        wealth.iloc[-1]
    )


    if (
        years > 0
        and ending_wealth > 0
    ):

        cagr = (
            ending_wealth
            ** (1.0 / years)
            - 1.0
        )

    else:

        cagr = -1.0


    running_peak = (
        wealth.cummax()
    )


    drawdown = (
        wealth
        / running_peak
        - 1.0
    )


    maximum_drawdown = float(
        drawdown.min()
    )


    win_rate = float(
        (
            returns > 0
        ).mean()
    )


    return {

        "observations":
            int(
                observations
            ),

        "cumulative_return":
            float(
                cumulative_return
            ),

        "cagr":
            float(
                cagr
            ),

        "annualised_return":
            float(
                annualised_return
            ),

        "annualised_volatility":
            float(
                annualised_volatility
            ),

        "sharpe_ratio":
            float(
                sharpe_ratio
            ),

        "max_drawdown":
            maximum_drawdown,

        "win_rate":
            win_rate,
    }


# ========================================
# WALK-FORWARD BACKTEST
# ========================================

def run_walk_forward_backtest(
    prices,
    benchmark_prices,
    risk_free_rate=0.04,
    training_days=252,
    rebalance_days=21,
    min_weight=0.0,
    max_weight=1.0,
    transaction_cost_bps=10.0,
):
    """
    Walk-forward maximum-Sharpe backtest.

    Every rebalance:
      1. Use only trailing historical returns.
      2. Estimate expected returns/covariance.
      3. Optimise portfolio.
      4. Hold weights for next period.
      5. Apply transaction costs.

    No future observations enter
    the optimisation window.
    """

    if not isinstance(
        prices,
        pd.DataFrame,
    ):

        raise ValueError(
            "Asset prices must be a DataFrame."
        )


    if prices.shape[1] < 2:

        raise ValueError(
            "At least two assets are required."
        )


    if min_weight > max_weight:

        raise ValueError(
            "min_weight cannot exceed max_weight."
        )


    number_of_assets = (
        prices.shape[1]
    )


    if (
        number_of_assets
        * min_weight
        > 1.0 + 1e-9
    ):

        raise ValueError(
            "Minimum-weight constraint "
            "is infeasible."
        )


    if (
        number_of_assets
        * max_weight
        < 1.0 - 1e-9
    ):

        raise ValueError(
            "Maximum-weight constraint "
            "is infeasible."
        )


    benchmark_prices = (
        pd.Series(
            benchmark_prices
        )
        .rename(
            "BENCHMARK"
        )
    )


    combined_prices = (
        prices.join(
            benchmark_prices,
            how="inner",
        )
        .dropna()
    )


    if (
        len(combined_prices)
        <= training_days
        + rebalance_days
    ):

        raise ValueError(
            "Not enough historical data for "
            "the requested training window."
        )


    all_returns = (
        combined_prices
        .pct_change(
            fill_method=None
        )
        .dropna()
    )


    asset_returns = (
        all_returns[
            prices.columns
        ]
    )


    benchmark_returns = (
        all_returns[
            "BENCHMARK"
        ]
    )


    strategy_parts = []
    equal_weight_parts = []
    benchmark_parts = []

    weight_history = []

    previous_weights = None

    transaction_cost_rate = (
        transaction_cost_bps
        / 10000.0
    )


    rebalance_indices = range(
        training_days,
        len(asset_returns),
        rebalance_days,
    )


    for start_index in (
        rebalance_indices
    ):

        end_index = min(
            start_index
            + rebalance_days,
            len(asset_returns),
        )


        if (
            end_index
            <= start_index
        ):

            continue


        training_returns = (
            asset_returns.iloc[
                start_index
                - training_days:
                start_index
            ]
        )


        expected_returns = (
            training_returns.mean()
            * TRADING_DAYS
        ).values


        covariance_matrix = (
            training_returns.cov()
            * TRADING_DAYS
        ).values


        optimisation_status = (
            "optimised"
        )


        try:

            result = maximise_sharpe(
                expected_returns,
                covariance_matrix,
                risk_free_rate,
                min_weight,
                max_weight,
            )


            weights = np.asarray(
                result[
                    "weights"
                ],
                dtype=float,
            )


        except Exception:

            # Conservative fallback ensures
            # a failed optimiser does not
            # invalidate the whole backtest.

            weights = np.full(
                number_of_assets,
                1.0
                / number_of_assets,
            )

            optimisation_status = (
                "equal_weight_fallback"
            )


        holding_returns = (
            asset_returns.iloc[
                start_index:end_index
            ]
        )


        strategy_returns = (
            holding_returns.values
            @ weights
        )


        strategy_returns = (
            pd.Series(
                strategy_returns,
                index=(
                    holding_returns.index
                ),
            )
        )


        equal_weight_returns = (
            holding_returns.mean(
                axis=1
            )
        )


        period_benchmark_returns = (
            benchmark_returns.loc[
                holding_returns.index
            ]
        )


        if previous_weights is None:

            turnover = 0.0

        else:

            turnover = (
                0.5
                * np.abs(
                    weights
                    - previous_weights
                ).sum()
            )


        transaction_cost = (
            turnover
            * transaction_cost_rate
        )


        if (
            len(strategy_returns) > 0
            and transaction_cost > 0
        ):

            strategy_returns.iloc[0] -= (
                transaction_cost
            )


        weight_history.append(
            {
                "date":
                    holding_returns
                    .index[0]
                    .strftime(
                        "%Y-%m-%d"
                    ),

                "weights": {
                    ticker:
                        float(weight)

                    for ticker, weight
                    in zip(
                        prices.columns,
                        weights,
                    )
                },

                "turnover":
                    float(
                        turnover
                    ),

                "transaction_cost":
                    float(
                        transaction_cost
                    ),

                "status":
                    optimisation_status,
            }
        )


        strategy_parts.append(
            strategy_returns
        )

        equal_weight_parts.append(
            equal_weight_returns
        )

        benchmark_parts.append(
            period_benchmark_returns
        )


        previous_weights = (
            weights.copy()
        )


    if not strategy_parts:

        raise ValueError(
            "Backtest produced no evaluation periods."
        )


    strategy_returns = pd.concat(
        strategy_parts
    )


    equal_weight_returns = pd.concat(
        equal_weight_parts
    )


    benchmark_returns = pd.concat(
        benchmark_parts
    )


    # Ensure identical dates.
    common_index = (
        strategy_returns.index
        .intersection(
            equal_weight_returns.index
        )
        .intersection(
            benchmark_returns.index
        )
    )


    strategy_returns = (
        strategy_returns.loc[
            common_index
        ]
    )


    equal_weight_returns = (
        equal_weight_returns.loc[
            common_index
        ]
    )


    benchmark_returns = (
        benchmark_returns.loc[
            common_index
        ]
    )


    strategy_wealth = (
        1.0
        + strategy_returns
    ).cumprod()


    equal_weight_wealth = (
        1.0
        + equal_weight_returns
    ).cumprod()


    benchmark_wealth = (
        1.0
        + benchmark_returns
    ).cumprod()


    cumulative_series = [

        {
            "date":
                date.strftime(
                    "%Y-%m-%d"
                ),

            "strategy":
                float(
                    strategy_wealth.loc[
                        date
                    ]
                ),

            "equal_weight":
                float(
                    equal_weight_wealth.loc[
                        date
                    ]
                ),

            "benchmark":
                float(
                    benchmark_wealth.loc[
                        date
                    ]
                ),
        }

        for date in common_index
    ]


    turnovers = [
        record[
            "turnover"
        ]
        for record in weight_history
    ]


    average_turnover = (
        float(
            np.mean(
                turnovers
            )
        )
        if turnovers
        else 0.0
    )


    return {

        "strategy":
            calculate_performance_metrics(
                strategy_returns,
                risk_free_rate,
            ),

        "equal_weight":
            calculate_performance_metrics(
                equal_weight_returns,
                risk_free_rate,
            ),

        "benchmark":
            calculate_performance_metrics(
                benchmark_returns,
                risk_free_rate,
            ),

        "weight_history":
            weight_history,

        "cumulative_series":
            cumulative_series,

        "rebalance_count":
            len(
                weight_history
            ),

        "average_turnover":
            average_turnover,

        "start_date":
            common_index[0]
            .strftime(
                "%Y-%m-%d"
            ),

        "end_date":
            common_index[-1]
            .strftime(
                "%Y-%m-%d"
            ),
    }
