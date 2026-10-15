from backend.global_markets import (
    rank_quotes,
)


def test_rank_quotes():

    quotes = [
        {
            "ticker": "AAA",
            "change_percent": 1.2,
        },
        {
            "ticker": "BBB",
            "change_percent": 3.4,
        },
        {
            "ticker": "CCC",
            "change_percent": -0.4,
        },
    ]


    ranked = rank_quotes(
        quotes,
        limit=2,
    )


    assert ranked[0][
        "ticker"
    ] == "BBB"

    assert ranked[1][
        "ticker"
    ] == "AAA"


def test_rank_quotes_ignores_missing():

    quotes = [
        {
            "ticker": "AAA",
            "change_percent": None,
        },
        {
            "ticker": "BBB",
            "change_percent": 1.0,
        },
    ]


    ranked = rank_quotes(
        quotes
    )


    assert len(
        ranked
    ) == 1


def test_rank_quotes_respects_limit():

    quotes = [
        {
            "ticker": f"T{i}",
            "change_percent": float(i),
        }
        for i in range(10)
    ]


    ranked = rank_quotes(
        quotes,
        limit=3,
    )


    assert len(
        ranked
    ) == 3

    assert ranked[0][
        "ticker"
    ] == "T9"
