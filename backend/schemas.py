from pydantic import BaseModel, Field


# ========================================
# PORTFOLIO OPTIMISATION REQUEST
# ========================================

class OptimisationRequest(BaseModel):

    tickers: list[str]

    expected_returns: list[float]

    covariance_matrix: list[list[float]]

    current_weights: list[float] | None = None

    risk_free_rate: float = 0.03

    min_weight: float = 0.0

    max_weight: float = 1.0

    frontier_points: int = Field(
        default=25,
        ge=5,
        le=100,
    )


# ========================================
# MARKET DATA REQUEST
# ========================================

class MarketDataRequest(BaseModel):

    tickers: list[str]

    years: int = Field(
        default=3,
        ge=1,
        le=10,
    )# ========================================
# COMPLETE PORTFOLIO ANALYSIS REQUEST
# ========================================

class PortfolioAnalysisRequest(BaseModel):

    tickers: list[str]

    current_weights: list[float] | None = None

    years: int = Field(
        default=3,
        ge=1,
        le=10,
    )

    base_currency: str = "USD"

    risk_free_rate: float = Field(
        default=0.03,
        ge=0.0,
        le=0.25,
    )

    min_weight: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
    )

    max_weight: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
    )

    frontier_points: int = Field(
        default=25,
        ge=5,
        le=100,
    )


# ========================================
# SENTIMENT NEWS REQUEST
# ========================================

class NewsRequest(BaseModel):

    tickers: list[str]

    articles_per_ticker: int = Field(
        default=8,
        ge=1,
        le=20,
    )

    lookback_hours: int = Field(
        default=72,
        ge=1,
        le=336,
    )



# ========================================
# FINBERT SENTIMENT REQUEST
# ========================================

class SentimentAnalysisRequest(BaseModel):

    tickers: list[str]

    articles_per_ticker: int = Field(
        default=8,
        ge=1,
        le=20,
    )

    lookback_hours: int = Field(
        default=72,
        ge=1,
        le=336,
    )



# ========================================
# BLACK-LITTERMAN REQUEST
# ========================================

class BlackLittermanRequest(BaseModel):

    tickers: list[str]

    reference_weights: list[float] | None = None

    years: int = Field(
        default=3,
        ge=1,
        le=10,
    )

    risk_free_rate: float = Field(
        default=0.04,
        ge=0.0,
        le=0.25,
    )

    risk_aversion: float = Field(
        default=2.5,
        gt=0.0,
        le=20.0,
    )

    tau: float = Field(
        default=0.05,
        gt=0.0,
        le=1.0,
    )

    view_scale: float = Field(
        default=0.06,
        ge=0.0,
        le=0.50,
    )

    min_weight: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
    )

    max_weight: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
    )

    frontier_points: int = Field(
        default=20,
        ge=5,
        le=100,
    )

    articles_per_ticker: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    lookback_hours: int = Field(
        default=72,
        ge=1,
        le=336,
    )



# ========================================
# FACTOR ANALYSIS REQUEST
# ========================================

class FactorAnalysisRequest(BaseModel):

    tickers: list[str]

    benchmark: str = "SPY"

    years: int = Field(
        default=3,
        ge=2,
        le=10,
    )

    articles_per_ticker: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    lookback_hours: int = Field(
        default=72,
        ge=1,
        le=336,
    )

    factor_weights: dict[str, float] | None = None


# ========================================
# BACKTEST REQUEST
# ========================================

class BacktestRequest(BaseModel):

    tickers: list[str]

    benchmark: str = "SPY"


    base_currency: str = "USD"
    years: int = Field(
        default=5,
        ge=2,
        le=10,
    )

    risk_free_rate: float = Field(
        default=0.04,
        ge=0.0,
        le=0.25,
    )

    training_days: int = Field(
        default=252,
        ge=126,
        le=756,
    )

    rebalance_days: int = Field(
        default=21,
        ge=5,
        le=63,
    )

    min_weight: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
    )

    max_weight: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
    )

    transaction_cost_bps: float = Field(
        default=10.0,
        ge=0.0,
        le=100.0,
    )



# ========================================
# RISK ANALYTICS
# ========================================

class RiskAnalyticsRequest(BaseModel):

    tickers: list[str]

    weights: list[float]

    benchmark: str = "SPY"

    years: int = Field(
        default=3,
        ge=1,
        le=10,
    )

    base_currency: str = "USD"

    risk_free_rate: float = Field(
        default=0.04,
        ge=0.0,
        le=0.25,
    )
