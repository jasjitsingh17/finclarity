import numpy as np
import pandas as pd

import backend.performance_service as service


def sample_prepared(
    base_currency="GBP",
):

    dates = pd.date_range(
        "2025-01-01",
        periods=100,
        freq="B",
    )


    asset_returns = pd.DataFrame(
        {
            "AAA":
                np.full(
                    len(
                        dates
                    ),
                    0.0010,
                ),

            "BBB":
                np.full(
                    len(
                        dates
                    ),
                    0.0005,
                ),
        },
        index=dates,
    )


    benchmark_returns = pd.Series(
        np.full(
            len(
                dates
            ),
            0.0006,
        ),
        index=dates,
        name="ACWI",
    )


    return {
        "asset_returns":
            asset_returns,

        "benchmark_returns":
            benchmark_returns,

        "requested_tickers":
            [
                "AAA",
                "BBB",
            ],

        "available_tickers":
            [
                "AAA",
                "BBB",
            ],

        "missing_tickers":
            [],

        "benchmark":
            "ACWI",

        "benchmark_available":
            True,

        "base_currency":
            base_currency,

        "conversion": {
            "base_currency":
                base_currency,

            "converted_tickers":
                [
                    "AAA",
                    "BBB",
                    "ACWI",
                ],

            "failed_tickers":
                {},

            "instruments":
                {},
        },

        "observations":
            100,

        "start_date":
            "2025-01-01",

        "end_date":
            "2025-05-20",

        "requested_market_tickers":
            [
                "AAA",
                "BBB",
                "ACWI",
            ],

        "available_market_tickers":
            [
                "AAA",
                "BBB",
                "ACWI",
            ],
    }


def test_base_currency_forwarded_to_market_layer(
    monkeypatch,
):

    captured = {}


    def fake_prepare(
        tickers,
        benchmark,
        years,
        base_currency,
    ):

        captured[
            "base_currency"
        ] = base_currency

        return sample_prepared(
            base_currency="GBP"
        )


    monkeypatch.setattr(
        service,
        "prepare_performance_market_data",
        fake_prepare,
    )


    result = (
        service.analyse_performance(
            tickers=[
                "AAA",
                "BBB",
            ],
            weights=[
                0.6,
                0.4,
            ],
            benchmark="ACWI",
            years=3,
            base_currency="GBP",
        )
    )


    assert (
        captured[
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


def test_default_base_currency_remains_usd(
    monkeypatch,
):

    captured = {}


    def fake_prepare(
        tickers,
        benchmark,
        years,
        base_currency,
    ):

        captured[
            "base_currency"
        ] = base_currency

        return sample_prepared(
            base_currency="USD"
        )


    monkeypatch.setattr(
        service,
        "prepare_performance_market_data",
        fake_prepare,
    )


    service.analyse_performance(
        tickers=[
            "AAA",
            "BBB",
        ],
        weights=[
            0.6,
            0.4,
        ],
    )


    assert (
        captured[
            "base_currency"
        ]
        == "USD"
    )


def test_fx_methodology_is_exposed(
    monkeypatch,
):

    monkeypatch.setattr(
        service,
        "prepare_performance_market_data",
        lambda **kwargs:
            sample_prepared(
                "EUR"
            ),
    )


    result = (
        service.analyse_performance(
            tickers=[
                "AAA",
                "BBB",
            ],
            weights=[
                0.5,
                0.5,
            ],
            base_currency="EUR",
        )
    )


    assert (
        result[
            "methodology"
        ][
            "base_currency"
        ]
        == "EUR"
    )


    assert (
        "converted"
        in result[
            "methodology"
        ][
            "currency_treatment"
        ].lower()
    )


def test_weight_validation_happens_before_market_download(
    monkeypatch,
):

    called = {
        "market":
            False
    }


    def fake_prepare(
        **kwargs,
    ):

        called[
            "market"
        ] = True

        return sample_prepared()


    monkeypatch.setattr(
        service,
        "prepare_performance_market_data",
        fake_prepare,
    )


    try:

        service.analyse_performance(
            tickers=[
                "AAA",
                "BBB",
            ],
            weights=[
                1.0,
            ],
        )

    except ValueError as exc:

        assert (
            "same length"
            in str(
                exc
            )
        )

    else:

        raise AssertionError(
            "Expected weight validation error."
        )


    assert (
        called[
            "market"
        ]
        is False
    )


def test_full_data_coverage_is_reported(
    monkeypatch,
):

    monkeypatch.setattr(
        service,
        "prepare_performance_market_data",
        lambda **kwargs:
            sample_prepared(
                "GBP"
            ),
    )


    result = (
        service.analyse_performance(
            tickers=[
                "AAA",
                "BBB",
            ],
            weights=[
                0.6,
                0.4,
            ],
            base_currency="GBP",
        )
    )


    coverage = (
        result[
            "data_coverage"
        ]
    )


    assert (
        coverage[
            "weight_coverage"
        ]
        == 1.0
    )

    assert (
        coverage[
            "excluded_weight"
        ]
        == 0.0
    )

    assert (
        coverage[
            "weights_renormalised"
        ]
        is False
    )

    assert (
        coverage[
            "excluded_tickers"
        ]
        == []
    )


def test_partial_data_coverage_is_reported(
    monkeypatch,
):

    prepared = (
        sample_prepared(
            "GBP"
        )
    )


    prepared[
        "asset_returns"
    ] = (
        prepared[
            "asset_returns"
        ][
            [
                "AAA",
            ]
        ]
    )


    prepared[
        "available_tickers"
    ] = [
        "AAA",
    ]


    prepared[
        "missing_tickers"
    ] = [
        "BBB",
    ]


    monkeypatch.setattr(
        service,
        "prepare_performance_market_data",
        lambda **kwargs:
            prepared,
    )


    result = (
        service.analyse_performance(
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
    )


    coverage = (
        result[
            "data_coverage"
        ]
    )


    assert (
        coverage[
            "requested_holding_count"
        ]
        == 2
    )

    assert (
        coverage[
            "analysed_holding_count"
        ]
        == 1
    )

    assert (
        coverage[
            "weight_coverage"
        ]
        == 0.7
    )

    assert (
        coverage[
            "excluded_weight"
        ]
        == 0.3
    )

    assert (
        coverage[
            "weights_renormalised"
        ]
        is True
    )

    assert (
        coverage[
            "excluded_tickers"
        ]
        == [
            "BBB",
        ]
    )


    # The actual simulation still correctly
    # renormalises the usable subset.
    assert (
        result[
            "holding_metrics"
        ][0][
            "weight"
        ]
        == 1.0
    )
