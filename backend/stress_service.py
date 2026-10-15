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
    if (
        len(tickers)
        != len(weights)
    ):
        raise ValueError(
            "Tickers and weights must have the same length."
        )


    if (
        len(tickers)
        < 1
    ):
        raise ValueError(
            "At least one holding is required."
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


    if (
        total <= 0
    ):
        raise ValueError(
            "Weights must sum to a positive value."
        )


    normalised = (
        values
        / total
    )


    return {
        ticker:
            float(weight)
        for ticker, weight
        in zip(
            tickers,
            normalised,
        )
    }


def _portfolio_returns(
    daily_returns,
    weights,
):
    columns = [
        ticker
        for ticker
        in weights
        if ticker
        in daily_returns.columns
    ]


    if (
        len(columns)
        == 0
    ):
        raise ValueError(
            "No holdings have usable historical return data."
        )


    clean = (
        daily_returns[
            columns
        ]
        .dropna()
    )


    if (
        len(clean)
        < 30
    ):
        raise ValueError(
            "Insufficient overlapping return history."
        )


    available_weights = np.array(
        [
            weights[
                ticker
            ]
            for ticker
            in columns
        ],
        dtype=float,
    )


    available_weights = (
        available_weights
        / available_weights.sum()
    )


    portfolio_returns = (
        clean.to_numpy()
        @ available_weights
    )


    series = pd.Series(
        portfolio_returns,
        index=clean.index,
        name="portfolio",
    )


    return (
        clean,
        columns,
        available_weights,
        series,
    )


def _period_return(
    returns,
):
    return float(
        np.prod(
            1.0
            + np.asarray(
                returns,
                dtype=float,
            )
        )
        - 1.0
    )


def _rolling_compounded_returns(
    portfolio_returns,
    window,
):
    if (
        len(portfolio_returns)
        < window
    ):
        return pd.Series(
            dtype=float
        )


    values = (
        1.0
        + portfolio_returns
    )


    rolling = (
        values
        .rolling(
            window
        )
        .apply(
            np.prod,
            raw=True,
        )
        - 1.0
    )


    return (
        rolling
        .dropna()
    )


def _historical_window_stress(
    portfolio_returns,
    window,
    label,
):
    rolling = (
        _rolling_compounded_returns(
            portfolio_returns,
            window,
        )
    )


    if rolling.empty:
        return None


    end_date = (
        rolling.idxmin()
    )


    loss = float(
        rolling.loc[
            end_date
        ]
    )


    end_position = (
        portfolio_returns
        .index
        .get_loc(
            end_date
        )
    )


    start_position = (
        end_position
        - window
        + 1
    )


    start_date = (
        portfolio_returns
        .index[
            start_position
        ]
    )


    return {
        "label":
            label,

        "window_days":
            int(window),

        "portfolio_return":
            round(
                loss,
                6,
            ),

        "start_date":
            str(
                pd.Timestamp(
                    start_date
                ).date()
            ),

        "end_date":
            str(
                pd.Timestamp(
                    end_date
                ).date()
            ),
    }


def analyse_historical_stress_from_returns(
    daily_returns,
    tickers,
    weights,
):
    if not isinstance(
        daily_returns,
        pd.DataFrame,
    ):
        raise TypeError(
            "daily_returns must be a pandas DataFrame."
        )


    weight_map = (
        _normalise_weights(
            tickers,
            weights,
        )
    )


    (
        clean_returns,
        available,
        available_weights,
        portfolio_returns,
    ) = _portfolio_returns(
        daily_returns,
        weight_map,
    )


    worst_day_index = (
        portfolio_returns
        .idxmin()
    )


    worst_day_return = float(
        portfolio_returns.loc[
            worst_day_index
        ]
    )


    worst_day = {
        "label":
            "Worst historical day",

        "window_days":
            1,

        "portfolio_return":
            round(
                worst_day_return,
                6,
            ),

        "start_date":
            str(
                pd.Timestamp(
                    worst_day_index
                ).date()
            ),

        "end_date":
            str(
                pd.Timestamp(
                    worst_day_index
                ).date()
            ),
    }


    scenarios = [
        worst_day,

        _historical_window_stress(
            portfolio_returns,
            5,
            "Worst historical week",
        ),

        _historical_window_stress(
            portfolio_returns,
            21,
            "Worst historical month",
        ),
    ]


    scenarios = [
        scenario
        for scenario
        in scenarios
        if scenario
        is not None
    ]


    worst_day_position = (
        clean_returns
        .index
        .get_loc(
            worst_day_index
        )
    )


    holding_moves = []


    for (
        ticker,
        weight,
    ) in zip(
        available,
        available_weights,
    ):

        holding_return = float(
            clean_returns.iloc[
                worst_day_position
            ][
                ticker
            ]
        )


        holding_moves.append(
            {
                "ticker":
                    ticker,

                "weight":
                    round(
                        float(
                            weight
                        ),
                        6,
                    ),

                "return":
                    round(
                        holding_return,
                        6,
                    ),

                "weighted_impact":
                    round(
                        float(
                            weight
                        )
                        * holding_return,
                        6,
                    ),
            }
        )


    holding_moves.sort(
        key=lambda item:
            item[
                "weighted_impact"
            ]
    )


    annualised_volatility = float(
        portfolio_returns.std(
            ddof=1
        )
        * math.sqrt(
            252
        )
    )


    return {
        "tickers":
            available,

        "weights":
            {
                ticker:
                    round(
                        float(weight),
                        6,
                    )
                for ticker, weight
                in zip(
                    available,
                    available_weights,
                )
            },

        "observations":
            int(
                len(
                    portfolio_returns
                )
            ),

        "annualised_volatility":
            round(
                annualised_volatility,
                6,
            ),

        "historical_scenarios":
            scenarios,

        "worst_day_holding_moves":
            holding_moves,

        "methodology":
            {
                "type":
                    "historical_replay",

                "description":
                    (
                        "Historical stress tests replay the worst "
                        "observed portfolio day, 5-trading-day period "
                        "and 21-trading-day period in the selected "
                        "lookback window using today's portfolio weights. "
                        "They are not forecasts of future losses."
                    ),
            },
    }


def apply_custom_shock(
    tickers,
    weights,
    shocks,
):
    weight_map = (
        _normalise_weights(
            tickers,
            weights,
        )
    )


    if not isinstance(
        shocks,
        dict,
    ):
        raise TypeError(
            "shocks must be a dictionary keyed by ticker."
        )


    holding_impacts = []

    portfolio_impact = 0.0


    for ticker in tickers:

        shock = float(
            shocks.get(
                ticker,
                0.0,
            )
        )


        if not np.isfinite(
            shock
        ):
            raise ValueError(
                f"Shock for {ticker} must be finite."
            )


        if (
            shock < -1.0
        ):
            raise ValueError(
                f"Shock for {ticker} cannot be below -100%."
            )


        weight = (
            weight_map[
                ticker
            ]
        )


        weighted_impact = (
            weight
            * shock
        )


        portfolio_impact += (
            weighted_impact
        )


        holding_impacts.append(
            {
                "ticker":
                    ticker,

                "weight":
                    round(
                        weight,
                        6,
                    ),

                "shock":
                    round(
                        shock,
                        6,
                    ),

                "weighted_impact":
                    round(
                        weighted_impact,
                        6,
                    ),
            }
        )


    holding_impacts.sort(
        key=lambda item:
            item[
                "weighted_impact"
            ]
    )


    return {
        "portfolio_impact":
            round(
                float(
                    portfolio_impact
                ),
                6,
            ),

        "holding_impacts":
            holding_impacts,

        "methodology":
            {
                "type":
                    "deterministic_custom_shock",

                "description":
                    (
                        "Custom scenario impact is the weighted sum "
                        "of user-defined holding shocks. No forecast "
                        "or statistical prediction is applied."
                    ),
            },
    }


def predefined_scenarios(
    tickers,
    weights,
):
    weight_map = (
        _normalise_weights(
            tickers,
            weights,
        )
    )


    largest_ticker = max(
        weight_map,
        key=weight_map.get,
    )


    scenarios = []


    broad_shock = {
        ticker:
            -0.10
        for ticker
        in tickers
    }


    scenarios.append(
        {
            "id":
                "broad_equity_minus_10",

            "name":
                "Broad equity shock",

            "description":
                "Every holding falls 10%.",

            "result":
                apply_custom_shock(
                    tickers,
                    weights,
                    broad_shock,
                ),
        }
    )


    largest_shock = {
        ticker:
            (
                -0.20
                if ticker
                == largest_ticker
                else 0.0
            )
        for ticker
        in tickers
    }


    scenarios.append(
        {
            "id":
                "largest_holding_minus_20",

            "name":
                "Largest holding shock",

            "description":
                (
                    f"{largest_ticker}, the portfolio's "
                    "largest position, falls 20% while "
                    "other holdings are unchanged."
                ),

            "result":
                apply_custom_shock(
                    tickers,
                    weights,
                    largest_shock,
                ),
        }
    )


    return scenarios


def analyse_stress(
    tickers,
    weights,
    years=3,
    base_currency="USD",
):
    """
    Historical portfolio stress analysis in the
    investor's selected base currency.

    Custom and predefined percentage shocks remain
    deterministic and currency-neutral.
    """

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


    if not available:

        raise ValueError(
            "No holdings have usable base-currency "
            "historical data for stress analysis."
        )


    returns = (
        calculate_daily_returns(
            converted_prices[
                available
            ]
        )
    )


    historical = (
        analyse_historical_stress_from_returns(
            daily_returns=returns,
            tickers=tickers,
            weights=weights,
        )
    )


    historical[
        "predefined_scenarios"
    ] = predefined_scenarios(
        historical[
            "tickers"
        ],
        [
            historical[
                "weights"
            ][
                ticker
            ]
            for ticker
            in historical[
                "tickers"
            ]
        ],
    )


    historical[
        "requested_tickers"
    ] = requested


    historical[
        "available_tickers"
    ] = available


    historical[
        "missing_tickers"
    ] = missing


    historical[
        "lookback_years"
    ] = years


    historical[
        "base_currency"
    ] = conversion[
        "base_currency"
    ]


    historical[
        "currency_conversion"
    ] = conversion


    historical[
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
        historical.get(
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
        "Historical adjusted prices are translated "
        "into the investor base currency before "
        "historical portfolio returns and stress "
        "periods are calculated."
    )


    methodology[
        "fx_alignment"
    ] = (
        "Historical FX observations are aligned "
        "without using future exchange rates."
    )


    methodology[
        "scenario_treatment"
    ] = (
        "Custom and predefined percentage shocks "
        "are deterministic percentage scenarios "
        "and are not FX-translated."
    )


    historical[
        "methodology"
    ] = methodology


    return historical

