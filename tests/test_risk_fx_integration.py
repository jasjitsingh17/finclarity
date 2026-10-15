import pandas as pd
import pytest

import backend.risk_analytics_service as service


def prepared_market(
    base_currency="GBP",
    missing=None,
):

    dates = pd.date_range(
        "2026-01-01",
        periods=80,
        freq="B",
    )


    asset_returns = pd.DataFrame(
        {
            "AAA":
                [0.001] * 80,

            "BBB":
                [0.002] * 80,
        },
        index=dates,
    )


    benchmark_returns = pd.Series(
        [0.0015] * 80,
        index=dates,
        name="SPY",
    )


    missing = (
        missing
        or []
    )


    available = [
        ticker
        for ticker
        in [
            "AAA",
            "BBB",
        ]
        if ticker
        not in missing
    ]


    return {
        "asset_returns":
            asset_returns[
                available
            ],

        "benchmark_returns":
            benchmark_returns,

        "requested_tickers":
            [
                "AAA",
                "BBB",
            ],

        "available_tickers":
            available,

        "missing_tickers":
            missing,

        "base_currency":
            base_currency,

        "conversion":
            {
                "base_currency":
                    base_currency,

                "converted_tickers":
                    available,

                "failed_tickers":
                    {},

                "instruments":
                    {},
            },

        "observations":
            80,

        "start_date":
            "2026-01-01",

        "end_date":
            "2026-04-22",
    }


def fake_analytics(
    *,
    asset_returns,
    benchmark_returns,
    weights,
    tickers,
    risk_free_rate,
):

    return {
        "summary": {
            "annualised_volatility":
                0.20,
        },

        "test_asset_columns":
            list(
                asset_returns.columns
            ),

        "test_benchmark_name":
            benchmark_returns.name,
    }


def test_base_currency_forwarded_to_market_layer(
    monkeypatch,
):

    seen = {}


    def fake_prepare(
        **kwargs,
    ):

        seen.update(
            kwargs
        )

        return prepared_market(
            "GBP"
        )


    monkeypatch.setattr(
        service,
        "prepare_performance_market_data",
        fake_prepare,
    )

    monkeypatch.setattr(
        service,
        "build_risk_analytics",
        fake_analytics,
    )


    result = service.analyse_risk(
        tickers=[
            "AAA",
            "BBB",
        ],

        weights=[
            0.6,
            0.4,
        ],

        benchmark="SPY",

        years=3,

        base_currency="GBP",
    )


    assert (
        seen[
            "base_currency"
        ]
        == "GBP"
    )

    assert (
        seen[
            "benchmark"
        ]
        == "SPY"
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


def test_default_base_currency_remains_usd(
    monkeypatch,
):

    seen = {}


    def fake_prepare(
        **kwargs,
    ):

        seen.update(
            kwargs
        )

        return prepared_market(
            "USD"
        )


    monkeypatch.setattr(
        service,
        "prepare_performance_market_data",
        fake_prepare,
    )

    monkeypatch.setattr(
        service,
        "build_risk_analytics",
        fake_analytics,
    )


    result = service.analyse_risk(
        tickers=[
            "AAA",
            "BBB",
        ],

        weights=[
            0.5,
            0.5,
        ],
    )


    assert (
        seen[
            "base_currency"
        ]
        == "USD"
    )

    assert (
        result[
            "base_currency"
        ]
        == "USD"
    )


def test_missing_holding_is_explicit(
    monkeypatch,
):

    monkeypatch.setattr(
        service,
        "prepare_performance_market_data",
        lambda **kwargs:
            prepared_market(
                "GBP",
                missing=[
                    "BBB",
                ],
            ),
    )


    with pytest.raises(
        ValueError,
        match="BBB",
    ):

        service.analyse_risk(
            tickers=[
                "AAA",
                "BBB",
            ],

            weights=[
                0.7,
                0.3,
            ],

            base_currency="GBP",
        )


def test_fx_methodology_is_exposed(
    monkeypatch,
):

    monkeypatch.setattr(
        service,
        "prepare_performance_market_data",
        lambda **kwargs:
            prepared_market(
                "GBP"
            ),
    )

    monkeypatch.setattr(
        service,
        "build_risk_analytics",
        fake_analytics,
    )


    result = service.analyse_risk(
        tickers=[
            "AAA",
            "BBB",
        ],

        weights=[
            0.5,
            0.5,
        ],

        base_currency="GBP",
    )


    assert (
        "GBP"
        in result[
            "methodology"
        ][
            "currency_treatment"
        ]
    )

    assert (
        "future"
        in result[
            "methodology"
        ][
            "fx_alignment"
        ].lower()
    )
