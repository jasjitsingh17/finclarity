import numpy as np
import pandas as pd

import backend.diversification_service as service


def sample_prices():

    dates = pd.date_range(
        "2026-01-01",
        periods=80,
        freq="B",
    )


    return pd.DataFrame(
        {
            "AAA":
                np.linspace(
                    100,
                    120,
                    len(dates),
                ),

            "BBB":
                np.linspace(
                    80,
                    95,
                    len(dates),
                ),
        },
        index=dates,
    )


def test_diversification_uses_base_currency_conversion(
    monkeypatch,
):

    seen = {}


    monkeypatch.setattr(
        service,
        "get_historical_prices",
        lambda **kwargs:
            (
                sample_prices(),
                [
                    "AAA",
                    "BBB",
                ],
                [
                    "AAA",
                    "BBB",
                ],
            ),
    )


    monkeypatch.setattr(
        service,
        "resolve_currency_map",
        lambda tickers:
            {
                ticker: {
                    "currency":
                        "USD",
                }
                for ticker
                in tickers
            },
    )


    def fake_convert(
        *,
        prices,
        currency_map,
        base_currency,
    ):

        seen[
            "base_currency"
        ] = base_currency


        return (
            prices,
            {
                "base_currency":
                    base_currency,

                "converted_tickers":
                    [
                        "AAA",
                        "BBB",
                    ],

                "failed_tickers":
                    {},

                "instruments":
                    {},
            },
        )


    monkeypatch.setattr(
        service,
        "convert_price_frame_to_base",
        fake_convert,
    )


    result = (
        service.analyse_diversification(
            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.6,
                0.4,
            ],

            years=3,

            base_currency="GBP",
        )
    )


    assert (
        seen[
            "base_currency"
        ]
        == "GBP"
    )


    assert (
        result[
            "base_currency"
        ]
        == "GBP"
    )


    assert (
        result[
            "currency_conversion"
        ][
            "base_currency"
        ]
        == "GBP"
    )


def test_conversion_failure_is_reported_missing(
    monkeypatch,
):

    prices = (
        sample_prices()
    )


    monkeypatch.setattr(
        service,
        "get_historical_prices",
        lambda **kwargs:
            (
                prices,
                [
                    "AAA",
                    "BBB",
                    "CCC",
                ],
                [
                    "AAA",
                    "BBB",
                    "CCC",
                ],
            ),
    )


    monkeypatch.setattr(
        service,
        "resolve_currency_map",
        lambda tickers:
            {},
    )


    monkeypatch.setattr(
        service,
        "convert_price_frame_to_base",
        lambda **kwargs:
            (
                prices[
                    [
                        "AAA",
                        "BBB",
                    ]
                ],
                {
                    "base_currency":
                        "GBP",

                    "converted_tickers":
                        [
                            "AAA",
                            "BBB",
                        ],

                    "failed_tickers":
                        {
                            "CCC":
                                "Currency unavailable",
                        },

                    "instruments":
                        {},
                },
            ),
    )


    result = (
        service.analyse_diversification(
            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.4,
                0.4,
                0.2,
            ],

            base_currency="GBP",
        )
    )


    assert (
        result[
            "available_tickers"
        ]
        == [
            "AAA",
            "BBB",
        ]
    )


    assert (
        result[
            "missing_tickers"
        ]
        == [
            "CCC",
        ]
    )
