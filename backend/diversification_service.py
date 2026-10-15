import math

import numpy as np
import pandas as pd

from backend.market_data import (
    calculate_daily_returns,
    get_historical_prices,
)

from backend.base_currency_market_service import (
    convert_price_frame_to_base,
)

from backend.instrument_currency_service import (
    resolve_currency_map,
)


def _normalise_weights(
    tickers,
    weights,
):
    if len(tickers) != len(weights):
        raise ValueError(
            "Tickers and weights must have the same length."
        )

    values = np.asarray(
        weights,
        dtype=float,
    )

    if not np.all(
        np.isfinite(
            values
        )
    ):
        raise ValueError(
            "Weights must be finite numbers."
        )

    if np.any(
        values < 0
    ):
        raise ValueError(
            "Weights cannot be negative."
        )

    total = float(
        values.sum()
    )

    if total <= 0:
        raise ValueError(
            "Weights must sum to a positive value."
        )

    values = (
        values
        / total
    )

    return {
        ticker:
            float(weight)
        for (
            ticker,
            weight,
        )
        in zip(
            tickers,
            values,
        )
    }


def _annualised_volatility(
    returns,
):
    return (
        returns.std(
            ddof=1
        )
        * math.sqrt(
            252
        )
    )


def _weighted_pairwise_correlation(
    correlation,
    weights,
):
    tickers = list(
        correlation.columns
    )

    numerator = 0.0
    denominator = 0.0

    for i in range(
        len(tickers)
    ):

        for j in range(
            i + 1,
            len(tickers)
        ):

            left = (
                tickers[i]
            )

            right = (
                tickers[j]
            )

            pair_weight = (
                weights[left]
                * weights[right]
            )

            corr = float(
                correlation.loc[
                    left,
                    right,
                ]
            )

            numerator += (
                pair_weight
                * corr
            )

            denominator += (
                pair_weight
            )


    if denominator <= 0:
        return 0.0


    return float(
        numerator
        / denominator
    )


def _correlation_pairs(
    correlation,
):
    tickers = list(
        correlation.columns
    )

    pairs = []

    for i in range(
        len(tickers)
    ):

        for j in range(
            i + 1,
            len(tickers)
        ):

            pairs.append(
                {
                    "ticker_1":
                        tickers[i],

                    "ticker_2":
                        tickers[j],

                    "correlation":
                        float(
                            correlation.iloc[
                                i,
                                j,
                            ]
                        ),
                }
            )


    pairs.sort(
        key=lambda item:
            item[
                "correlation"
            ],
        reverse=True,
    )

    return pairs


def analyse_diversification_from_returns(
    daily_returns,
    tickers,
    weights,
):
    """
    Pure calculation layer.

    Diversification score is a transparent
    diagnostic combining position concentration
    and historical cross-asset correlation.

    It is not a forecast or recommendation.
    """

    if not isinstance(
        daily_returns,
        pd.DataFrame,
    ):
        raise TypeError(
            "daily_returns must be a pandas DataFrame."
        )


    available = [
        ticker
        for ticker
        in tickers
        if ticker
        in daily_returns.columns
    ]


    if len(
        available
    ) < 2:
        raise ValueError(
            "At least two assets with return history are required."
        )


    original_weights = (
        _normalise_weights(
            tickers,
            weights,
        )
    )


    available_weights = {
        ticker:
            original_weights[
                ticker
            ]
        for ticker
        in available
    }


    available_weights = (
        _normalise_weights(
            available,
            [
                available_weights[
                    ticker
                ]
                for ticker
                in available
            ],
        )
    )


    clean_returns = (
        daily_returns[
            available
        ]
        .dropna()
    )


    if len(
        clean_returns
    ) < 30:
        raise ValueError(
            "Insufficient overlapping return history."
        )


    correlation = (
        clean_returns
        .corr()
    )


    annualised_volatility = (
        _annualised_volatility(
            clean_returns
        )
    )


    weight_array = np.array(
        [
            available_weights[
                ticker
            ]
            for ticker
            in available
        ],
        dtype=float,
    )


    hhi = float(
        np.square(
            weight_array
        ).sum()
    )


    effective_holdings = float(
        1.0
        / hhi
    )


    concentration_score = float(
        min(
            100.0,
            (
                effective_holdings
                / len(
                    available
                )
            )
            * 100.0,
        )
    )


    average_correlation = (
        _weighted_pairwise_correlation(
            correlation,
            available_weights,
        )
    )


    correlation_score = float(
        (
            1.0
            - np.clip(
                average_correlation,
                0.0,
                1.0,
            )
        )
        * 100.0
    )


    diversification_score = float(
        (
            0.45
            * concentration_score
        )
        + (
            0.55
            * correlation_score
        )
    )


    pairs = (
        _correlation_pairs(
            correlation
        )
    )


    highest_pair = (
        pairs[0]
        if pairs
        else None
    )


    lowest_pair = (
        pairs[-1]
        if pairs
        else None
    )


    matrix = {
        row:
            {
                column:
                    round(
                        float(
                            correlation.loc[
                                row,
                                column,
                            ]
                        ),
                        4,
                    )
                for column
                in available
            }
        for row
        in available
    }


    asset_metrics = []

    for ticker in available:

        asset_metrics.append(
            {
                "ticker":
                    ticker,

                "weight":
                    round(
                        available_weights[
                            ticker
                        ],
                        6,
                    ),

                "annualised_volatility":
                    round(
                        float(
                            annualised_volatility[
                                ticker
                            ]
                        ),
                        6,
                    ),
            }
        )


    return {
        "tickers":
            available,

        "weights":
            {
                ticker:
                    round(
                        available_weights[
                            ticker
                        ],
                        6,
                    )
                for ticker
                in available
            },

        "observations":
            int(
                len(
                    clean_returns
                )
            ),

        "correlation_matrix":
            matrix,

        "weighted_average_correlation":
            round(
                average_correlation,
                4,
            ),

        "effective_holdings":
            round(
                effective_holdings,
                2,
            ),

        "concentration_hhi":
            round(
                hhi,
                4,
            ),

        "concentration_score":
            round(
                concentration_score,
                1,
            ),

        "correlation_score":
            round(
                correlation_score,
                1,
            ),

        "diversification_score":
            round(
                diversification_score,
                1,
            ),

        "highest_correlation_pair":
            highest_pair,

        "lowest_correlation_pair":
            lowest_pair,

        "asset_metrics":
            asset_metrics,

        "methodology":
            {
                "score_weights":
                    {
                        "concentration":
                            0.45,

                        "correlation":
                            0.55,
                    },

                "description":
                    (
                        "Diversification Score is a diagnostic "
                        "combining portfolio concentration and "
                        "historical pairwise correlation. It is "
                        "not a forecast, performance score or "
                        "investment recommendation."
                    ),
            },
    }


