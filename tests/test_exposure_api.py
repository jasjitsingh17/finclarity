from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(
    app
)


def test_exposure_weight_mismatch():

    response = client.post(
        "/api/exposure/analyse",
        json={
            "tickers": [
                "AAPL",
                "MSFT",
            ],

            "weights": [
                1.0,
            ],
        },
    )


    assert (
        response.status_code
        == 400
    )


    assert (
        "same length"
        in response.json()[
            "detail"
        ]
    )


def test_exposure_empty_portfolio():

    response = client.post(
        "/api/exposure/analyse",
        json={
            "tickers":
                [],

            "weights":
                [],
        },
    )


    assert (
        response.status_code
        == 400
    )


def test_exposure_negative_weight():

    response = client.post(
        "/api/exposure/analyse",
        json={
            "tickers": [
                "AAPL",
                "MSFT",
            ],

            "weights": [
                1.1,
                -0.1,
            ],
        },
    )


    assert (
        response.status_code
        == 400
    )
