from functools import lru_cache

import numpy as np
import yfinance as yf


UNAVAILABLE = "Unavailable"


def _clean_label(
    value,
):
    if value is None:
        return UNAVAILABLE

    text = str(
        value
    ).strip()

    if not text:
        return UNAVAILABLE

    return text


def _normalise_weights(
    tickers,
    weights,
):
    if len(tickers) != len(weights):
        raise ValueError(
            "Tickers and weights must have the same length."
        )


    if not tickers:
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
        for ticker, weight
        in zip(
            tickers,
            values,
        )
    }


def _weighted_distribution(
    profiles,
    weights,
    field,
):
    distribution = {}


    for ticker, profile in profiles.items():

        label = _clean_label(
            profile.get(
                field
            )
        )


        distribution[label] = (
            distribution.get(
                label,
                0.0,
            )
            + weights[
                ticker
            ]
        )


    ranked = sorted(
        distribution.items(),
        key=lambda item:
            item[1],
        reverse=True,
    )


    return [
        {
            "name":
                name,

            "weight":
                round(
                    float(weight),
                    6,
                ),
        }
        for name, weight
        in ranked
    ]


def _concentration_label(
    value,
):
    number = float(
        value
    )


    if number >= 0.65:
        return "Very High"

    if number >= 0.50:
        return "High"

    if number >= 0.35:
        return "Moderate"

    return "Lower"


def _largest_available_bucket(
    distribution,
):
    available = [
        item
        for item
        in distribution
        if item[
            "name"
        ] != UNAVAILABLE
    ]


    if not available:
        return None


    return available[0]


def analyse_exposure_from_profiles(
    tickers,
    weights,
    profiles,
):
    """
    Pure calculation layer.

    Country represents company-profile country,
    not revenue geography or economic exposure.
    Currency represents trading/security currency.
    """

    weight_map = (
        _normalise_weights(
            tickers,
            weights,
        )
    )


    normalised_profiles = {}


    for ticker in tickers:

        source = (
            profiles.get(
                ticker,
                {}
            )
            or {}
        )


        normalised_profiles[
            ticker
        ] = {
            "ticker":
                ticker,

            "name":
                _clean_label(
                    source.get(
                        "name"
                    )
                ),

            "sector":
                _clean_label(
                    source.get(
                        "sector"
                    )
                ),

            "industry":
                _clean_label(
                    source.get(
                        "industry"
                    )
                ),

            "country":
                _clean_label(
                    source.get(
                        "country"
                    )
                ),

            "currency":
                _clean_label(
                    source.get(
                        "currency"
                    )
                ).upper(),

            "exchange":
                _clean_label(
                    source.get(
                        "exchange"
                    )
                ),

            "security_type":
                _clean_label(
                    source.get(
                        "security_type"
                    )
                ),
        }


    sector = (
        _weighted_distribution(
            normalised_profiles,
            weight_map,
            "sector",
        )
    )


    industry = (
        _weighted_distribution(
            normalised_profiles,
            weight_map,
            "industry",
        )
    )


    country = (
        _weighted_distribution(
            normalised_profiles,
            weight_map,
            "country",
        )
    )


    currency = (
        _weighted_distribution(
            normalised_profiles,
            weight_map,
            "currency",
        )
    )


    ranked_holdings = sorted(
        [
            {
                "ticker":
                    ticker,

                "name":
                    normalised_profiles[
                        ticker
                    ][
                        "name"
                    ],

                "weight":
                    round(
                        weight_map[
                            ticker
                        ],
                        6,
                    ),

                "sector":
                    normalised_profiles[
                        ticker
                    ][
                        "sector"
                    ],

                "industry":
                    normalised_profiles[
                        ticker
                    ][
                        "industry"
                    ],

                "country":
                    normalised_profiles[
                        ticker
                    ][
                        "country"
                    ],

                "currency":
                    normalised_profiles[
                        ticker
                    ][
                        "currency"
                    ],

                "security_type":
                    normalised_profiles[
                        ticker
                    ][
                        "security_type"
                    ],
            }
            for ticker
            in tickers
        ],
        key=lambda item:
            item[
                "weight"
            ],
        reverse=True,
    )


    largest_holding = (
        ranked_holdings[0]
        if ranked_holdings
        else None
    )


    top_two_weight = float(
        sum(
            item[
                "weight"
            ]
            for item
            in ranked_holdings[
                :2
            ]
        )
    )


    name_hhi = float(
        sum(
            weight ** 2
            for weight
            in weight_map.values()
        )
    )


    effective_holdings = float(
        1.0
        / name_hhi
    )


    largest_sector = (
        _largest_available_bucket(
            sector
        )
    )


    largest_country = (
        _largest_available_bucket(
            country
        )
    )


    largest_currency = (
        _largest_available_bucket(
            currency
        )
    )


    unavailable_weights = {
        "sector":
            round(
                next(
                    (
                        item["weight"]
                        for item
                        in sector
                        if item[
                            "name"
                        ] == UNAVAILABLE
                    ),
                    0.0,
                ),
                6,
            ),

        "industry":
            round(
                next(
                    (
                        item["weight"]
                        for item
                        in industry
                        if item[
                            "name"
                        ] == UNAVAILABLE
                    ),
                    0.0,
                ),
                6,
            ),

        "country":
            round(
                next(
                    (
                        item["weight"]
                        for item
                        in country
                        if item[
                            "name"
                        ] == UNAVAILABLE
                    ),
                    0.0,
                ),
                6,
            ),

        "currency":
            round(
                next(
                    (
                        item["weight"]
                        for item
                        in currency
                        if item[
                            "name"
                        ] == UNAVAILABLE
                    ),
                    0.0,
                ),
                6,
            ),
    }


    return {
        "holdings":
            ranked_holdings,

        "sector_exposure":
            sector,

        "industry_exposure":
            industry,

        "company_country_exposure":
            country,

        "trading_currency_exposure":
            currency,

        "concentration":
            {
                "largest_holding":
                    largest_holding,

                "top_two_weight":
                    round(
                        top_two_weight,
                        6,
                    ),

                "effective_holdings":
                    round(
                        effective_holdings,
                        2,
                    ),

                "name_hhi":
                    round(
                        name_hhi,
                        6,
                    ),

                "largest_sector":
                    largest_sector,

                "largest_country":
                    largest_country,

                "largest_currency":
                    largest_currency,

                "single_name_level":
                    (
                        _concentration_label(
                            largest_holding[
                                "weight"
                            ]
                        )
                        if largest_holding
                        else "Unavailable"
                    ),

                "sector_level":
                    (
                        _concentration_label(
                            largest_sector[
                                "weight"
                            ]
                        )
                        if largest_sector
                        else "Unavailable"
                    ),
            },

        "unavailable_weight":
            unavailable_weights,

        "methodology":
            {
                "country_definition":
                    (
                        "Country is the company-profile country supplied "
                        "by the market-data provider. It is not revenue "
                        "geography or full economic exposure."
                    ),

                "currency_definition":
                    (
                        "Currency is the security's trading/reporting "
                        "currency supplied by the market-data provider. "
                        "It does not represent all underlying business "
                        "currency exposure."
                    ),

                "description":
                    (
                        "Portfolio exposures are current-weighted "
                        "aggregations of security metadata. Missing "
                        "classifications remain explicitly unavailable "
                        "rather than being inferred."
                    ),
            },
    }


