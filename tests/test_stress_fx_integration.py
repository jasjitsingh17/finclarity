import numpy as np
import pandas as pd

import backend.stress_service as service


def raw_prices():

    dates = pd.date_range(
        "2026-01-01",
        periods=80,
        freq="B",
    )


    return pd.DataFrame(
        {
            "AAA":
                np.full(
                    len(dates),
                    100.0,
                ),

            "BBB":
                np.full(
                    len(dates),
                    100.0,
                ),
        },
        index=dates,
    )


def converted_prices():

    prices = (
        raw_prices()
        .copy()
    )


    # A 10% one-day fall in BBB after
    # base-currency translation.
    prices.loc[
        prices.index[40]:,
        "BBB",
    ] = 90.0


    return prices


def test_stress_uses_base_currency_prices(
    monkeypatch,
):

    seen = {}


    monkeypatch.setattr(
        service,
        "get_historical_prices",
        lambda **kwargs:
            (
                raw_prices(),
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
            converted_prices(),
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
        service.analyse_stress(
            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.5,
                0.5,
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


    worst_day = (
        result[
            "historical_scenarios"
        ][0]
    )


    # BBB falls 10%, weighted at 50%.
    assert (
        worst_day[
            "portfolio_return"
        ]
        == -0.05
    )


def test_custom_shock_logic_is_unchanged():

    result = (
        service.apply_custom_shock(
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

                "BBB":
                    -0.20,
            },
        )
    )


    assert (
        result[
            "portfolio_impact"
        ]
        == -0.15
    )
