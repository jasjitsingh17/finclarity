from backend.action_api import (
    _analytics_status_for_module,
)

from backend.action_service import (
    build_action_centre,
)


def performance_payload(
    *,
    partial=False,
):
    return {
        "portfolio": {
            "annualised_volatility": 0.30,
            "max_drawdown": -0.30,
        },

        "benchmark_metrics": {
            "annualised_volatility": 0.20,
            "max_drawdown": -0.20,
        },

        "relative": {
            "cumulative_return_difference": -0.05,
            "beta": 1.20,
        },

        "benchmark": "ACWI",

        "benchmark_available": True,

        "missing_tickers":
            ["MISSING"]
            if partial
            else [],

        "data_coverage": {
            "weight_coverage":
                0.60
                if partial
                else 1.0,

            "excluded_weight":
                0.40
                if partial
                else 0.0,

            "weights_renormalised":
                partial,

            "excluded_tickers":
                ["MISSING"]
                if partial
                else [],
        },
    }


def stress_payload(
    *,
    partial=False,
):
    return {
        "historical_scenarios": [
            {
                "window_days": 21,
                "portfolio_return": -0.25,
            },
        ],

        "missing_tickers":
            ["MISSING"]
            if partial
            else [],
    }


def test_partial_performance_is_not_ranked():
    result = build_action_centre(
        performance=
            performance_payload(
                partial=True,
            ),
    )

    assert not any(
        item["category"] == "Performance"
        for item in result["items"]
    )

    assert (
        result["synthesis_coverage"]
        ["performance"]
        == "partial_excluded"
    )


def test_full_performance_can_still_rank():
    result = build_action_centre(
        performance=
            performance_payload(
                partial=False,
            ),
    )

    assert any(
        item["category"] == "Performance"
        for item in result["items"]
    )

    assert (
        result["synthesis_coverage"]
        ["performance"]
        == "eligible"
    )


def test_partial_stress_is_not_ranked():
    result = build_action_centre(
        stress=
            stress_payload(
                partial=True,
            ),
    )

    assert not any(
        item["category"] == "Stress"
        for item in result["items"]
    )


def test_full_stress_can_still_rank():
    result = build_action_centre(
        stress=
            stress_payload(
                partial=False,
            ),
    )

    assert any(
        item["category"] == "Stress"
        for item in result["items"]
    )


def test_empty_synthesis_does_not_report_low():
    result = build_action_centre()

    assert result["items"] == []

    assert (
        result["attention_level"]
        == "No material findings"
    )


def test_status_distinguishes_partial_performance():
    assert (
        _analytics_status_for_module(
            "performance",
            performance_payload(
                partial=True,
            ),
        )
        == "partial"
    )


def test_status_marks_full_performance_available():
    assert (
        _analytics_status_for_module(
            "performance",
            performance_payload(
                partial=False,
            ),
        )
        == "available"
    )


def test_status_marks_missing_module_unavailable():
    assert (
        _analytics_status_for_module(
            "performance",
            None,
        )
        == "unavailable"
    )


def test_diversification_missing_ticker_is_partial():
    result = {
        "missing_tickers": [
            "MISSING",
        ],
    }

    assert (
        _analytics_status_for_module(
            "diversification",
            result,
        )
        == "partial"
    )


def test_zero_article_sentiment_is_partial():
    result = {
        "total_articles": 0,
        "errors": {},
    }

    assert (
        _analytics_status_for_module(
            "sentiment",
            result,
        )
        == "partial"
    )
