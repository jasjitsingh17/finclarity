import numpy as np

from backend.exposure_service import (
    analyse_exposure_from_profiles,
)


def profiles():

    return {
        "AAA": {
            "name":
                "Alpha Software",

            "sector":
                "Technology",

            "industry":
                "Software",

            "country":
                "United States",

            "currency":
                "USD",

            "security_type":
                "EQUITY",
        },

        "BBB": {
            "name":
                "Beta Bank",

            "sector":
                "Financial Services",

            "industry":
                "Banks",

            "country":
                "United Kingdom",

            "currency":
                "GBP",

            "security_type":
                "EQUITY",
        },

        "CCC": {
            "name":
                "Gamma Chips",

            "sector":
                "Technology",

            "industry":
                "Semiconductors",

            "country":
                "Taiwan",

            "currency":
                "TWD",

            "security_type":
                "EQUITY",
        },
    }


def test_sector_exposure_sums_to_one():

    result = (
        analyse_exposure_from_profiles(
            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.5,
                0.3,
                0.2,
            ],

            profiles=
                profiles(),
        )
    )


    total = sum(
        item[
            "weight"
        ]
        for item
        in result[
            "sector_exposure"
        ]
    )


    assert np.isclose(
        total,
        1.0,
    )


def test_technology_exposure_is_correct():

    result = (
        analyse_exposure_from_profiles(
            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.5,
                0.3,
                0.2,
            ],

            profiles=
                profiles(),
        )
    )


    technology = next(
        item
        for item
        in result[
            "sector_exposure"
        ]
        if item[
            "name"
        ]
        == "Technology"
    )


    assert np.isclose(
        technology[
            "weight"
        ],
        0.7,
    )


def test_top_two_concentration():

    result = (
        analyse_exposure_from_profiles(
            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.5,
                0.3,
                0.2,
            ],

            profiles=
                profiles(),
        )
    )


    assert np.isclose(
        result[
            "concentration"
        ][
            "top_two_weight"
        ],
        0.8,
    )


def test_largest_holding_detected():

    result = (
        analyse_exposure_from_profiles(
            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.5,
                0.3,
                0.2,
            ],

            profiles=
                profiles(),
        )
    )


    assert (
        result[
            "concentration"
        ][
            "largest_holding"
        ][
            "ticker"
        ]
        == "AAA"
    )


def test_missing_metadata_remains_unavailable():

    modified = (
        profiles()
    )


    modified[
        "BBB"
    ][
        "sector"
    ] = None


    result = (
        analyse_exposure_from_profiles(
            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.5,
                0.3,
                0.2,
            ],

            profiles=
                modified,
        )
    )


    unavailable = next(
        item
        for item
        in result[
            "sector_exposure"
        ]
        if item[
            "name"
        ]
        == "Unavailable"
    )


    assert np.isclose(
        unavailable[
            "weight"
        ],
        0.3,
    )


def test_country_is_kept_separate_from_currency():

    result = (
        analyse_exposure_from_profiles(
            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.5,
                0.3,
                0.2,
            ],

            profiles=
                profiles(),
        )
    )


    countries = {
        item[
            "name"
        ]
        for item
        in result[
            "company_country_exposure"
        ]
    }


    currencies = {
        item[
            "name"
        ]
        for item
        in result[
            "trading_currency_exposure"
        ]
    }


    assert (
        "United States"
        in countries
    )


    assert (
        "USD"
        in currencies
    )


    assert (
        "USD"
        not in countries
    )


def test_effective_holdings_matches_hhi():

    result = (
        analyse_exposure_from_profiles(
            tickers=[
                "AAA",
                "BBB",
                "CCC",
            ],

            weights=[
                0.5,
                0.3,
                0.2,
            ],

            profiles=
                profiles(),
        )
    )


    expected = (
        1
        / (
            0.5 ** 2
            + 0.3 ** 2
            + 0.2 ** 2
        )
    )


    assert np.isclose(
        result[
            "concentration"
        ][
            "effective_holdings"
        ],
        expected,
        atol=0.01,
    )
