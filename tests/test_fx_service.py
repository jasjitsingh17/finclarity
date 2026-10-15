import numpy as np
import pandas as pd
import pytest

from backend.fx_service import (
    convert_price_series,
    normalise_currency,
    yahoo_fx_symbol,
)


def sample_index():

    return pd.date_range(
        "2026-01-01",
        periods=3,
        freq="B",
    )


def test_gbp_requires_no_scaling():

    currency, scale = (
        normalise_currency(
            "GBP"
        )
    )

    assert currency == "GBP"
    assert scale == 1.0


def test_gbpence_is_converted_to_pounds():

    currency, scale = (
        normalise_currency(
            "GBp"
        )
    )

    assert currency == "GBP"
    assert scale == 0.01


def test_gbx_is_converted_to_pounds():

    currency, scale = (
        normalise_currency(
            "GBX"
        )
    )

    assert currency == "GBP"
    assert scale == 0.01


def test_yahoo_fx_symbol():

    assert (
        yahoo_fx_symbol(
            "USD",
            "GBP",
        )
        == "USDGBP=X"
    )


def test_same_currency_has_no_fx_symbol():

    assert (
        yahoo_fx_symbol(
            "GBP",
            "GBP",
        )
        is None
    )


def test_same_currency_price_conversion():

    prices = pd.Series(
        [
            100.0,
            102.0,
            104.0,
        ],
        index=sample_index(),
        name="AAA",
    )


    converted = (
        convert_price_series(
            prices=prices,
            source_currency="USD",
            base_currency="USD",
        )
    )


    assert np.allclose(
        converted.values,
        prices.values,
    )


def test_pence_price_conversion():

    prices = pd.Series(
        [
            250.0,
            260.0,
            270.0,
        ],
        index=sample_index(),
        name="LSE",
    )


    converted = (
        convert_price_series(
            prices=prices,
            source_currency="GBp",
            base_currency="GBP",
        )
    )


    assert np.allclose(
        converted.values,
        [
            2.50,
            2.60,
            2.70,
        ],
    )


def test_usd_to_gbp_conversion():

    prices = pd.Series(
        [
            100.0,
            110.0,
            120.0,
        ],
        index=sample_index(),
        name="AAA",
    )


    fx = pd.Series(
        [
            0.80,
            0.79,
            0.78,
        ],
        index=sample_index(),
    )


    converted = (
        convert_price_series(
            prices=prices,
            source_currency="USD",
            base_currency="GBP",
            fx_rates=fx,
        )
    )


    assert np.allclose(
        converted.values,
        [
            80.0,
            86.9,
            93.6,
        ],
    )


def test_fx_change_affects_investor_return():

    prices = pd.Series(
        [
            100.0,
            100.0,
        ],
        index=pd.date_range(
            "2026-01-01",
            periods=2,
            freq="B",
        ),
    )


    fx = pd.Series(
        [
            0.80,
            0.72,
        ],
        index=prices.index,
    )


    converted = (
        convert_price_series(
            prices=prices,
            source_currency="USD",
            base_currency="GBP",
            fx_rates=fx,
        )
    )


    investor_return = (
        converted
        .pct_change(
            fill_method=None
        )
        .dropna()
        .iloc[0]
    )


    assert np.isclose(
        investor_return,
        -0.10,
    )


def test_fx_required_for_different_currency():

    prices = pd.Series(
        [
            100.0,
            101.0,
        ],
        index=pd.date_range(
            "2026-01-01",
            periods=2,
            freq="B",
        ),
    )


    with pytest.raises(
        ValueError,
        match="FX rates are required",
    ):

        convert_price_series(
            prices=prices,
            source_currency="EUR",
            base_currency="GBP",
        )


def test_fx_alignment_does_not_use_future_rate():

    price_index = pd.date_range(
        "2026-01-01",
        periods=2,
        freq="D",
    )


    prices = pd.Series(
        [
            100.0,
            100.0,
        ],
        index=price_index,
    )


    # FX history only begins on the SECOND
    # price date. The first security date must
    # not receive that future FX observation.
    fx = pd.Series(
        [
            0.80,
        ],
        index=[
            price_index[1]
        ],
    )


    with pytest.raises(
        ValueError,
        match="future observations",
    ):

        convert_price_series(
            prices=prices,
            source_currency="USD",
            base_currency="GBP",
            fx_rates=fx,
        )
