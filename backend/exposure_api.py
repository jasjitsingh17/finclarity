from typing import List

from fastapi import (
    APIRouter,
    HTTPException,
)

from pydantic import BaseModel

from backend.exposure_service import (
    analyse_exposure,
)


router = APIRouter(
    prefix="/api/exposure",
    tags=["exposure"],
)


class ExposureRequest(
    BaseModel
):
    tickers: List[str]

    weights: List[float]


@router.post("/analyse")
def analyse_portfolio_exposure(
    request: ExposureRequest,
):
    """
    Current-weighted portfolio exposure analysis.

    Company country and trading currency are
    intentionally shown separately.
    """

    try:

        return analyse_exposure(
            tickers=request.tickers,
            weights=request.weights,
        )

    except (
        ValueError,
        TypeError,
    ) as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