def analyse_diversification(
    tickers,
    weights,
    years=3,
    base_currency="USD",
):
    """
    Live common-currency diversification diagnostic.

    Historical adjusted prices are translated into
    one investor base currency before correlations,
    volatility and diversification statistics are
    calculated.
    """

    valid_tickers = [
        str(ticker)
        .strip()
        .upper()

        for ticker in tickers

        if str(ticker)
        .strip()
    ]


    if len(valid_tickers) < 2:

        raise ValueError(
            "At least two valid tickers are required."
        )


    base = (
        str(
            base_currency
            or "USD"
        )
        .strip()
        .upper()
    )


    if not base:

        raise ValueError(
            "Base currency cannot be empty."
        )


    (
        prices,
        requested,
        available_market,
    ) = (
        get_historical_prices(
            tickers=tickers,
            years=years,
        )
    )


    currency_map = (
        resolve_currency_map(
            available_market
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


    available = [
        ticker
        for ticker
        in requested
        if ticker
        in converted_prices.columns
    ]


    missing = [
        ticker
        for ticker
        in requested
        if ticker
        not in available
    ]


    if len(available) < 2:

        raise ValueError(
            "At least two holdings require usable "
            "base-currency historical data for "
            "diversification analysis."
        )


    returns = (
        calculate_daily_returns(
            converted_prices[
                available
            ]
        )
    )


    result = (
        analyse_diversification_from_returns(
            daily_returns=returns,
            tickers=tickers,
            weights=weights,
        )
    )


    result[
        "requested_tickers"
    ] = requested


    result[
        "available_tickers"
    ] = available


    result[
        "missing_tickers"
    ] = missing


    result[
        "lookback_years"
    ] = years


    result[
        "base_currency"
    ] = conversion[
        "base_currency"
    ]


    result[
        "currency_conversion"
    ] = conversion


    result[
        "market_data"
    ] = {
        "observations":
            int(
                len(
                    returns
                )
            ),

        "start_date":
            (
                returns
                .index[0]
                .strftime(
                    "%Y-%m-%d"
                )
            ),

        "end_date":
            (
                returns
                .index[-1]
                .strftime(
                    "%Y-%m-%d"
                )
            ),
    }


    methodology = (
        result.get(
            "methodology"
        )
    )


    if not isinstance(
        methodology,
        dict,
    ):

        methodology = {}


    methodology[
        "base_currency"
    ] = conversion[
        "base_currency"
    ]


    methodology[
        "currency_treatment"
    ] = (
        "Historical adjusted prices are converted "
        "into the investor base currency before "
        "daily returns, volatility, correlations "
        "and the diversification score are calculated."
    )


    methodology[
        "fx_alignment"
    ] = (
        "Historical FX observations are aligned "
        "without using future exchange rates."
    )


    result[
        "methodology"
    ] = methodology


    return result

