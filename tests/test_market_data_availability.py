import numpy as np
import pandas as pd

import backend.market_data as service


def make_yahoo_frame(
    values,
    dates,
):

    columns = {}


    for ticker, series in values.items():

        columns[
            (
                "Close",
                ticker,
            )
        ] = series


    frame = pd.DataFrame(
        columns,
        index=dates,
    )


    frame.columns = (
        pd.MultiIndex
        .from_tuples(
            frame.columns
        )
    )


    return frame


def test_all_nan_ticker_is_reported_missing(
    monkeypatch,
):

    dates = pd.date_range(
        "2026-01-01",
        periods=80,
        freq="B",
    )


    frame = make_yahoo_frame(
        {
            "AAPL":
                np.linspace(
                    100,
                    120,
                    len(
                        dates
                    ),
                ),

            "BAD":
                np.full(
                    len(
                        dates
                    ),
                    np.nan,
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
        dates,
    )


    monkeypatch.setattr(
        service.yf,
        "download",
        lambda **kwargs:
            frame,
    )


    (
        prices,
        requested,
        available,
    ) = (
        service.get_historical_prices(
            [
                "AAPL",
                "BAD",
                "ACWI",
            ],
            years=3,
        )
    )


    assert requested == [
        "AAPL",
        "BAD",
        "ACWI",
    ]


    assert available == [
        "AAPL",
        "ACWI",
    ]


    assert list(
        prices.columns
    ) == [
        "AAPL",
        "ACWI",
    ]


    assert len(
        prices
    ) == 80


def test_short_history_ticker_does_not_poison_valid_assets(
    monkeypatch,
):

    dates = pd.date_range(
        "2026-01-01",
        periods=80,
        freq="B",
    )


    short = np.full(
        len(
            dates
        ),
        np.nan,
    )

    short[
        -20:
    ] = np.linspace(
        10,
        15,
        20,
    )


    frame = make_yahoo_frame(
        {
            "AAPL":
                np.linspace(
                    100,
                    120,
                    len(
                        dates
                    ),
                ),

            "NEW":
                short,

            "ACWI":
                np.linspace(
                    90,
                    100,
                    len(
                        dates
                    ),
                ),
        },
        dates,
    )


    monkeypatch.setattr(
        service.yf,
        "download",
        lambda **kwargs:
            frame,
    )


    (
        prices,
        requested,
        available,
    ) = (
        service.get_historical_prices(
            [
                "AAPL",
                "NEW",
                "ACWI",
            ],
            years=3,
        )
    )


    assert available == [
        "AAPL",
        "ACWI",
    ]


    assert (
        "NEW"
        not in prices.columns
    )


    assert len(
        prices
    ) == 80
