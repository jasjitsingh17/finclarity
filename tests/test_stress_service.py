import numpy as np
import pandas as pd

from backend.stress_service import (
    analyse_historical_stress_from_returns,
    apply_custom_shock,
    predefined_scenarios,
)


def sample_returns():

    index = pd.date_range(
        "2026-01-01",
        periods=80,
        freq="B",
    )


    aaa = np.full(
        80,
        0.001,
    )

    bbb = np.full(
        80,
        0.0005,
    )

    ccc = np.full(
        80,
        0.0002,
    )


    # Explicit stress day.
    aaa[30] = -0.10
    bbb[30] = -0.05
    ccc[30] = -0.02


    # Separate five-day selloff.
    aaa[50:55] = -0.03
    bbb[50:55] = -0.025
    ccc[50:55] = -0.02


    return pd.DataFrame(
        {
            "AAA":
                aaa,

            "BBB":
                bbb,

            "CCC":
                ccc,
        },
        index=index,
    )


def test_custom_shock_weighted_impact():

    result = (
        apply_custom_shock(
            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.6,
                0.4,
            ],

            shocks={
                "AAA":
                    -0.10,

                "BBB":
                    -0.05,
            },
        )
    )


    assert np.isclose(
        result[
            "portfolio_impact"
        ],
        -0.08,
    )


def test_missing_custom_shock_defaults_to_zero():

    result = (
        apply_custom_shock(
            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.5,
                0.5,
            ],

            shocks={
                "AAA":
                    -0.10,
            },
        )
    )


    assert np.isclose(
        result[
            "portfolio_impact"
        ],
        -0.05,
    )


def test_shock_cannot_be_below_minus_100_percent():

    try:

        apply_custom_shock(
            tickers=[
                "AAA",
            ],

            weights=[
                1.0,
            ],

            shocks={
                "AAA":
                    -1.2,
            },
        )

    except ValueError as exc:

        assert (
            "cannot be below -100%"
            in str(exc)
        )

    else:

        raise AssertionError(
            "Expected ValueError."
        )


def test_historical_stress_detects_negative_periods():

    result = (
        analyse_historical_stress_from_returns(
            daily_returns=
                sample_returns(),

            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.5,
                0.3,
                0.2,
            ],
        )
    )


    scenarios = {
        item[
            "label"
        ]:
            item
        for item
        in result[
            "historical_scenarios"
        ]
    }


    assert (
        scenarios[
            "Worst historical day"
        ][
            "portfolio_return"
        ]
        < 0
    )


    assert (
        scenarios[
            "Worst historical week"
        ][
            "portfolio_return"
        ]
        < 0
    )


def test_worst_day_holding_impacts_sum_to_portfolio_loss():

    result = (
        analyse_historical_stress_from_returns(
            daily_returns=
                sample_returns(),

            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.5,
                0.3,
                0.2,
            ],
        )
    )


    total = sum(
        item[
            "weighted_impact"
        ]
        for item
        in result[
            "worst_day_holding_moves"
        ]
    )


    worst_day = (
        result[
            "historical_scenarios"
        ][0][
            "portfolio_return"
        ]
    )


    assert np.isclose(
        total,
        worst_day,
        atol=1e-6,
    )


def test_predefined_broad_shock_is_minus_ten_percent():

    scenarios = (
        predefined_scenarios(
            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.5,
                0.3,
                0.2,
            ],
        )
    )


    broad = next(
        item
        for item
        in scenarios
        if item[
            "id"
        ]
        == "broad_equity_minus_10"
    )


    assert np.isclose(
        broad[
            "result"
        ][
            "portfolio_impact"
        ],
        -0.10,
    )


def test_largest_holding_scenario_targets_largest_weight():

    scenarios = (
        predefined_scenarios(
            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.6,
                0.25,
                0.15,
            ],
        )
    )


    scenario = next(
        item
        for item
        in scenarios
        if item[
            "id"
        ]
        == "largest_holding_minus_20"
    )


    impacts = (
        scenario[
            "result"
        ][
            "holding_impacts"
        ]
    )


    aaa = next(
        item
        for item
        in impacts
        if item[
            "ticker"
        ]
        == "AAA"
    )


    assert np.isclose(
        aaa[
            "shock"
        ],
        -0.20,
    )
