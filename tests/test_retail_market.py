import pytest

from backend.retail_market import (
    _latest_fx_rate,
    normalise_london_price,
)


def test_london_price_converts_pence_to_pounds():

    assert (
        normalise_london_price(
            "AZN.L",
            12180,
        )
        == pytest.approx(
            121.80
        )
    )


def test_non_london_price_is_unchanged():

    assert (
        normalise_london_price(
            "AAPL",
            220,
        )
        == pytest.approx(
            220
        )
    )


def test_same_currency_fx_rate_is_one():

    assert (
        _latest_fx_rate(
            "USD",
            "USD",
        )
        == 1.0
    )
