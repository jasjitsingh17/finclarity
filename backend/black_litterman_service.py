from backend.black_litterman import (
    run_black_litterman,
)

from backend.market_data import (
    build_market_analysis,
)

from backend.optimizer import (
    efficient_frontier,
    maximise_sharpe,
    minimise_variance,
)

from backend.sentiment_service import (
    analyse_portfolio_sentiment,
)


def analyse_black_litterman_portfolio(
    tickers,
    reference_weights=None,
    years=3,
    risk_free_rate=0.04,
    risk_aversion=2.5,
    tau=0.05,
    view_scale=0.06,
    min_weight=0.0,
    max_weight=1.0,
    frontier_points=20,
    articles_per_ticker=5,
    lookback_hours=72,
):

    # ------------------------------------
    # MARKET DATA
    # ------------------------------------

    (
        market_model,
        _daily_returns,
    ) = build_market_analysis(
        tickers,
        years,
    )


    available_tickers = (
        market_model[
            "tickers"
        ]
    )


    missing_tickers = (
        market_model[
            "missing_tickers"
        ]
    )


    if missing_tickers:

        raise ValueError(
            "Market data unavailable for: "
            + ", ".join(
                missing_tickers
            )
        )


    covariance_matrix = (
        market_model[
            "covariance_matrix"
        ]
    )


    # ------------------------------------
    # SENTIMENT
    # ------------------------------------

    sentiment = (
        analyse_portfolio_sentiment(
            tickers=(
                available_tickers
            ),
            articles_per_ticker=(
                articles_per_ticker
            ),
            lookback_hours=(
                lookback_hours
            ),
        )
    )


    # ------------------------------------
    # BLACK-LITTERMAN
    # ------------------------------------

    black_litterman = (
        run_black_litterman(
            tickers=(
                available_tickers
            ),
            covariance_matrix=(
                covariance_matrix
            ),
            ticker_sentiment=(
                sentiment[
                    "ticker_sentiment"
                ]
            ),
            reference_weights=(
                reference_weights
            ),
            risk_aversion=(
                risk_aversion
            ),
            tau=tau,
            view_scale=(
                view_scale
            ),
        )
    )


    posterior_returns = (
        black_litterman[
            "posterior_returns"
        ]
    )


    # ------------------------------------
    # OPTIMISE POSTERIOR RETURNS
    # ------------------------------------

    maximum_sharpe = (
        maximise_sharpe(
            posterior_returns,
            covariance_matrix,
            risk_free_rate,
            min_weight,
            max_weight,
        )
    )


    minimum_variance = (
        minimise_variance(
            posterior_returns,
            covariance_matrix,
            min_weight,
            max_weight,
        )
    )


    frontier = (
        efficient_frontier(
            posterior_returns,
            covariance_matrix,
            frontier_points,
            min_weight,
            max_weight,
        )
    )


    def map_weights(
        weights,
    ):

        return {
            ticker:
                round(
                    float(weight),
                    6,
                )

            for ticker, weight
            in zip(
                available_tickers,
                weights,
            )
        }


    def map_returns(
        values,
    ):

        return {
            ticker:
                round(
                    float(value),
                    6,
                )

            for ticker, value
            in zip(
                available_tickers,
                values,
            )
        }


    return {

        "tickers":
            available_tickers,

        "prior": {

            "source":
                (
                    "Reference-portfolio "
                    "implied equilibrium"
                ),

            "risk_aversion":
                risk_aversion,

            "tau":
                tau,

            "reference_weights":
                map_weights(
                    black_litterman[
                        "reference_weights"
                    ]
                ),

            "expected_returns":
                map_returns(
                    black_litterman[
                        "prior_returns"
                    ]
                ),
        },


        "sentiment_views": {

            "view_scale":
                view_scale,

            "views":
                black_litterman[
                    "views"
                ],

            "view_returns":
                map_returns(
                    black_litterman[
                        "view_returns"
                    ]
                ),

            "omega_diagonal":
                map_returns(
                    black_litterman[
                        "omega_diagonal"
                    ]
                ),
        },


        "posterior": {

            "expected_returns":
                map_returns(
                    black_litterman[
                        "posterior_returns"
                    ]
                ),
        },


        "portfolio_sentiment":
            sentiment[
                "portfolio_sentiment"
            ],


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


        "efficient_frontier":
            frontier,


        "market_data": {

            "start_date":
                market_model[
                    "start_date"
                ],

            "end_date":
                market_model[
                    "end_date"
                ],

            "observations":
                market_model[
                    "observations"
                ],
        },


        "methodology": {

            "prior":
                (
                    "Reverse-optimised equilibrium "
                    "returns from reference weights"
                ),

            "view_source":
                "FinBERT financial-news sentiment",

            "view_definition":
                (
                    "Prior return + "
                    "sentiment score × view scale"
                ),

            "view_uncertainty":
                (
                    "Omega derived from FinBERT "
                    "confidence and headline coverage"
                ),

            "optimisation":
                (
                    "Maximum Sharpe using "
                    "Black-Litterman posterior returns"
                ),
        },
    }
