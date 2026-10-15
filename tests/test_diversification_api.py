from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(
    app
)


def test_diversification_requires_two_assets():

    response = client.post(
        "/api/diversification/analyse",
        json={
            "tickers":
                [
                    "AAA",
                ],

            "weights":
                [
                    1.0,
                ],

            "years":
                3,
        },
    )


    assert (
        response.status_code
        == 400
    )


    payload = (
        response.json()
    )


    assert (
        "At least two valid tickers"
        in payload[
            "detail"
        ]
    )


def test_years_validation():

    response = client.post(
        "/api/diversification/analyse",
        json={
            "tickers":
                [
                    "AAPL",
                    "MSFT",
                ],

            "weights":
                [
                    0.5,
                    0.5,
                ],

            "years":
                0,
        },
    )


    assert (
        response.status_code
        == 422
    )


def test_weights_and_tickers_must_match():

    response = client.post(
        "/api/diversification/analyse",
        json={
            "tickers":
                [
                    "AAPL",
                    "MSFT",
                ],

            "weights":
                [
                    1.0,
                ],

            "years":
                3,
        },
    )


    assert (
        response.status_code
        == 400
    )


    payload = (
        response.json()
    )


    assert (
        "same length"
        in payload[
            "detail"
        ]
    )
