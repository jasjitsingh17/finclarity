from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(
    app
)


def test_performance_years_validation():

    response = client.post(
        "/api/performance/analyse",
        json={
            "tickers": [
                "AAPL",
                "MSFT",
            ],

            "weights": [
                0.5,
                0.5,
            ],

            "benchmark":
                "ACWI",

            "years":
                0,
        },
    )


    assert (
        response.status_code
        == 422
    )


def test_performance_weight_mismatch():

    response = client.post(
        "/api/performance/analyse",
        json={
            "tickers": [
                "AAPL",
                "MSFT",
            ],

            "weights": [
                1.0,
            ],

            "benchmark":
                "ACWI",

            "years":
                3,
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


def test_performance_empty_benchmark():

    response = client.post(
        "/api/performance/analyse",
        json={
            "tickers": [
                "AAPL",
                "MSFT",
            ],

            "weights": [
                0.5,
                0.5,
            ],

            "benchmark":
                "   ",

            "years":
                3,
        },
    )


    assert (
        response.status_code
        == 400
    )


    assert (
        "Benchmark cannot be empty"
        in response.json()[
            "detail"
        ]
    )