@lru_cache(
    maxsize=512
)
def get_security_profile(
    ticker,
):
    clean_ticker = (
        str(
            ticker
        )
        .strip()
        .upper()
    )


    if not clean_ticker:
        raise ValueError(
            "Ticker cannot be empty."
        )


    instrument = yf.Ticker(
        clean_ticker
    )


    info = {}

    try:

        info = (
            instrument.get_info()
            or {}
        )

    except Exception:

        try:

            info = (
                instrument.info
                or {}
            )

        except Exception:

            info = {}


    profile = {
        "ticker":
            clean_ticker,

        "name":
            (
                info.get(
                    "longName"
                )
                or info.get(
                    "shortName"
                )
                or clean_ticker
            ),

        "sector":
            info.get(
                "sector"
            ),

        "industry":
            info.get(
                "industry"
            ),

        "country":
            info.get(
                "country"
            ),

        "currency":
            info.get(
                "currency"
            ),

        "exchange":
            (
                info.get(
                    "fullExchangeName"
                )
                or info.get(
                    "exchange"
                )
            ),

        "security_type":
            (
                info.get(
                    "quoteType"
                )
                or info.get(
                    "typeDisp"
                )
            ),
    }


    return profile


def analyse_exposure(
    tickers,
    weights,
):
    weight_map = (
        _normalise_weights(
            tickers,
            weights,
        )
    )


    profiles = {}

    errors = {}


    for ticker in tickers:

        try:

            profiles[
                ticker
            ] = (
                get_security_profile(
                    ticker
                )
            )

        except Exception as exc:

            profiles[
                ticker
            ] = {
                "ticker":
                    ticker,

                "name":
                    ticker,

                "sector":
                    None,

                "industry":
                    None,

                "country":
                    None,

                "currency":
                    None,

                "exchange":
                    None,

                "security_type":
                    None,
            }

            errors[
                ticker
            ] = str(
                exc
            )


    result = (
        analyse_exposure_from_profiles(
            tickers=tickers,
            weights=[
                weight_map[
                    ticker
                ]
                for ticker
                in tickers
            ],
            profiles=profiles,
        )
    )


    result[
        "metadata_errors"
    ] = errors


    result[
        "metadata_source"
    ] = "Yahoo Finance"


    return result
