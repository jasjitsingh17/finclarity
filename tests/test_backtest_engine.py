import numpy as np
import pandas as pd

from backend.backtest_engine import (
    calculate_performance_metrics,
    run_walk_forward_backtest,
)


def synthetic_prices():

    rng = np.random.default_rng(
        42
    )


    dates = pd.date_range(
        "2022-01-03",
        periods=750,
        freq="B",
    )


    market_returns = (
        0.0004
        + rng.normal(
            0,
            0.01,
            len(dates),
        )
    )


    asset_one = (
        0.0003
        + 1.1
        * market_returns
        + rng.normal(
            0,
            0.005,
            len(dates),
        )
    )


    asset_two = (
        0.0002
        + 0.8
        * market_returns
        + rng.normal(
            0,
            0.004,
            len(dates),
        )
    )


    asset_three = (
        0.0005
        + 1.3
        * market_returns
        + rng.normal(
            0,
            0.007,
            len(dates),
        )
    )


    def to_prices(
        returns,
    ):

        return (
            100
            * np.cumprod(
                1 + returns
            )
        )


    prices = pd.DataFrame(
        {
            "AAA":
                to_prices(
                    asset_one
                ),

            "BBB":
                to_prices(
                    asset_two
                ),

            "CCC":
                to_prices(
                    asset_three
                ),
        },
        index=dates,
    )


    benchmark = pd.Series(
        to_prices(
            market_returns
        ),
        index=dates,
    )


    return (
        prices,
        benchmark,
    )


def test_performance_metrics():

    returns = pd.Series(
        [
            0.01,
            -0.005,
            0.008,
            0.003,
            -0.002,
        ]
    )


    result = (
        calculate_performance_metrics(
            returns
        )
    )


    assert (
        "sharpe_ratio"
        in result
    )

    assert (
        "max_drawdown"
        in result
    )


def test_backtest_runs():

    prices, benchmark = (
        synthetic_prices()
    )


    result = (
        run_walk_forward_backtest(
            prices,
            benchmark,
            training_days=252,
            rebalance_days=21,
        )
    )


    assert (
        result[
            "rebalance_count"
        ] > 0
    )


def test_backtest_has_comparisons():

    prices, benchmark = (
        synthetic_prices()
    )


    result = (
        run_walk_forward_backtest(
            prices,
            benchmark,
        )
    )


    assert "strategy" in result

    assert "equal_weight" in result

    assert "benchmark" in result


def test_weight_history_sums_to_one():

    prices, benchmark = (
        synthetic_prices()
    )


    result = (
        run_walk_forward_backtest(
            prices,
            benchmark,
        )
    )


    for record in (
        result[
            "weight_history"
        ]
    ):

        total = sum(
            record[
                "weights"
            ].values()
        )

        assert np.isclose(
            total,
            1.0,
            atol=1e-5,
        )


def test_turnover_non_negative():

    prices, benchmark = (
        synthetic_prices()
    )


    result = (
        run_walk_forward_backtest(
            prices,
            benchmark,
        )
    )


    assert (
        result[
            "average_turnover"
        ] >= 0
    )
