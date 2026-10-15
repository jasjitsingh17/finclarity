import pytest
from backend.factor_model import resolve_factor_weights
import numpy as np
import pandas as pd

from backend.factor_model import (
    build_factor_model,
    calculate_beta,
    calculate_idiosyncratic_volatility,
    calculate_momentum,
    safe_standardise,
)


def test_standardise():

    values = safe_standardise(
        [1, 2, 3]
    )

    assert np.isclose(
        values.mean(),
        0.0,
    )


def test_beta_matches_market():

    market = np.array(
        [
            0.01,
            -0.02,
            0.015,
            0.004,
            -0.006,
        ]
    )

    asset = (
        1.5
        * market
    )

    beta = calculate_beta(
        asset,
        market,
    )

    assert np.isclose(
        beta,
        1.5,
    )


def test_momentum_positive():

    prices = np.linspace(
        100,
        150,
        300,
    )

    momentum = calculate_momentum(
        prices
    )

    assert momentum > 0


def test_idiosyncratic_risk_non_negative():

    market = np.array(
        [
            0.01,
            -0.02,
            0.015,
            0.004,
            -0.006,
        ]
    )

    asset = (
        1.2
        * market
    )

    result = (
        calculate_idiosyncratic_volatility(
            asset,
            market,
        )
    )

    assert result >= 0


def test_complete_factor_model():

    dates = pd.date_range(
        "2025-01-01",
        periods=320,
        freq="B",
    )

    market = pd.Series(
        np.linspace(
            100,
            130,
            len(dates),
        ),
        index=dates,
    )

    prices = pd.DataFrame(
        {
            "AAA":
                np.linspace(
                    100,
                    160,
                    len(dates),
                ),

            "BBB":
                np.linspace(
                    100,
                    120,
                    len(dates),
                ),

            "CCC":
                np.linspace(
                    100,
                    105,
                    len(dates),
                ),
        },
        index=dates,
    )


    result = build_factor_model(
        prices=prices,
        market_prices=market,
        sentiment_scores={
            "AAA": 0.5,
            "BBB": 0.0,
            "CCC": -0.5,
        },
    )


    assert len(
        result["assets"]
    ) == 3


    assert result[
        "assets"
    ][0]["rank"] == 1


    assert (
        "composite_alpha_score"
        in result[
            "assets"
        ][0]
    )



def test_custom_factor_weights_are_resolved():

    weights = {
        "momentum": 0.50,
        "low_volatility": 0.15,
        "low_idiosyncratic_risk": 0.10,
        "sentiment_alpha": 0.25,
    }

    resolved = (
        resolve_factor_weights(
            weights
        )
    )

    assert resolved == weights


def test_factor_weights_must_sum_to_one():

    weights = {
        "momentum": 0.50,
        "low_volatility": 0.20,
        "low_idiosyncratic_risk": 0.20,
        "sentiment_alpha": 0.20,
    }

    with pytest.raises(
        ValueError,
        match="sum to 1.00",
    ):
        resolve_factor_weights(
            weights
        )


def test_factor_weights_reject_unknown_keys():

    weights = {
        "momentum": 0.35,
        "low_volatility": 0.20,
        "low_idiosyncratic_risk": 0.15,
        "sentiment_alpha": 0.25,
        "mystery_factor": 0.05,
    }

    with pytest.raises(
        ValueError,
        match="Unknown factor weights",
    ):
        resolve_factor_weights(
            weights
        )
