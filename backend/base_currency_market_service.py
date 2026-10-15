from datetime import timedelta

import pandas as pd

from backend.fx_service import (
    convert_price_series,
    get_historical_fx_rates,
    normalise_currency,
)

from backend.instrument_currency_service import (
    resolve_currency_map,
)

from backend.market_data import (
    calculate_daily_returns,
    get_historical_prices,
)


# ==========================================================
# HELPERS
# ==========================================================

def _clean_tickers(
    tickers,
):
    cleaned = []


    for ticker in tickers:

        value = str(
            ticker
            or ""
        ).strip().upper()


        if (
            value
            and value not in cleaned
        ):

            cleaned.append(
                value
            )


    return cleaned


def _normalise_base_currency(
    currency,
):

    base, _ = (
        normalise_currency(
            currency
        )
    )


    return base


# ==========================================================
# PURE PRICE-FRAME CONVERSION
# ==========================================================

def convert_price_frame_to_base(
    prices,
    currency_map,
    base_currency,
    fx_loader=None,
):
    """
    Convert each price series into one portfolio
    base currency.

    An individual conversion failure does not
    corrupt securities whose conversion succeeds.

    Returns:
        converted price DataFrame,
        conversion metadata
    """

    if not isinstance(
        prices,
        pd.DataFrame,
    ):

        raise TypeError(
            "prices must be a pandas DataFrame."
        )


    if prices.empty:

        raise ValueError(
            "Price history cannot be empty."
        )


    if not isinstance(
        currency_map,
        dict,
    ):

        raise TypeError(
            "currency_map must be a dictionary."
        )


    base = (
        _normalise_base_currency(
            base_currency
        )
    )


    if fx_loader is None:

        fx_loader = (
            get_historical_fx_rates
        )


    converted = {}

    instruments = {}

    failed_tickers = {}


    price_start = (
        pd.Timestamp(
            prices.index.min()
        )
    )


    price_end = (
        pd.Timestamp(
            prices.index.max()
        )
    )


    # Ask for an FX buffer before the first
    # security date so weekends/holidays can
    # safely forward-fill without look-ahead.
    fx_start = (
        price_start
        - timedelta(
            days=14
        )
    )


    fx_end = (
        price_end
        + timedelta(
            days=2
        )
    )


    for ticker in prices.columns:

        ticker = str(
            ticker
        ).strip().upper()


        metadata = (
            currency_map.get(
                ticker
            )
        )


        if not isinstance(
            metadata,
            dict,
        ):

            failed_tickers[
                ticker
            ] = (
                "Trading-currency metadata "
                "was unavailable."
            )

            continue


        if (
            metadata.get(
                "status"
            )
            != "available"
        ):

            failed_tickers[
                ticker
            ] = (
                metadata.get(
                    "error"
                )
                or
                "Trading currency was unavailable."
            )

            continue


        raw_currency = (
            metadata.get(
                "raw_currency"
            )
            or metadata.get(
                "currency"
            )
        )


        try:

            source_currency, _ = (
                normalise_currency(
                    raw_currency
                )
            )


            if (
                source_currency
                == base
            ):

                fx_rates = None

                fx_symbol = None

            else:

                fx_rates = (
                    fx_loader(
                        source_currency,
                        base,
                        fx_start,
                        fx_end,
                    )
                )


                fx_symbol = (
                    f"{source_currency}"
                    f"{base}=X"
                )


            converted_series = (
                convert_price_series(
                    prices=prices[
                        ticker
                    ],
                    source_currency=(
                        raw_currency
                    ),
                    base_currency=base,
                    fx_rates=fx_rates,
                )
            )


            converted[
                ticker
            ] = (
                converted_series
            )


            instruments[
                ticker
            ] = {
                "status":
                    "converted",

                "raw_currency":
                    raw_currency,

                "source_currency":
                    source_currency,

                "base_currency":
                    base,

                "price_scale":
                    metadata.get(
                        "price_scale"
                    ),

                "fx_conversion_required":
                    (
                        source_currency
                        != base
                    ),

                "fx_symbol":
                    fx_symbol,

                "metadata_source":
                    metadata.get(
                        "source"
                    ),
            }


        except Exception as exc:

            failed_tickers[
                ticker
            ] = str(
                exc
            )


    if not converted:

        raise ValueError(
            "No instrument price histories could "
            "be converted into the base currency."
        )


    converted_prices = (
        pd.DataFrame(
            converted
        )
        .sort_index()
        .dropna(
            how="all"
        )
    )


    return (
        converted_prices,
        {
            "base_currency":
                base,

            "converted_tickers":
                list(
                    converted.keys()
                ),

            "failed_tickers":
                failed_tickers,

            "instruments":
                instruments,
        },
    )


