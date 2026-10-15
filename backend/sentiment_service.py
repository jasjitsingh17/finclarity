from backend.content_service import (
    fetch_portfolio_content,
)

from backend.sentiment_model import (
    score_headlines,
)

from backend.signal_engine import (
    portfolio_rag_signal,
    ticker_rag_signal,
)


BULLISH_THRESHOLD = 0.15
BEARISH_THRESHOLD = -0.15

MIN_SIGNAL_CONFIDENCE = 0.55
MIN_PORTFOLIO_CONFIDENCE = 0.55

MIN_SIGNAL_ARTICLES = 3


# ========================================
# DIRECTIONAL CLASSIFICATION
# ========================================

def classify_signal(
    score,
    confidence,
):
    """
    Convert ticker sentiment into a
    directional research label.
    """

    if (
        confidence
        < MIN_SIGNAL_CONFIDENCE
    ):

        if (
            score >= BULLISH_THRESHOLD
            or score <= BEARISH_THRESHOLD
        ):
            return "Uncertain"

        return "Neutral"


    if score >= BULLISH_THRESHOLD:
        return "Bullish"

    if score <= BEARISH_THRESHOLD:
        return "Bearish"

    return "Neutral"


def classify_regime(
    score,
    confidence,
):
    """
    Portfolio-level sentiment regime.
    """

    if (
        confidence
        < MIN_PORTFOLIO_CONFIDENCE
    ):
        return "Uncertain"


    if score >= BULLISH_THRESHOLD:
        return "Risk-On"

    if score <= BEARISH_THRESHOLD:
        return "Risk-Off"

    return "Neutral"


# ========================================
# TICKER AGGREGATION
# ========================================

def aggregate_ticker_sentiment(
    articles,
):
    """
    Aggregate FinBERT scores using:

    source quality × recency

    Confidence incorporates model certainty
    and the quantity of available headlines.
    """

    if not articles:

        empty_result = {

            "sentiment_score":
                0.0,

            "confidence":
                0.0,

            "signal":
                "No Signal",

            "article_count":
                0,

            "positive_articles":
                0,

            "neutral_articles":
                0,

            "negative_articles":
                0,
        }


        empty_result[
            "rag_signal"
        ] = ticker_rag_signal(
            score=0.0,
            confidence=0.0,
            article_count=0,
            positive_articles=0,
            neutral_articles=0,
            negative_articles=0,
            bullish_threshold=(
                BULLISH_THRESHOLD
            ),
            bearish_threshold=(
                BEARISH_THRESHOLD
            ),
            minimum_confidence=(
                MIN_SIGNAL_CONFIDENCE
            ),
            minimum_articles=(
                MIN_SIGNAL_ARTICLES
            ),
        )


        return empty_result


    weighted_score_sum = 0.0
    weighted_confidence_sum = 0.0
    total_weight = 0.0

    positive_articles = 0
    neutral_articles = 0
    negative_articles = 0


    for article in articles:

        weight = (
            article[
                "source_weight"
            ]
            *
            article[
                "recency_weight"
            ]
            *
            article.get(
                "relevance_score",
                1.0,
            )
        )


        sentiment = article[
            "sentiment"
        ]


        sentiment_score = (
            sentiment[
                "sentiment_score"
            ]
        )


        model_confidence = (
            sentiment[
                "model_confidence"
            ]
        )


        weighted_score_sum += (
            sentiment_score
            * weight
        )


        weighted_confidence_sum += (
            model_confidence
            * weight
        )


        total_weight += weight


        label = sentiment[
            "dominant_label"
        ]


        if label == "positive":
            positive_articles += 1

        elif label == "negative":
            negative_articles += 1

        else:
            neutral_articles += 1


    if total_weight <= 0:

        sentiment_score = 0.0
        base_confidence = 0.0

    else:

        sentiment_score = (
            weighted_score_sum
            / total_weight
        )

        base_confidence = (
            weighted_confidence_sum
            / total_weight
        )


    evidence_units = sum(
        (
            0.5
            if article.get(
                "source_type"
            ) == "social"
            else 1.0
        )
        for article in articles
    )


    volume_factor = min(
        1.0,
        0.5
        + 0.1
        * evidence_units,
    )


    confidence = (
        base_confidence
        * volume_factor
    )


    result = {

        "sentiment_score":
            round(
                sentiment_score,
                6,
            ),

        "confidence":
            round(
                confidence,
                6,
            ),

        "signal":
            classify_signal(
                sentiment_score,
                confidence,
            ),

        "article_count":
            len(articles),

        "positive_articles":
            positive_articles,

        "neutral_articles":
            neutral_articles,

        "negative_articles":
            negative_articles,
    }


    result[
        "rag_signal"
    ] = ticker_rag_signal(
        score=sentiment_score,
        confidence=confidence,
        article_count=len(
            articles
        ),
        positive_articles=(
            positive_articles
        ),
        neutral_articles=(
            neutral_articles
        ),
        negative_articles=(
            negative_articles
        ),
        bullish_threshold=(
            BULLISH_THRESHOLD
        ),
        bearish_threshold=(
            BEARISH_THRESHOLD
        ),
        minimum_confidence=(
            MIN_SIGNAL_CONFIDENCE
        ),
        minimum_articles=(
            MIN_SIGNAL_ARTICLES
        ),
    )


    return result


