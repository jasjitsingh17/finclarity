from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(
    app
)


def test_stress_years_validation():

    response = client.post(
        "/api/stress/analyse",
        json={
            "tickers": [
                "AAPL",
                "MSFT",
            ],

            "weights": [
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


def test_custom_stress_weight_mismatch():

    response = client.post(
        "/api/stress/custom",
        json={
            "tickers": [
                "AAPL",
                "MSFT",
            ],

            "weights": [
                1.0,
            ],

            "shocks": {
                "AAPL":
                    -0.10,

                "MSFT":
                    -0.10,
            },
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


def test_custom_stress_endpoint():

    response = client.post(
        "/api/stress/custom",
        json={
            "tickers": [
                "AAPL",
                "MSFT",
            ],

            "weights": [
                0.6,
                0.4,
            ],

            "shocks": {
                "AAPL":
                    -0.10,

                "MSFT":
                    -0.05,
            },
        },
    )


    assert (
        response.status_code
        == 200
    )


    payload = (
        response.json()
    )


    assert (
        payload[
            "portfolio_impact"
        ]
        == -0.08
    )


def test_custom_stress_rejects_impossible_loss():

    response = client.post(
        "/api/stress/custom",
        json={
            "tickers": [
                "AAPL",
            ],

            "weights": [
                1.0,
            ],

            "shocks": {
                "AAPL":
                    -1.10,
            },
        },
    )


    assert (
        response.status_code
        == 400
    )