# ==========================================================
# PERFORMANCE MARKET PREPARATION
# ==========================================================

def prepare_performance_market_data(
    tickers,
    benchmark="ACWI",
    years=3,
    base_currency="USD",
):
    """
    Build holding and benchmark return histories
    in ONE common investor base currency.

    Workflow:
        adjusted prices
            -> trading currency metadata
            -> historical FX conversion
            -> daily returns
    """

    holdings = (
        _clean_tickers(
            tickers
        )
    )


    if not holdings:

        raise ValueError(
            "At least one valid holding is required."
        )


    benchmark = str(
        benchmark
        or ""
    ).strip().upper()


    if not benchmark:

        raise ValueError(
            "Benchmark cannot be empty."
        )


    base = (
        _normalise_base_currency(
            base_currency
        )
    )


    requested_market_tickers = (
        holdings.copy()
    )


    if (
        benchmark
        not in requested_market_tickers
    ):

        requested_market_tickers.append(
            benchmark
        )


    (
        prices,
        requested_tickers,
        available_market_tickers,
    ) = (
        get_historical_prices(
            tickers=
                requested_market_tickers,

            years=
                years,
        )
    )


    currency_map = (
        resolve_currency_map(
            available_market_tickers
        )
    )


    (
        converted_prices,
        conversion,
    ) = (
        convert_price_frame_to_base(
            prices=prices,
            currency_map=currency_map,
            base_currency=base,
        )
    )


    if (
        benchmark
        not in converted_prices.columns
    ):

        benchmark_error = (
            conversion[
                "failed_tickers"
            ].get(
                benchmark,
                (
                    "Benchmark could not be "
                    "converted to base currency."
                ),
            )
        )


        raise ValueError(
            f"Benchmark {benchmark}: "
            f"{benchmark_error}"
        )


    available_holdings = [
        ticker
        for ticker
        in holdings
        if ticker
        in converted_prices.columns
    ]


    if not available_holdings:

        raise ValueError(
            "No holdings have usable "
            "base-currency price history."
        )


    return_columns = (
        available_holdings
        + [
            benchmark
        ]
    )


    aligned_prices = (
        converted_prices[
            return_columns
        ]
        .dropna()
    )


    if len(
        aligned_prices
    ) < 30:

        raise ValueError(
            "Insufficient overlapping base-currency "
            "history was available."
        )


    returns = (
        calculate_daily_returns(
            aligned_prices
        )
    )


    asset_returns = (
        returns[
            available_holdings
        ]
    )


    benchmark_returns = (
        returns[
            benchmark
        ]
        .rename(
            benchmark
        )
    )


    missing_holdings = [
        ticker
        for ticker
        in holdings
        if ticker
        not in available_holdings
    ]


    return {
        "asset_returns":
            asset_returns,

        "benchmark_returns":
            benchmark_returns,

        "requested_tickers":
            holdings,

        "available_tickers":
            available_holdings,

        "missing_tickers":
            missing_holdings,

        "benchmark":
            benchmark,

        "benchmark_available":
            True,

        "base_currency":
            base,

        "conversion":
            conversion,

        "observations":
            int(
                len(
                    returns
                )
            ),

        "start_date":
            aligned_prices.index[
                0
            ].strftime(
                "%Y-%m-%d"
            ),

        "end_date":
            aligned_prices.index[
                -1
            ].strftime(
                "%Y-%m-%d"
            ),

        "requested_market_tickers":
            requested_tickers,

        "available_market_tickers":
            available_market_tickers,
    }
