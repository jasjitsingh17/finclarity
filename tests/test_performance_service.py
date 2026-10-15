import numpy as np
import pandas as pd

from backend.performance_service import (
    analyse_performance_from_returns,
)


def sample_data():

    index = pd.date_range(
        "2025-01-01",
        periods=100,
        freq="B",
    )


    aaa = np.full(
        100,
        0.0015,
    )


    bbb = np.full(
        100,
        0.0005,
    )


    # Add variability.
    aaa[20] = -0.05
    aaa[40] = 0.04

    bbb[20] = -0.02
    bbb[40] = 0.015


    benchmark = np.full(
        100,
        0.0006,
    )

    benchmark[20] = -0.025
    benchmark[40] = 0.02


    assets = pd.DataFrame(
        {
            "AAA":
                aaa,

            "BBB":
                bbb,
        },
        index=index,
    )


    benchmark_series = pd.Series(
        benchmark,
        index=index,
    )


    return (
        assets,
        benchmark_series,
    )


def test_portfolio_metrics_exist():

    assets, benchmark = (
        sample_data()
    )


    result = (
        analyse_performance_from_returns(
            asset_returns=
                assets,

            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.6,
                0.4,
            ],

            benchmark_returns=
                benchmark,
        )
    )


    assert (
        result[
            "portfolio"
        ][
            "cumulative_return"
        ]
        != 0
    )


def test_benchmark_metrics_exist():

    assets, benchmark = (
        sample_data()
    )


    result = (
        analyse_performance_from_returns(
            asset_returns=
                assets,

            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.6,
                0.4,
            ],

            benchmark_returns=
                benchmark,
        )
    )


    assert (
        result[
            "benchmark_metrics"
        ][
            "cumulative_return"
        ]
        != 0
    )


def test_chart_has_all_observations():

    assets, benchmark = (
        sample_data()
    )


    result = (
        analyse_performance_from_returns(
            asset_returns=
                assets,

            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.6,
                0.4,
            ],

            benchmark_returns=
                benchmark,
        )
    )


    assert (
        len(
            result[
                "chart"
            ]
        )
        == 101
    )


def test_chart_starts_near_one():

    assets, benchmark = (
        sample_data()
    )


    result = (
        analyse_performance_from_returns(
            asset_returns=
                assets,

            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.6,
                0.4,
            ],

            benchmark_returns=
                benchmark,
        )
    )


    first = (
        result[
            "chart"
        ][0]
    )


    assert np.isclose(
        first[
            "portfolio"
        ],
        1.0,
    )


    assert np.isclose(
        first[
            "benchmark"
        ],
        1.0,
    )


def test_beta_is_finite():

    assets, benchmark = (
        sample_data()
    )


    result = (
        analyse_performance_from_returns(
            asset_returns=
                assets,

            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.6,
                0.4,
            ],

            benchmark_returns=
                benchmark,
        )
    )


    assert np.isfinite(
        result[
            "relative"
        ][
            "beta"
        ]
    )


def test_tracking_error_is_nonnegative():

    assets, benchmark = (
        sample_data()
    )


    result = (
        analyse_performance_from_returns(
            asset_returns=
                assets,

            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.6,
                0.4,
            ],

            benchmark_returns=
                benchmark,
        )
    )


    assert (
        result[
            "relative"
        ][
            "tracking_error"
        ]
        >= 0
    )


def test_holding_weights_sum_to_one():

    assets, benchmark = (
        sample_data()
    )


    result = (
        analyse_performance_from_returns(
            asset_returns=
                assets,

            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.6,
                0.4,
            ],

            benchmark_returns=
                benchmark,
        )
    )


    total = sum(
        item[
            "weight"
        ]
        for item
        in result[
            "holding_metrics"
        ]
    )


    assert np.isclose(
        total,
        1.0,
    )


def test_drawdown_is_nonpositive():

    assets, benchmark = (
        sample_data()
    )


    result = (
        analyse_performance_from_returns(
            asset_returns=
                assets,

            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.6,
                0.4,
            ],

            benchmark_returns=
                benchmark,
        )
    )


    assert (
        result[
            "portfolio"
        ][
            "max_drawdown"
        ]
        <= 0
    )
