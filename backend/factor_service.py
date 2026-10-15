from backend.factor_model import (
    build_factor_model,
)

from backend.market_data import (
    get_historical_prices,
)

from backend.sentiment_service import (
    analyse_portfolio_sentiment,
)


# ========================================
# COMPLETE FACTOR ANALYSIS
# ========================================

def analyse_factor_portfolio(
    tickers,
    benchmark="SPY",
    years=3,
    articles_per_ticker=5,
    lookback_hours=72,
    factor_weights=None,):

    cleaned_tickers = []

    for ticker in tickers:

        cleaned = (
            str(ticker)
            .strip()
            .upper()
        )

        if (
            cleaned
            and cleaned not in cleaned_tickers
        ):

            cleaned_tickers.append(
                cleaned
            )


    if len(cleaned_tickers) < 2:

        raise ValueError(
            "At least two valid asset tickers "
            "are required."
        )


    benchmark = (
        str(benchmark)
        .strip()
        .upper()
    )


    if not benchmark:

        raise ValueError(
            "Benchmark ticker cannot be empty."
        )


    if benchmark in cleaned_tickers:

        raise ValueError(
            "Benchmark must be separate from "
            "the analysed asset universe."
        )


    # ------------------------------------
    # MARKET DATA
    # ------------------------------------

    requested = (
        cleaned_tickers
        + [benchmark]
    )


    (
        prices,
        _requested_tickers,
        available_tickers,
    ) = get_historical_prices(
        requested,
        years,
    )


    missing = [
        ticker
        for ticker in requested
        if ticker not in available_tickers
    ]


    if missing:

        raise ValueError(
            "Market data unavailable for: "
            + ", ".join(
                missing
            )
        )


    asset_prices = (
        prices[
            cleaned_tickers
        ]
        .dropna()
    )


    market_prices = (
        prices[
            benchmark
        ]
        .dropna()
    )


    # ------------------------------------
    # SENTIMENT DATA
    # ------------------------------------

    sentiment = (
        analyse_portfolio_sentiment(
            tickers=cleaned_tickers,
            articles_per_ticker=(
                articles_per_ticker
            ),
            lookback_hours=(
                lookback_hours
            ),
        )
    )


    sentiment_scores = {

        ticker:
            sentiment[
                "ticker_sentiment"
            ][ticker][
                "sentiment_score"
            ]

        for ticker in cleaned_tickers
    }


    # ------------------------------------
    # FACTOR MODEL
    # ------------------------------------

    factor_result = (
        build_factor_model(
            prices=asset_prices,
            market_prices=market_prices,
            sentiment_scores=(
                sentiment_scores
            ),
            factor_weights=(
                factor_weights
            ),
        )
    )


    # ------------------------------------
    # SERIALISE CLEANLY
    # ------------------------------------

    assets = []


    for asset in factor_result[
        "assets"
    ]:

        assets.append(
            {
                "ticker":
                    asset[
                        "ticker"
                    ],

                "rank":
                    int(
                        asset[
                            "rank"
                        ]
                    ),

                "beta":
                    round(
                        float(
                            asset[
                                "beta"
                            ]
                        ),
                        4,
                    ),

                "momentum":
                    round(
                        float(
                            asset[
                                "momentum"
                            ]
                        ),
                        6,
                    ),

                "volatility":
                    round(
                        float(
                            asset[
                                "volatility"
                            ]
                        ),
                        6,
                    ),

                "idiosyncratic_volatility":
                    round(
                        float(
                            asset[
                                "idiosyncratic_volatility"
                            ]
                        ),
                        6,
                    ),

                "sentiment":
                    round(
                        float(
                            asset[
                                "sentiment"
                            ]
                        ),
                        6,
                    ),

                "composite_alpha_score":
                    round(
                        float(
                            asset[
                                "composite_alpha_score"
                            ]
                        ),
                        6,
                    ),

                "factor_scores": {

                    name:
                        round(
                            float(value),
                            6,
                        )

                    for name, value
                    in asset[
                        "factor_scores"
                    ].items()
                },

                "sentiment_confidence":
                    round(
                        float(
                            sentiment[
                                "ticker_sentiment"
                            ][
                                asset["ticker"]
                            ][
                                "confidence"
                            ]
                        ),
                        6,
                    ),

                "sentiment_signal":
                    sentiment[
                        "ticker_sentiment"
                    ][
                        asset["ticker"]
                    ][
                        "signal"
                    ],

                "rag_signal":
                    sentiment[
                        "ticker_sentiment"
                    ][
                        asset["ticker"]
                    ][
                        "rag_signal"
                    ],
            }
        )


    return {

        "tickers":
            cleaned_tickers,

        "benchmark":
            benchmark,

        "assets":
            assets,

        "factor_weights":
            factor_result[
                "factor_weights"
            ],

        "portfolio_sentiment":
            sentiment[
                "portfolio_sentiment"
            ],

        "market_data": {

            "years":
                years,

            "start_date":
                asset_prices
                .index[0]
                .strftime(
                    "%Y-%m-%d"
                ),

            "end_date":
                asset_prices
                .index[-1]
                .strftime(
                    "%Y-%m-%d"
                ),

            "observations":
                int(
                    len(
                        asset_prices
                    )
                ),
        },

        "methodology":
            factor_result[
                "methodology"
            ],
    }
