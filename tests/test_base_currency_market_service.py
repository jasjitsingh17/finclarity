import numpy as np
import pandas as pd

from backend import (
    base_currency_market_service
    as service,
)


def index():

    return pd.date_range(
        "2026-01-01",
        periods=80,
        freq="B",
    )


def metadata(
    raw_currency,
):

    currency, scale = (
        service.normalise_currency(
            raw_currency
        )
    )


    return {
        "status":
            "available",

        "raw_currency":
            raw_currency,

        "currency":
            currency,

        "price_scale":
            scale,

        "source":
            "test",
    }


def test_same_currency_needs_no_fx():

    prices = pd.DataFrame(
        {
            "AAA": [
                100.0,
                101.0,
                102.0,
            ],
        },
        index=pd.date_range(
            "2026-01-01",
            periods=3,
            freq="B",
        ),
    )


    def forbidden_fx(
        *args,
        **kwargs,
    ):

        raise AssertionError(
            "FX loader must not be called."
        )


    converted, meta = (
        service.convert_price_frame_to_base(
            prices=prices,
            currency_map={
                "AAA":
                    metadata(
                        "GBP"
                    ),
            },
            base_currency="GBP",
            fx_loader=forbidden_fx,
        )
    )


    assert np.allclose(
        converted[
            "AAA"
        ].values,
        prices[
            "AAA"
        ].values,
    )


    assert (
        meta[
            "instruments"
        ][
            "AAA"
        ][
            "fx_conversion_required"
        ]
        is False
    )


def test_usd_security_converted_to_gbp():

    dates = pd.date_range(
        "2026-01-01",
        periods=3,
        freq="B",
    )


    prices = pd.DataFrame(
        {
            "AAA": [
                100.0,
                110.0,
                120.0,
            ],
        },
        index=dates,
    )


    def fx_loader(
        source,
        base,
        start,
        end,
    ):

        assert source == "USD"
        assert base == "GBP"

        return pd.Series(
            [
                0.80,
                0.79,
                0.78,
            ],
            index=dates,
        )


    converted, meta = (
        service.convert_price_frame_to_base(
            prices=prices,
            currency_map={
                "AAA":
                    metadata(
                        "USD"
                    ),
            },
            base_currency="GBP",
            fx_loader=fx_loader,
        )
    )


    assert np.allclose(
        converted[
            "AAA"
        ].values,
        [
            80.0,
            86.9,
            93.6,
        ],
    )


    assert (
        meta[
            "instruments"
        ][
            "AAA"
        ][
            "fx_symbol"
        ]
        == "USDGBP=X"
    )


def test_gbpence_scaled_before_returns():

    prices = pd.DataFrame(
        {
            "LSE.L": [
                250.0,
                260.0,
                270.0,
            ],
        },
        index=pd.date_range(
            "2026-01-01",
            periods=3,
            freq="B",
        ),
    )


    converted, _ = (
        service.convert_price_frame_to_base(
            prices=prices,
            currency_map={
                "LSE.L":
                    metadata(
                        "GBp"
                    ),
            },
            base_currency="GBP",
        )
    )


    assert np.allclose(
        converted[
            "LSE.L"
        ].values,
        [
            2.50,
            2.60,
            2.70,
        ],
    )


def test_one_failed_currency_does_not_remove_valid_security():

    prices = pd.DataFrame(
        {
            "GOOD": [
                100.0,
                101.0,
                102.0,
            ],

            "BAD": [
                50.0,
                51.0,
                52.0,
            ],
        },
        index=pd.date_range(
            "2026-01-01",
            periods=3,
            freq="B",
        ),
    )


    converted, meta = (
        service.convert_price_frame_to_base(
            prices=prices,
            currency_map={
                "GOOD":
                    metadata(
                        "GBP"
                    ),

                "BAD": {
                    "status":
                        "unavailable",

                    "error":
                        "No currency metadata.",
                },
            },
            base_currency="GBP",
        )
    )


    assert (
        "GOOD"
        in converted.columns
    )

    assert (
        "BAD"
        not in converted.columns
    )

    assert (
        "BAD"
        in meta[
            "failed_tickers"
        ]
    )


def test_benchmark_is_converted_like_a_holding(
    monkeypatch,
):

    dates = index()


    prices = pd.DataFrame(
        {
            "AAA":
                np.linspace(
                    100,
                    120,
                    len(
                        dates
                    ),
                ),

            "ACWI":
                np.linspace(
                    90,
                    100,
                    len(
                        dates
                    ),
                ),
        },
        index=dates,
    )


    def fake_prices(
        tickers,
        years,
    ):

        return (
            prices,
            list(
                tickers
            ),
            list(
                tickers
            ),
        )


    def fake_currency_map(
        tickers,
    ):

        return {
            "AAA":
                metadata(
                    "USD"
                ),

            "ACWI":
                metadata(
                    "USD"
                ),
        }


    def fake_fx(
        source,
        base,
        start,
        end,
    ):

        return pd.Series(
            np.linspace(
                0.80,
                0.75,
                len(
                    dates
                ),
            ),
            index=dates,
        )


    monkeypatch.setattr(
        service,
        "get_historical_prices",
        fake_prices,
    )


    monkeypatch.setattr(
        service,
        "resolve_currency_map",
        fake_currency_map,
    )


    monkeypatch.setattr(
        service,
        "get_historical_fx_rates",
        fake_fx,
    )


    result = (
        service.prepare_performance_market_data(
            tickers=[
                "AAA",
            ],
            benchmark="ACWI",
            years=3,
            base_currency="GBP",
        )
    )


    assert (
        result[
            "base_currency"
        ]
        == "GBP"
    )


    assert (
        result[
            "benchmark_available"
        ]
        is True
    )


    assert (
        len(
            result[
                "benchmark_returns"
            ]
        )
        > 30
    )


def test_fx_movement_changes_base_currency_return(
    monkeypatch,
):

    dates = index()


    # Local USD price stays flat.
    prices = pd.DataFrame(
        {
            "AAA":
                np.full(
                    len(
                        dates
                    ),
                    100.0,
                ),

            "ACWI":
                np.full(
                    len(
                        dates
                    ),
                    100.0,
                ),
        },
        index=dates,
    )


    def fake_prices(
        tickers,
        years,
    ):

        return (
            prices,
            list(
                tickers
            ),
            list(
                tickers
            ),
        )


    def fake_currency_map(
        tickers,
    ):

        return {
            ticker:
                metadata(
                    "USD"
                )
            for ticker
            in tickers
        }


    def fake_fx(
        source,
        base,
        start,
        end,
    ):

        return pd.Series(
            np.linspace(
                0.80,
                0.72,
                len(
                    dates
                ),
            ),
            index=dates,
        )


    monkeypatch.setattr(
        service,
        "get_historical_prices",
        fake_prices,
    )


    monkeypatch.setattr(
        service,
        "resolve_currency_map",
        fake_currency_map,
    )


    monkeypatch.setattr(
        service,
        "get_historical_fx_rates",
        fake_fx,
    )


    result = (
        service.prepare_performance_market_data(
            tickers=[
                "AAA",
            ],
            benchmark="ACWI",
            base_currency="GBP",
        )
    )


    compounded = (
        (
            1.0
            + result[
                "asset_returns"
            ][
                "AAA"
            ]
        )
        .prod()
        - 1.0
    )


    assert np.isclose(
        compounded,
        -0.10,
        atol=1e-10,
    )
