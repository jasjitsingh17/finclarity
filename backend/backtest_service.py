from backend.backtest_engine import (
    run_walk_forward_backtest,
)

from backend.market_data import (
    get_historical_prices,
)


def analyse_backtest(
    tickers,
    benchmark="SPY",
    years=5,
    risk_free_rate=0.04,
    training_days=252,
    rebalance_days=21,
    min_weight=0.0,
    max_weight=1.0,
    transaction_cost_bps=10.0,
):

    cleaned_tickers = []


    for ticker in tickers:

        cleaned = (
            str(ticker)
            .strip()
            .upper()
        )


        if (
            cleaned
            and cleaned
            not in cleaned_tickers
        ):

            cleaned_tickers.append(
                cleaned
            )


    if len(cleaned_tickers) < 2:

        raise ValueError(
            "At least two valid tickers "
            "are required."
        )


    benchmark = (
        str(benchmark)
        .strip()
        .upper()
    )


    if benchmark in cleaned_tickers:

        raise ValueError(
            "Benchmark must be separate "
            "from the asset universe."
        )


    requested = (
        cleaned_tickers
        + [benchmark]
    )


    (
        prices,
        _requested,
        available,
    ) = get_historical_prices(
        requested,
        years,
    )


    missing = [
        ticker
        for ticker in requested
        if ticker not in available
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
    )


    benchmark_prices = (
        prices[
            benchmark
        ]
    )


    result = (
        run_walk_forward_backtest(
            prices=asset_prices,
            benchmark_prices=(
                benchmark_prices
            ),
            risk_free_rate=(
                risk_free_rate
            ),
            training_days=(
                training_days
            ),
            rebalance_days=(
                rebalance_days
            ),
            min_weight=(
                min_weight
            ),
            max_weight=(
                max_weight
            ),
            transaction_cost_bps=(
                transaction_cost_bps
            ),
        )
    )


    return {

        "tickers":
            cleaned_tickers,

        "benchmark_ticker":
            benchmark,

        "configuration": {

            "years":
                years,

            "training_days":
                training_days,

            "rebalance_days":
                rebalance_days,

            "risk_free_rate":
                risk_free_rate,

            "transaction_cost_bps":
                transaction_cost_bps,

            "min_weight":
                min_weight,

            "max_weight":
                max_weight,
        },

        **result,

        "methodology": {

            "strategy":
                (
                    "Walk-forward long-only "
                    "maximum-Sharpe portfolio"
                ),

            "training":
                (
                    "Trailing historical returns "
                    "available before each rebalance"
                ),

            "rebalance":
                (
                    f"Every {rebalance_days} "
                    "trading days"
                ),

            "lookahead":
                "None",

            "transaction_costs":
                (
                    "Applied to portfolio turnover "
                    "at each rebalance"
                ),

            "equal_weight":
                (
                    "Daily equal-weight portfolio "
                    "over the same evaluation period"
                ),

            "sentiment":
                (
                    "Not included because the current "
                    "news pipeline does not provide "
                    "historical point-in-time sentiment"
                ),
        },
    }
