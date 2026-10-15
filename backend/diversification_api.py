from typing import List

from fastapi import (
    APIRouter,
    HTTPException,
)
from pydantic import BaseModel, Field

from backend.diversification_service import (
    analyse_diversification,
)


router = APIRouter(
    prefix="/api/diversification",
    tags=["diversification"],
)


class DiversificationRequest(
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


@router.post("/analyse")
def analyse_portfolio_diversification(
    request: DiversificationRequest,
):
    """
    Historical diversification diagnostic.

    Uses real historical market prices and
    user-supplied portfolio weights.

    This is not a forecast or investment
    recommendation.
    """

    try:

        return analyse_diversification(
            tickers=request.tickers,
            weights=request.weights,
            years=request.years,
            base_currency=(
                request.base_currency
            ),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except TypeError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