# ========================================
# COMPLETE PORTFOLIO SENTIMENT
# ========================================

def analyse_portfolio_sentiment(
    tickers,
    articles_per_ticker=8,
    lookback_hours=72,
):
    """
    Fetch news, run FinBERT, aggregate
    ticker sentiment and construct
    portfolio-level signals.
    """

    news = fetch_portfolio_content(
        tickers=tickers,
        articles_per_ticker=(
            articles_per_ticker
        ),
        lookback_hours=(
            lookback_hours
        ),
    )


    all_headlines = []

    article_locations = []


    for ticker in news[
        "tickers"
    ]:

        articles = (
            news[
                "articles_by_ticker"
            ].get(
                ticker,
                [],
            )
        )


        for index, article in enumerate(
            articles
        ):

            all_headlines.append(
                article[
                    "title"
                ]
            )

            article_locations.append(
                (
                    ticker,
                    index,
                )
            )


    sentiment_results = (
        score_headlines(
            all_headlines
        )
    )


    for location, sentiment in zip(
        article_locations,
        sentiment_results,
    ):

        ticker, index = location

        news[
            "articles_by_ticker"
        ][ticker][index][
            "sentiment"
        ] = sentiment


    ticker_sentiment = {}


    for ticker in news[
        "tickers"
    ]:

        articles = (
            news[
                "articles_by_ticker"
            ].get(
                ticker,
                [],
            )
        )


        ticker_sentiment[
            ticker
        ] = (
            aggregate_ticker_sentiment(
                articles
            )
        )


    weighted_score_sum = 0.0

    total_confidence = 0.0


    for ticker in news[
        "tickers"
    ]:

        result = (
            ticker_sentiment[
                ticker
            ]
        )


        confidence = result[
            "confidence"
        ]


        weighted_score_sum += (
            result[
                "sentiment_score"
            ]
            * confidence
        )


        total_confidence += (
            confidence
        )


    if total_confidence > 0:

        portfolio_score = (
            weighted_score_sum
            / total_confidence
        )

    else:

        portfolio_score = 0.0


    valid_confidences = [

        ticker_sentiment[
            ticker
        ][
            "confidence"
        ]

        for ticker in news[
            "tickers"
        ]

        if ticker_sentiment[
            ticker
        ][
            "article_count"
        ] > 0
    ]


    portfolio_confidence = (

        sum(
            valid_confidences
        )
        / len(
            valid_confidences
        )

        if valid_confidences

        else 0.0
    )


    portfolio_rag = (
        portfolio_rag_signal(
            score=portfolio_score,
            confidence=(
                portfolio_confidence
            ),
            ticker_results=(
                ticker_sentiment
            ),
            bullish_threshold=(
                BULLISH_THRESHOLD
            ),
            bearish_threshold=(
                BEARISH_THRESHOLD
            ),
            minimum_confidence=(
                MIN_PORTFOLIO_CONFIDENCE
            ),
        )
    )


    return {

        "tickers":
            news[
                "tickers"
            ],

        "portfolio_sentiment": {

            "sentiment_score":
                round(
                    portfolio_score,
                    6,
                ),

            "confidence":
                round(
                    portfolio_confidence,
                    6,
                ),

            "regime":
                classify_regime(
                    portfolio_score,
                    portfolio_confidence,
                ),

            "rag_signal":
                portfolio_rag,
        },


        "ticker_sentiment":
            ticker_sentiment,


        "articles_by_ticker":
            news[
                "articles_by_ticker"
            ],


        "total_articles":
            news[
                "total_articles"
            ],


        "errors":
            news[
                "errors"
            ],


        "methodology": {

            "sentiment_model":
                "ProsusAI/finbert",

            "headline_score":
                (
                    "positive probability "
                    "- negative probability"
                ),

            "article_weight":
                (
                    "source quality × recency × "
                    "headline relevance"
                ),

            "ticker_signal_thresholds": {

                "bullish":
                    BULLISH_THRESHOLD,

                "bearish":
                    BEARISH_THRESHOLD,

                "minimum_confidence":
                    MIN_SIGNAL_CONFIDENCE,

                "minimum_articles":
                    MIN_SIGNAL_ARTICLES,
            },

            "portfolio_regime_minimum_confidence":
                MIN_PORTFOLIO_CONFIDENCE,

            "rag_methodology":
                (
                    "Green = high-confidence positive; "
                    "Red = high-confidence negative; "
                    "Amber = neutral, mixed, low-confidence "
                    "or insufficient coverage."
                ),

            "portfolio_aggregation":
                (
                    "ticker sentiment weighted "
                    "by ticker confidence"
                ),
        },
    }
