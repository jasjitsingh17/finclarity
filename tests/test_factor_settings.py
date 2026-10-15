import pytest

from backend.factor_model import (
    resolve_factor_weights,
)


def test_default_factor_weights():

    weights = (
        resolve_factor_weights()
    )

    assert weights == {
        "momentum": 0.35,
        "low_volatility": 0.20,
        "low_idiosyncratic_risk": 0.15,
        "sentiment_alpha": 0.30,
    }


def test_custom_factor_weights():

    weights = {
        "momentum": 0.50,
        "low_volatility": 0.15,
        "low_idiosyncratic_risk": 0.10,
        "sentiment_alpha": 0.25,
    }

    assert (
        resolve_factor_weights(
            weights
        )
        == weights
    )


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


def test_factor_weights_reject_unknown_factor():

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
