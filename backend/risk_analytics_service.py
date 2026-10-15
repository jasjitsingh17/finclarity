from backend.base_currency_market_service import (
    prepare_performance_market_data,
)

from backend.risk_analytics_engine import (
    build_risk_analytics,
)


def analyse_risk(
    tickers,
    weights,
    benchmark="SPY",
    years=3,
    risk_free_rate=0.04,
    base_currency="USD",
):
    cleaned_tickers = [
        str(ticker)
        .strip()
        .upper()

        for ticker in tickers
    ]


    if (
        len(cleaned_tickers)
        != len(weights)
    ):
        raise ValueError(
            "Each ticker must have "
            "a corresponding weight."
        )


    if len(cleaned_tickers) < 2:
        raise ValueError(
            "At least two tickers "
            "are required."
        )


    benchmark = (
        str(benchmark)
        .strip()
        .upper()
    )


    if not benchmark:
        raise ValueError(
            "Benchmark cannot be empty."
        )


    base_currency = (
        str(base_currency)
        .strip()
        .upper()
    )


    if not base_currency:
        raise ValueError(
            "Base currency cannot be empty."
        )


    prepared = (
        prepare_performance_market_data(
            tickers=cleaned_tickers,
            benchmark=benchmark,
            years=years,
            base_currency=base_currency,
        )
    )


    missing = (
        prepared[
            "missing_tickers"
        ]
    )


    if missing:
        raise ValueError(
            "Market data unavailable for: "
            + ", ".join(
                missing
            )
        )


    asset_returns = (
        prepared[
            "asset_returns"
        ][
            cleaned_tickers
        ]
    )


    benchmark_returns = (
        prepared[
            "benchmark_returns"
        ]
    )


    analytics = (
        build_risk_analytics(
            asset_returns=(
                asset_returns
            ),

            benchmark_returns=(
                benchmark_returns
            ),

            weights=weights,

            tickers=cleaned_tickers,

            risk_free_rate=(
                risk_free_rate
            ),
        )
    )


    return {
        "tickers":
            cleaned_tickers,

        "weights":
            weights,

        "benchmark":
            benchmark,

        "years":
            years,

        "risk_free_rate":
            risk_free_rate,

        "base_currency":
            prepared[
                "base_currency"
            ],

        "available_tickers":
            prepared[
                "available_tickers"
            ],

        "missing_tickers":
            prepared[
                "missing_tickers"
            ],

        "currency_conversion":
            prepared[
                "conversion"
            ],

        "market_data": {
            "observations":
                prepared[
                    "observations"
                ],

            "start_date":
                prepared[
                    "start_date"
                ],

            "end_date":
                prepared[
                    "end_date"
                ],
        },

        **analytics,

        "methodology": {
            "var":
                (
                    "Historical daily "
                    "Value-at-Risk"
                ),

            "cvar":
                (
                    "Historical Expected "
                    "Shortfall"
                ),

            "beta":
                (
                    f"Portfolio beta relative "
                    f"to {benchmark}"
                ),

            "concentration":
                (
                    "Herfindahl-Hirschman "
                    "Index of portfolio weights"
                ),

            "risk_contribution":
                (
                    "Component contribution "
                    "to annualised portfolio variance"
                ),

            "currency_treatment":
                (
                    "Historical security and benchmark "
                    f"prices are converted into "
                    f"{prepared['base_currency']} before "
                    "daily returns and risk statistics "
                    "are calculated."
                ),

            "fx_alignment":
                (
                    "Historical FX observations are "
                    "aligned without using future rates."
                ),
        },
    }

