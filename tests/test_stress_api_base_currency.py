from fastapi import FastAPI
from fastapi.testclient import TestClient

import backend.stress_api as stress_api


app = FastAPI()

app.include_router(
    stress_api.router
)


client = TestClient(
    app
)


def test_stress_api_forwards_base_currency(
    monkeypatch,
):

    seen = {}


    def fake_analyse_stress(
        **kwargs,
    ):

        seen.update(
            kwargs
        )


        return {
            "base_currency":
                kwargs[
                    "base_currency"
                ]
        }


    monkeypatch.setattr(
        stress_api,
        "analyse_stress",
        fake_analyse_stress,
    )


    response = client.post(
        "/api/stress/analyse",
        json={
            "tickers":
                [
                    "AAA",
                    "BBB",
                ],

            "weights":
                [
                    0.5,
                    0.5,
                ],

            "years":
                3,

            "base_currency":
                "GBP",
        },
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        seen[
            "base_currency"
        ]
        == "GBP"
    )


    assert (
        response.json()[
            "base_currency"
        ]
        == "GBP"
    )


def test_stress_api_defaults_to_usd(
    monkeypatch,
):

    seen = {}


    def fake_analyse_stress(
        **kwargs,
    ):

        seen.update(
            kwargs
        )

        return {
            "base_currency":
                kwargs[
                    "base_currency"
                ]
        }


    monkeypatch.setattr(
        stress_api,
        "analyse_stress",
        fake_analyse_stress,
    )


    response = client.post(
        "/api/stress/analyse",
        json={
            "tickers":
                [
                    "AAA",
                    "BBB",
                ],

            "weights":
                [
                    0.5,
                    0.5,
                ],
        },
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        seen[
            "base_currency"
        ]
        == "USD"
    )
