from backend import content_service


def test_deduplicate_prefers_stronger_item():

    weak = {
        "title":
            "Company launches new AI platform",

        "relevance_score":
            0.8,

        "source_weight":
            0.45,

        "recency_weight":
            0.9,

        "source_type":
            "social",
    }


    strong = {
        "title":
            "Company launches new AI platform",

        "relevance_score":
            0.9,

        "source_weight":
            0.95,

        "recency_weight":
            0.9,

        "source_type":
            "news",
    }


    result = (
        content_service
        .deduplicate_content(
            [
                weak,
                strong,
            ]
        )
    )


    assert len(result) == 1

    assert (
        result[0][
            "source_type"
        ]
        == "news"
    )


def test_near_duplicate_detection():

    left = (
        "Microsoft launches new AI chip "
        "for data centres"
    )

    right = (
        "Microsoft launches new AI chip "
        "for data centers"
    )


    assert (
        content_service
        ._similar_title(
            left,
            right,
        )
    )


def test_portfolio_content_combines_sources(
    monkeypatch,
):

    def fake_news(
        ticker,
        max_articles,
        lookback_hours,
    ):
        return [
            {
                "ticker":
                    ticker,

                "title":
                    "Microsoft reports strong cloud growth",

                "source":
                    "Reuters",

                "link":
                    "https://example.com/news",

                "published_at":
                    "2026-10-12T10:00:00+00:00",

                "age_hours":
                    2.0,

                "recency_weight":
                    0.9,

                "source_weight":
                    0.95,

                "relevance_score":
                    0.9,

                "provider":
                    "Google News RSS",
            }
        ]


    def fake_social(
        ticker,
        max_items,
        lookback_hours,
    ):
        return [
            {
                "ticker":
                    ticker,

                "title":
                    "Investors discuss Microsoft earnings",

                "source":
                    "r/stocks",

                "link":
                    "https://reddit.com/example",

                "published_at":
                    "2026-10-12T11:00:00+00:00",

                "age_hours":
                    1.0,

                "recency_weight":
                    0.9,

                "source_weight":
                    0.45,

                "relevance_score":
                    0.8,

                "provider":
                    "Reddit RSS",

                "source_type":
                    "social",

                "platform":
                    "Reddit",
            }
        ]


    monkeypatch.setattr(
        content_service,
        "fetch_ticker_news",
        fake_news,
    )

    monkeypatch.setattr(
        content_service,
        "fetch_reddit_posts",
        fake_social,
    )


    result = (
        content_service
        .fetch_portfolio_content(
            ["MSFT"],
            articles_per_ticker=5,
            lookback_hours=72,
        )
    )


    items = (
        result[
            "articles_by_ticker"
        ][
            "MSFT"
        ]
    )


    assert len(items) == 2

    assert {
        item[
            "source_type"
        ]
        for item
        in items
    } == {
        "news",
        "social",
    }


    assert (
        result[
            "source_counts"
        ][
            "news"
        ]
        == 1
    )

    assert (
        result[
            "source_counts"
        ][
            "social"
        ]
        == 1
    )
