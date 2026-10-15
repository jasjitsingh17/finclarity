from typing import List

from fastapi import (
    APIRouter,
    HTTPException,
)

from pydantic import (
    BaseModel,
    Field,
)

from backend.performance_service import (
    analyse_performance,
)


router = APIRouter(
    prefix="/api/performance",
    tags=["performance"],
)


class PerformanceRequest(
    BaseModel
):
    tickers: List[str]

    weights: List[float]

    benchmark: str = "ACWI"

    base_currency: str = "USD"

    years: int = Field(
        default=3,
        ge=1,
        le=10,
    )


@router.post("/analyse")
def analyse_portfolio_performance(
    request: PerformanceRequest,
):
    """
    Historical constant-weight portfolio
    simulation versus a benchmark.

    This is not the investor's realised
    historical performance.
    """

    try:

        benchmark = (
            request.benchmark
            .strip()
            .upper()
        )


        if not benchmark:

            raise ValueError(
                "Benchmark cannot be empty."
            )


        base_currency = (
            request.base_currency
            .strip()
        )


        if not base_currency:

            raise ValueError(
                "Base currency cannot be empty."
            )


        return analyse_performance(
            tickers=request.tickers,
            weights=request.weights,
            benchmark=benchmark,
            years=request.years,
            base_currency=base_currency,
        )

    except (
        ValueError,
        TypeError,
    ) as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
