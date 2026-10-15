import pandas as pd
import pytest

import backend.fx_service as service


def test_same_currency_returns_one_without_download(
    monkeypatch,
):

    def forbidden(
        symbol,
    ):
        raise AssertionError(
            "Yahoo must not be called."
        )


    monkeypatch.setattr(
        service,
        "_download_latest_fx",
        forbidden,
    )


    result = (
        service.get_fx_quote(
            "GBP",
            "GBP",
        )
    )


    assert result[
        "rate"
    ] == 1.0

    assert result[
        "source"
    ] == "identity"


def test_direct_fx_pair_used(
    monkeypatch,
):

    calls = []


    def fake_download(
        symbol,
    ):

        calls.append(
            symbol
        )


        if symbol == "USDGBP=X":

            return {
                "rate":
                    0.75,

                "timestamp":
                    pd.Timestamp(
                        "2026-10-14"
                    ),
            }


        return None


    monkeypatch.setattr(
        service,
        "_download_latest_fx",
        fake_download,
    )


    result = (
        service.get_fx_quote(
            "USD",
            "GBP",
        )
    )


    assert result[
        "rate"
    ] == 0.75

    assert result[
        "symbol"
    ] == "USDGBP=X"

    assert calls == [
        "USDGBP=X",
    ]


def test_inverse_fx_pair_fallback(
    monkeypatch,
):

    def fake_download(
        symbol,
    ):

        if symbol == "USDGBP=X":
            return None


        if symbol == "GBPUSD=X":

            return {
                "rate":
                    1.25,

                "timestamp":
                    pd.Timestamp(
                        "2026-10-14"
                    ),
            }


        return None


    monkeypatch.setattr(
        service,
        "_download_latest_fx",
        fake_download,
    )


    result = (
        service.get_fx_quote(
            "USD",
            "GBP",
        )
    )


    assert result[
        "rate"
    ] == pytest.approx(
        0.8
    )

    assert result[
        "symbol"
    ] == "GBPUSD=X"

    assert (
        "inverse"
        in result[
            "source"
        ].lower()
    )


def test_missing_fx_pair_is_explicit(
    monkeypatch,
):

    monkeypatch.setattr(
        service,
        "_download_latest_fx",
        lambda symbol:
            None,
    )


    with pytest.raises(
        ValueError,
        match="could not be retrieved",
    ):

        service.get_fx_quote(
            "USD",
            "GBP",
        )


def test_gbpence_normalises_to_gbp_identity(
    monkeypatch,
):

    monkeypatch.setattr(
        service,
        "_download_latest_fx",
        lambda symbol:
            (_ for _ in ()).throw(
                AssertionError(
                    "No FX request expected."
                )
            ),
    )


    result = (
        service.get_fx_quote(
            "GBp",
            "GBP",
        )
    )


    assert result[
        "rate"
    ] == 1.0
