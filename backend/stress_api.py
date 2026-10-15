from typing import Dict, List

from fastapi import (
    APIRouter,
    HTTPException,
)

from pydantic import (
    BaseModel,
    Field,
)

from backend.stress_service import (
    analyse_stress,
    apply_custom_shock,
)


router = APIRouter(
    prefix="/api/stress",
    tags=["stress-testing"],
)


class StressAnalysisRequest(
    BaseModel
):
    tickers: List[str]

    weights: List[float]

    years: int = Field(
        default=3,
        ge=1,
        le=10,
    )

    base_currency: str = "USD"


class CustomStressRequest(
    BaseModel
):
    tickers: List[str]

    weights: List[float]

    shocks: Dict[str, float]


@router.post("/analyse")
def analyse_portfolio_stress(
    request: StressAnalysisRequest,
):
    """
    Historical portfolio stress analysis.

    Replays adverse periods from historical
    return data using current portfolio weights.
    """

    try:

        return analyse_stress(
            tickers=request.tickers,
            weights=request.weights,
            years=request.years,
            base_currency=(
                request.base_currency
            ),
        )

    except (
        ValueError,
        TypeError,
    ) as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post("/custom")
def analyse_custom_stress(
    request: CustomStressRequest,
):
    """
    Deterministic user-defined scenario.

    No forecasting is performed.
    """

    try:

        return apply_custom_shock(
            tickers=request.tickers,
            weights=request.weights,
            shocks=request.shocks,
        )

    except (
        ValueError,
        TypeError,
    ) as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
