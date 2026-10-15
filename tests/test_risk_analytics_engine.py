import numpy as np
import pandas as pd

from backend.risk_analytics_engine import (
    build_risk_analytics,
    calculate_beta,
    historical_cvar,
    historical_var,
    normalise_weights,
)


def test_weights_normalise():

    result = normalise_weights(
        [2, 3, 5]
    )

    assert np.isclose(
        result.sum(),
        1.0,
    )


def test_var_and_cvar():

    returns = pd.Series(
        [
            -0.10,
            -0.05,
            -0.02,
            0.00,
            0.01,
            0.02,
            0.03,
        ]
    )

    var = historical_var(
        returns,
        0.95,
    )

    cvar = historical_cvar(
        returns,
        0.95,
    )

    assert cvar <= var


def test_beta_positive():

    benchmark = pd.Series(
        [
            -0.02,
            -0.01,
            0.00,
            0.01,
            0.02,
        ]
    )

    portfolio = (
        benchmark * 1.2
    )

    beta = calculate_beta(
        portfolio,
        benchmark,
    )

    assert np.isclose(
        beta,
        1.2,
    )


def test_full_risk_output():

    rng = np.random.default_rng(
        42
    )

    dates = pd.date_range(
        "2023-01-01",
        periods=500,
        freq="B",
    )

    benchmark = pd.Series(
        rng.normal(
            0.0004,
            0.01,
            len(dates),
        ),
        index=dates,
    )

    returns = pd.DataFrame(
        {
            "AAA":
                benchmark.values
                + rng.normal(
                    0,
                    0.004,
                    len(dates),
                ),

            "BBB":
                benchmark.values * 0.8
                + rng.normal(
                    0,
                    0.005,
                    len(dates),
                ),

            "CCC":
                benchmark.values * 1.2
                + rng.normal(
                    0,
                    0.006,
                    len(dates),
                ),
        },
        index=dates,
    )

    result = build_risk_analytics(
        asset_returns=returns,
        benchmark_returns=benchmark,
        weights=[
            0.5,
            0.3,
            0.2,
        ],
        tickers=[
            "AAA",
            "BBB",
            "CCC",
        ],
    )

    assert "summary" in result
    assert "concentration" in result
    assert "risk_contributions" in result
    assert "historical_stress" in result


def test_risk_contributions_sum():

    rng = np.random.default_rng(
        7
    )

    dates = pd.date_range(
        "2024-01-01",
        periods=350,
        freq="B",
    )

    benchmark = pd.Series(
        rng.normal(
            0,
            0.01,
            len(dates),
        ),
        index=dates,
    )

    returns = pd.DataFrame(
        {
            "AAA":
                rng.normal(
                    0,
                    0.012,
                    len(dates),
                ),

            "BBB":
                rng.normal(
                    0,
                    0.009,
                    len(dates),
                ),
        },
        index=dates,
    )

    result = build_risk_analytics(
        returns,
        benchmark,
        [0.6, 0.4],
        ["AAA", "BBB"],
    )

    total = sum(
        item[
            "risk_contribution"
        ]

        for item in result[
            "risk_contributions"
        ]
    )

    assert np.isclose(
        total,
        1.0,
        atol=1e-6,
    )
