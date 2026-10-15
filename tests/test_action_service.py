from backend.action_service import (
    build_action_centre,
)


def sample_exposure():

    return {
        "concentration": {
            "largest_holding": {
                "ticker":
                    "AAPL",

                "weight":
                    0.403,
            },

            "top_two_weight":
                0.786,

            "largest_sector": {
                "name":
                    "Technology",

                "weight":
                    1.0,
            },
        },
    }


def sample_diversification():

    return {
        "diversification_score":
            78.0,

        "effective_holdings":
            2.82,

        "weighted_average_correlation":
            0.35,
    }


def sample_stress():

    return {
        "historical_scenarios": [
            {
                "window_days":
                    1,

                "portfolio_return":
                    -0.063,
            },

            {
                "window_days":
                    5,

                "portfolio_return":
                    -0.148,
            },

            {
                "window_days":
                    21,

                "portfolio_return":
                    -0.161,
            },
        ],
    }


def sample_performance():

    return {
        "benchmark":
            "ACWI",

        "portfolio": {
            "annualised_return":
                0.342,

            "annualised_volatility":
                0.233,

            "max_drawdown":
                -0.269,
        },

        "benchmark_metrics": {
            "annualised_return":
                0.219,

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


def test_sector_concentration_is_ranked():

    result = (
        build_action_centre(
            exposure=
                sample_exposure(),
        )
    )


    ids = [
        item[
            "id"
        ]
        for item
        in result[
            "items"
        ]
    ]


    assert (
        "sector-concentration"
        in ids
    )


def test_sector_concentration_is_high_priority():

    result = (
        build_action_centre(
            exposure=
                sample_exposure(),
        )
    )


    item = next(
        item
        for item
        in result[
            "items"
        ]
        if item[
            "id"
        ]
        == "sector-concentration"
    )


    assert (
        item[
            "priority"
        ]
        == "high"
    )


def test_top_two_is_not_duplicated_when_single_name_is_flagged():

    result = (
        build_action_centre(
            exposure=
                sample_exposure(),
        )
    )


    ids = [
        item[
            "id"
        ]
        for item
        in result[
            "items"
        ]
    ]


    assert (
        "single-name-concentration"
        in ids
    )


    assert (
        "top-two-concentration"
        not in ids
    )



def test_top_two_detected_when_no_single_name_dominates():

    result = (
        build_action_centre(
            exposure={
                "concentration": {
                    "largest_holding": {
                        "ticker":
                            "AAA",

                        "weight":
                            0.30,
                    },

                    "top_two_weight":
                        0.80,

                    "largest_sector": {
                        "name":
                            "Mixed",

                        "weight":
                            0.40,
                    },
                },
            },
        )
    )


    ids = [
        item[
            "id"
        ]
        for item
        in result[
            "items"
        ]
    ]


    assert (
        "top-two-concentration"
        in ids
    )



def test_positive_diversification_context():

    result = (
        build_action_centre(
            diversification=
                sample_diversification(),
        )
    )


    item = next(
        item
        for item
        in result[
            "items"
        ]
        if item[
            "id"
        ]
        == "diversification-context"
    )


    assert (
        item[
            "priority"
        ]
        == "context"
    )


    assert (
        item[
            "category"
        ]
        == "Diversification"
    )



def test_historical_stress_detected():

    result = (
        build_action_centre(
            stress=
                sample_stress(),

            portfolio_value=
                3205,
        )
    )


    item = next(
        item
        for item
        in result[
            "items"
        ]
        if item[
            "id"
        ]
        == "historical-stress"
    )


    assert (
        item[
            "priority"
        ]
        == "medium"
    )


def test_drawdown_gap_detected():

    result = (
        build_action_centre(
            performance=
                sample_performance(),
        )
    )


    assert any(
        item[
            "id"
        ]
        == "benchmark-drawdown-gap"
        for item
        in result[
            "items"
        ]
    )


def test_outperformance_is_context_not_recommendation():

    result = (
        build_action_centre(
            performance=
                sample_performance(),
        )
    )


    item = next(
        item
        for item
        in result[
            "items"
        ]
        if item[
            "id"
        ]
        == "historical-outperformance"
    )


    assert (
        item[
            "priority"
        ]
        == "context"
    )


    assert (
        "future"
        in item[
            "review_prompt"
        ].lower()
    )


def test_bearish_sentiment_requires_confidence():

    result = (
        build_action_centre(
            sentiment={
                "ticker_results": [
                    {
                        "ticker":
                            "AAA",

                        "signal":
                            "Bearish",

                        "confidence":
                            0.70,
                    },

                    {
                        "ticker":
                            "BBB",

                        "signal":
                            "Bearish",

                        "confidence":
                            0.30,
                    },
                ],
            },
        )
    )


    ids = [
        item[
            "id"
        ]
        for item
        in result[
            "items"
        ]
    ]


    assert (
        "sentiment-AAA-bearish"
        in ids
    )


    assert (
        "sentiment-BBB-bearish"
        not in ids
    )


def test_results_are_ranked_and_capped():

    result = (
        build_action_centre(
            exposure=
                sample_exposure(),

            diversification=
                sample_diversification(),

            stress=
                sample_stress(),

            performance=
                sample_performance(),

            max_items=
                3,
        )
    )


    assert (
        len(
            result[
                "items"
            ]
        )
        == 3
    )


    scores = [
        item[
            "score"
        ]
        for item
        in result[
            "items"
        ]
    ]


    assert (
        scores
        == sorted(
            scores,
            reverse=True,
        )
    )


def test_existing_finclarity_ticker_sentiment_schema():

    result = (
        build_action_centre(
            sentiment={
                "ticker_sentiment": {
                    "AAA": {
                        "sentiment_score":
                            -0.40,

                        "confidence":
                            0.72,

                        "regime":
                            "Bearish",

                        "article_count":
                            5,
                    },
                },
            },
        )
    )


    ids = [
        item[
            "id"
        ]
        for item
        in result[
            "items"
        ]
    ]


    assert (
        "sentiment-AAA-bearish"
        in ids
    )
