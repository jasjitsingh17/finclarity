GREEN = "GREEN"
AMBER = "AMBER"
RED = "RED"


def ticker_rag_signal(
    score,
    confidence,
    article_count,
    positive_articles,
    neutral_articles,
    negative_articles,
    bullish_threshold=0.15,
    bearish_threshold=-0.15,
    minimum_confidence=0.55,
    minimum_articles=3,
):
    """
    Convert sentiment measurements into
    an explainable RAG research signal.
    """

    if article_count < minimum_articles:

        return {
            "status": AMBER,
            "label": "Insufficient Coverage",
            "reason": (
                "Too few recent headlines "
                "for a high-conviction signal."
            ),
        }


    if confidence < minimum_confidence:

        return {
            "status": AMBER,
            "label": "Low Confidence",
            "reason": (
                "Directional sentiment exists, "
                "but model confidence is below "
                "the required threshold."
            ),
        }


    if score >= bullish_threshold:

        return {
            "status": GREEN,
            "label": "Positive",
            "reason": (
                "High-confidence positive "
                "financial-news sentiment."
            ),
        }


    if score <= bearish_threshold:

        return {
            "status": RED,
            "label": "Negative",
            "reason": (
                "High-confidence negative "
                "financial-news sentiment."
            ),
        }


    if (
        positive_articles > 0
        and negative_articles > 0
    ):

        return {
            "status": AMBER,
            "label": "Mixed",
            "reason": (
                "Recent headlines contain both "
                "positive and negative signals."
            ),
        }


    return {
        "status": AMBER,
        "label": "Neutral",
        "reason": (
            "Sentiment magnitude is not strong "
            "enough for a directional signal."
        ),
    }


def portfolio_rag_signal(
    score,
    confidence,
    ticker_results,
    bullish_threshold=0.15,
    bearish_threshold=-0.15,
    minimum_confidence=0.55,
):
    """
    Construct the portfolio-level RAG signal.

    Conflicting RED and GREEN ticker signals
    are deliberately classified as AMBER.
    """

    statuses = [
        result.get(
            "rag_signal",
            {},
        ).get(
            "status"
        )

        for result in ticker_results.values()
    ]


    has_green = GREEN in statuses
    has_red = RED in statuses


    if has_green and has_red:

        return {
            "status": AMBER,
            "label": "Mixed Portfolio",
            "reason": (
                "The portfolio contains conflicting "
                "high-confidence positive and "
                "negative ticker signals."
            ),
        }


    if confidence < minimum_confidence:

        return {
            "status": AMBER,
            "label": "Low Confidence",
            "reason": (
                "Portfolio-level sentiment confidence "
                "is below the required threshold."
            ),
        }


    if score >= bullish_threshold:

        return {
            "status": GREEN,
            "label": "Risk-On",
            "reason": (
                "Portfolio news sentiment is "
                "positively skewed with sufficient "
                "confidence."
            ),
        }


    if score <= bearish_threshold:

        return {
            "status": RED,
            "label": "Risk-Off",
            "reason": (
                "Portfolio news sentiment is "
                "negatively skewed with sufficient "
                "confidence."
            ),
        }


    return {
        "status": AMBER,
        "label": "Neutral",
        "reason": (
            "Portfolio sentiment is not sufficiently "
            "directional for a Risk-On or Risk-Off "
            "classification."
        ),
    }
