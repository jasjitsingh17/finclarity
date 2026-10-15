from fastapi.testclient import TestClient

import backend.action_api as action_api

from backend.main import app


client = TestClient(
    app
)


def fake_exposure(
    tickers,
    weights,
):
    return {
        "concentration": {
            "largest_holding": {
                "ticker":
                    tickers[0],

                "weight":
                    weights[0],
            },

            "top_two_weight":
                sum(
                    sorted(
                        weights,
                        reverse=True,
                    )[:2]
                ),

            "largest_sector": {
                "name":
                    "Technology",

                "weight":
                    1.0,
            },
        },
    }


def fake_diversification(
    tickers,
    weights,
    years,
):
    return {
        "diversification_score":
            78.0,

        "effective_holdings":
            2.82,

        "weighted_average_correlation":
            0.35,
    }


def fake_stress(
    tickers,
    weights,
    years,
):
    return {
        "historical_scenarios": [
            {
                "window_days":
                    21,

                "portfolio_return":
                    -0.161,
            },
        ],
    }


def fake_performance(
    tickers,
    weights,
    benchmark,
    years,
    base_currency="USD",
):
    return {
        "benchmark":
            benchmark,

        "portfolio": {
            "annualised_volatility":
                0.233,

            "max_drawdown":
                -0.269,
        },

        "benchmark_metrics": {
            "annualised_volatility":
                0.146,

            "max_drawdown":
                -0.165,
        },

        "relative": {
            "cumulative_return_difference":
                0.592,

            "beta":
                1.19,
        },
    }


def fake_sentiment(
    tickers,
    articles_per_ticker=8,
    lookback_hours=72,
):
    return {
        "portfolio_sentiment": {
            "sentiment_score":
                0.10,

            "confidence":
                0.70,

            "regime":
                "Positive",
        },

        "ticker_sentiment": {
            ticker: {
                "sentiment_score":
                    0.20,

                "confidence":
                    0.70,

                "signal":
                    "Positive",

                "article_count":
                    4,
            }
            for ticker
            in tickers
        },

        "total_articles":
            4 * len(
                tickers
            ),

        "errors":
            {},
    }



def patch_analytics(
    monkeypatch,
):

    monkeypatch.setattr(
        action_api,
        "analyse_exposure",
        fake_exposure,
    )

    monkeypatch.setattr(
        action_api,
        "analyse_diversification",
        fake_diversification,
    )

    monkeypatch.setattr(
        action_api,
        "analyse_stress",
        fake_stress,
    )

    monkeypatch.setattr(
        action_api,
        "analyse_performance",
        fake_performance,
    )

    monkeypatch.setattr(
        action_api,
        "analyse_portfolio_sentiment",
        fake_sentiment,
    )


def test_action_centre_validation():

    response = client.post(
        "/api/action-centre/analyse",
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


def test_action_centre_orchestration(
    monkeypatch,
):

    patch_analytics(
        monkeypatch
    )


    response = client.post(
        "/api/action-centre/analyse",
        json={
            "tickers": [
                "AAPL",
                "MSFT",
                "NVDA",
            ],

            "weights": [
                0.403,
                0.383,
                0.214,
            ],

            "portfolio_value":
                3205,

            "currency":
                "GBP",

            "benchmark":
                "ACWI",

            "years":
                3,
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
            "attention_level"
        ]
        in (
            "High",
            "Moderate",
            "Low",
        )
    )


    assert (
        payload[
            "analytics_status"
        ][
            "exposure"
        ]
        == "available"
    )


    assert (
        payload[
            "analytics_status"
        ][
            "sentiment"
        ]
        == "available"
    )


    assert (
        len(
            payload[
                "items"
            ]
        )
        > 0
    )


def test_action_centre_isolates_module_failure(
    monkeypatch,
):

    patch_analytics(
        monkeypatch
    )


    def broken_stress(
        tickers,
        weights,
        years,
    ):
        raise RuntimeError(
            "Stress provider unavailable."
        )


    monkeypatch.setattr(
        action_api,
        "analyse_stress",
        broken_stress,
    )


    response = client.post(
        "/api/action-centre/analyse",
        json={
            "tickers": [
                "AAPL",
                "MSFT",
            ],

            "weights": [
                0.6,
                0.4,
            ],
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
            "analytics_status"
        ][
            "stress"
        ]
        == "unavailable"
    )


    assert (
        "stress"
        in payload[
            "analytics_errors"
        ]
    )


    assert (
        payload[
            "analytics_status"
        ][
            "exposure"
        ]
        == "available"
    )


def test_single_holding_does_not_break_endpoint(
    monkeypatch,
):

    patch_analytics(
        monkeypatch
    )


    response = client.post(
        "/api/action-centre/analyse",
        json={
            "tickers": [
                "AAPL",
            ],

            "weights": [
                1.0,
            ],
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
            "analytics_status"
        ][
            "diversification"
        ]
        == "unavailable"
    )
