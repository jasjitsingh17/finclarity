import numpy as np
import pandas as pd

from backend.diversification_service import (
    analyse_diversification_from_returns,
)


def sample_returns():

    return pd.DataFrame(
        {
            "AAA":
                [
                    0.010,
                    0.012,
                    -0.005,
                    0.008,
                    0.006,
                    -0.003,
                ]
                * 10,

            "BBB":
                [
                    0.009,
                    0.011,
                    -0.004,
                    0.007,
                    0.005,
                    -0.002,
                ]
                * 10,

            "CCC":
                [
                    -0.006,
                    0.003,
                    0.008,
                    -0.004,
                    0.002,
                    0.007,
                ]
                * 10,
        }
    )


def test_equal_weight_effective_holdings():

    result = analyse_diversification_from_returns(
        daily_returns=sample_returns(),
        tickers=[
            "AAA",
            "BBB",
            "CCC",
        ],
        weights=[
            1 / 3,
            1 / 3,
            1 / 3,
        ],
    )

    assert np.isclose(
        result["effective_holdings"],
        3.0,
        atol=0.01,
    )


def test_concentrated_portfolio_has_lower_effective_holdings():

    result = analyse_diversification_from_returns(
        daily_returns=sample_returns(),
        tickers=[
            "AAA",
            "BBB",
            "CCC",
        ],
        weights=[
            0.8,
            0.1,
            0.1,
        ],
    )

    assert (
        result["effective_holdings"]
        < 2
    )


def test_correlation_matrix_is_symmetric():

    result = analyse_diversification_from_returns(
        daily_returns=sample_returns(),
        tickers=[
            "AAA",
            "BBB",
            "CCC",
        ],
        weights=[
            0.4,
            0.3,
            0.3,
        ],
    )

    matrix = result[
        "correlation_matrix"
    ]

    assert (
        matrix["AAA"]["BBB"]
        == matrix["BBB"]["AAA"]
    )


def test_highest_pair_detected():

    result = analyse_diversification_from_returns(
        daily_returns=sample_returns(),
        tickers=[
            "AAA",
            "BBB",
            "CCC",
        ],
        weights=[
            0.4,
            0.3,
            0.3,
        ],
    )

    pair = result[
        "highest_correlation_pair"
    ]

    assert {
        pair["ticker_1"],
        pair["ticker_2"],
    } == {
        "AAA",
        "BBB",
    }


def test_score_is_bounded():

    result = analyse_diversification_from_returns(
        daily_returns=sample_returns(),
        tickers=[
            "AAA",
            "BBB",
            "CCC",
        ],
        weights=[
            0.4,
            0.3,
            0.3,
        ],
    )

    assert (
        0
        <= result[
            "diversification_score"
        ]
        <= 100
    )
