from typing import List

from fastapi import (
    APIRouter,
    HTTPException,
)

from pydantic import (
    BaseModel,
    Field,
)

from backend.action_service import (
    build_action_centre,
)

from backend.diversification_service import (
    analyse_diversification,
)

from backend.exposure_service import (
    analyse_exposure,
)

from backend.performance_service import (
    analyse_performance,
)

from backend.stress_service import (
    analyse_stress,
)

from backend.sentiment_service import (
    analyse_portfolio_sentiment,
)


router = APIRouter(
    prefix="/api/action-centre",
    tags=["action-centre"],
)


class ActionCentreRequest(
    BaseModel
):
    tickers: List[str]

    weights: List[float]

    portfolio_value: float | None = None

    currency: str = "GBP"

    benchmark: str = "ACWI"

    years: int = Field(
        default=3,
        ge=1,
        le=10,
    )

    max_items: int = Field(
        default=6,
        ge=1,
        le=10,
    )


def _analytics_status_for_module(
    key,
    value,
):
    """
    Return available / partial / unavailable.

    Successful execution does not automatically mean
    complete analytical coverage.
    """

    if (
        value is None
        or not isinstance(
            value,
            dict,
        )
        or not value
    ):
        return "unavailable"


    if key == "performance":

        coverage = (
            value.get(
                "data_coverage",
                {},
            )
            or {}
        )


        try:
            weight_coverage = float(
                coverage.get(
                    "weight_coverage"
                )
            )

        except (
            TypeError,
            ValueError,
        ):
            weight_coverage = None


        if (
            bool(
                value.get(
                    "missing_tickers"
                )
            )
            or bool(
                coverage.get(
                    "excluded_tickers"
                )
            )
            or (
                coverage.get(
                    "weights_renormalised"
                )
                is True
            )
            or (
                weight_coverage
                is not None
                and weight_coverage
                < 0.999999
            )
            or (
                value.get(
                    "benchmark_available"
                )
                is False
            )
        ):
            return "partial"


    if key in (
        "diversification",
        "stress",
    ):

        if bool(
            value.get(
                "missing_tickers"
            )
        ):
            return "partial"


    if key == "sentiment":

        try:
            total_articles = float(
                value.get(
                    "total_articles"
                )
            )

        except (
            TypeError,
            ValueError,
        ):
            total_articles = None


        if (
            (
                total_articles
                is not None
                and total_articles <= 0
            )
            or bool(
                value.get(
                    "errors"
                )
            )
        ):
            return "partial"


    return "available"


@router.post("/analyse")
def analyse_portfolio_action_centre(
    request: ActionCentreRequest,
):
    """
    Combine existing FinClarity analytics
    into a ranked portfolio-attention view.

    One unavailable analytical module does not
    prevent the remaining modules from working.
    """

    if (
        len(
            request.tickers
        )
        != len(
            request.weights
        )
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Tickers and weights must "
                "have the same length."
            ),
        )


    if not request.tickers:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least one holding "
                "is required."
            ),
        )


    benchmark = (
        request.benchmark
        .strip()
        .upper()
    )


    if not benchmark:

        raise HTTPException(
            status_code=400,
            detail=(
                "Benchmark cannot be empty."
            ),
        )


    currency = (
        request.currency
        .strip()
        .upper()
        or "GBP"
    )


    analytics = {
        "exposure":
            None,

        "diversification":
            None,

        "stress":
            None,

        "performance":
            None,

        "sentiment":
            None,
    }


    errors = {}


    # ======================================================
    # EXPOSURE
    # ======================================================

    try:

        analytics[
            "exposure"
        ] = analyse_exposure(
            tickers=
                request.tickers,

            weights=
                request.weights,
        )

    except Exception as exc:

        errors[
            "exposure"
        ] = str(
            exc
        )


    # ======================================================
    # DIVERSIFICATION
    # ======================================================

    if (
        len(
            request.tickers
        )
        >= 2
    ):

        try:

            analytics[
                "diversification"
            ] = analyse_diversification(
                tickers=
                    request.tickers,

                weights=
                    request.weights,

                years=
                    request.years,

                base_currency=
                    currency,
            )

        except Exception as exc:

            errors[
                "diversification"
            ] = str(
                exc
            )

    else:

        errors[
            "diversification"
        ] = (
            "Diversification analysis requires "
            "at least two holdings."
        )


    # ======================================================
    # STRESS
    # ======================================================

    try:

        analytics[
            "stress"
        ] = analyse_stress(
            tickers=
                request.tickers,

            weights=
                request.weights,

            years=
                request.years,

            base_currency=
                currency,
        )

    except Exception as exc:

        errors[
            "stress"
        ] = str(
            exc
        )


    # ======================================================
    # PERFORMANCE
    # ======================================================

    try:

        analytics[
            "performance"
        ] = analyse_performance(
            tickers=
                request.tickers,

            weights=
                request.weights,

            benchmark=
                benchmark,

            years=
                request.years,

            base_currency=
                currency,
        )

    except Exception as exc:

        errors[
            "performance"
        ] = str(
            exc
        )


    # ======================================================
    # SENTIMENT
    # Existing FinBERT + content pipeline.
    # ======================================================

    try:

        analytics[
            "sentiment"
        ] = analyse_portfolio_sentiment(
            tickers=
                request.tickers,

            articles_per_ticker=
                8,

            lookback_hours=
                72,
        )

    except Exception as exc:

        errors[
            "sentiment"
        ] = str(
            exc
        )


    # ======================================================
    # SYNTHESIS
    # ======================================================

    result = build_action_centre(
        exposure=
            analytics[
                "exposure"
            ],

        diversification=
            analytics[
                "diversification"
            ],

        stress=
            analytics[
                "stress"
            ],

        performance=
            analytics[
                "performance"
            ],

        sentiment=
            analytics[
                "sentiment"
            ],

        portfolio_value=
            request.portfolio_value,

        currency=
            currency,

        max_items=
            request.max_items,
    )


    result[
        "analytics_status"
    ] = {
        key:
            _analytics_status_for_module(
                key,
                value,
            )
        for key, value
        in analytics.items()
    }


    result[
        "analytics_errors"
    ] = errors


    result[
        "benchmark"
    ] = benchmark


    result[
        "lookback_years"
    ] = request.years


    result[
        "currency"
    ] = currency


    result[
        "source_analytics"
    ] = analytics


    return result
