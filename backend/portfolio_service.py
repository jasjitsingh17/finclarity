from backend.market_data import (
    build_market_analysis,
)

from backend.risk_engine import (
    calculate_risk_summary,
)

from backend.optimizer import (
    efficient_frontier,
    maximise_sharpe,
    minimise_variance,
    portfolio_return,
    portfolio_volatility,
    sharpe_ratio,
)


# ========================================
# COMPLETE PORTFOLIO ANALYSIS
# ========================================

def analyse_portfolio(
    tickers,
    years=3,
    current_weights=None,
    risk_free_rate=0.03,
    min_weight=0.0,
    max_weight=1.0,
    frontier_points=25,
):

    # ------------------------------------
    # MARKET DATA
    # ------------------------------------

    (
        market_model,
        daily_returns,
    ) = build_market_analysis(
        tickers,
        years,
    )


    available_tickers = (
        market_model["tickers"]
    )

    missing_tickers = (
        market_model["missing_tickers"]
    )


    if missing_tickers:

        raise ValueError(
            "Market data was unavailable for: "
            + ", ".join(missing_tickers)
        )


    number_of_assets = len(
        available_tickers
    )


    expected_returns = (
        market_model[
            "expected_returns"
        ]
    )

    covariance_matrix = (
        market_model[
            "covariance_matrix"
        ]
    )


    # ------------------------------------
    # CONSTRAINT VALIDATION
    # ------------------------------------

    if min_weight > max_weight:

        raise ValueError(
            "min_weight cannot be greater "
            "than max_weight."
        )


    if (
        number_of_assets * min_weight
        > 1.0 + 1e-9
    ):

        raise ValueError(
            "Minimum-weight constraint "
            "is infeasible."
        )


    if (
        number_of_assets * max_weight
        < 1.0 - 1e-9
    ):

        raise ValueError(
            "Maximum-weight constraint "
            "is infeasible."
        )


    # ------------------------------------
    # CURRENT PORTFOLIO
    # ------------------------------------

    if current_weights is None:

        current_weights = [
            1 / number_of_assets
            for _ in range(
                number_of_assets
            )
        ]

    else:

        if (
            len(current_weights)
            != number_of_assets
        ):

            raise ValueError(
                "Current weights must match "
                "the number of valid tickers."
            )


        if any(
            weight < 0
            for weight in current_weights
        ):

            raise ValueError(
                "Current portfolio weights "
                "cannot be negative yet."
            )


        weight_total = sum(
            current_weights
        )


        if weight_total <= 0:

            raise ValueError(
                "Current portfolio weights "
                "must sum to a positive value."
            )


        # Normalise small rounding differences.

        current_weights = [
            weight / weight_total
            for weight in current_weights
        ]


    current_expected_return = (
        portfolio_return(
            current_weights,
            expected_returns,
        )
    )


    current_volatility = (
        portfolio_volatility(
            current_weights,
            covariance_matrix,
        )
    )


    current_sharpe = (
        sharpe_ratio(
            current_weights,
            expected_returns,
            covariance_matrix,
            risk_free_rate,
        )
    )


    # ------------------------------------
    # OPTIMISATION
    # ------------------------------------

    maximum_sharpe = (
        maximise_sharpe(
            expected_returns,
            covariance_matrix,
            risk_free_rate,
            min_weight,
            max_weight,
        )
    )


    minimum_variance = (
        minimise_variance(
            expected_returns,
            covariance_matrix,
            min_weight,
            max_weight,
        )
    )


    frontier = (
        efficient_frontier(
            expected_returns,
            covariance_matrix,
            frontier_points,
            min_weight,
            max_weight,
        )
    )


    # ------------------------------------

    # ====================================
    # RISK ANALYTICS
    # ====================================

    current_risk = (
        calculate_risk_summary(
            daily_returns,
            current_weights,
            risk_free_rate,
        )
    )

    maximum_sharpe_risk = (
        calculate_risk_summary(
            daily_returns,
            maximum_sharpe["weights"],
            risk_free_rate,
        )
    )

    minimum_variance_risk = (
        calculate_risk_summary(
            daily_returns,
            minimum_variance["weights"],
            risk_free_rate,
        )
    )


    # WEIGHT MAPPING
    # ------------------------------------

    def map_weights(weights):

        return {
            ticker: round(
                float(weight),
                6,
            )
            for ticker, weight
            in zip(
                available_tickers,
                weights,
            )
        }


    frontier_response = [
        {
            "expected_return":
                round(
                    point[
                        "expected_return"
                    ],
                    6,
                ),

            "volatility":
                round(
                    point[
                        "volatility"
                    ],
                    6,
                ),

            "weights":
                map_weights(
                    point["weights"]
                ),
        }

        for point in frontier
    ]


    # ------------------------------------
    # RESPONSE
    # ------------------------------------

    return {

        "tickers":
            available_tickers,

        "risk_free_rate":
            risk_free_rate,

        "market_data": {

            "years":
                years,

            "observations":
                market_model[
                    "observations"
                ],

            "start_date":
                market_model[
                    "start_date"
                ],

            "end_date":
                market_model[
                    "end_date"
                ],

            "methodology":
                market_model[
                    "methodology"
                ],
        },


        "model_inputs": {

            "expected_returns": {
                ticker: round(
                    float(value),
                    6,
                )

                for ticker, value
                in zip(
                    available_tickers,
                    expected_returns,
                )
            },

            "covariance_matrix":
                covariance_matrix,
        },


        "current_portfolio": {

            "weights":
                map_weights(
                    current_weights
                ),

            "expected_return":
                round(
                    current_expected_return,
                    6,
                ),

            "volatility":
                round(
                    current_volatility,
                    6,
                ),

            "sharpe_ratio":
                round(
                    current_sharpe,
                    6,
                ),
        },


        "maximum_sharpe": {

            "weights":
                map_weights(
                    maximum_sharpe[
                        "weights"
                    ]
                ),

            "expected_return":
                round(
                    maximum_sharpe[
                        "expected_return"
                    ],
                    6,
                ),

            "volatility":
                round(
                    maximum_sharpe[
                        "volatility"
                    ],
                    6,
                ),

            "sharpe_ratio":
                round(
                    maximum_sharpe[
                        "sharpe_ratio"
                    ],
                    6,
                ),
        },


        "minimum_variance": {

            "weights":
                map_weights(
                    minimum_variance[
                        "weights"
                    ]
                ),

            "expected_return":
                round(
                    minimum_variance[
                        "expected_return"
                    ],
                    6,
                ),

            "volatility":
                round(
                    minimum_variance[
                        "volatility"
                    ],
                    6,
                ),
        },


        "risk_analytics": {

            "current_portfolio":
                current_risk,

            "maximum_sharpe":
                maximum_sharpe_risk,

            "minimum_variance":
                minimum_variance_risk,
        },


        "efficient_frontier":
            frontier_response,
    }