import os
from backend.action_api import router as action_centre_router
from backend.performance_api import router as performance_router
from backend.exposure_api import router as exposure_router
from backend.stress_api import router as stress_router
from backend.diversification_api import router as diversification_router
from backend.fx_service import (
    get_fx_quote,
)
from fastapi import HTTPException as RetailHTTPException
from backend.retail_market import (
    RetailMarketRequest,
    build_retail_market_snapshot,
)
from backend.global_markets import get_global_market_overview
from backend.schemas import RiskAnalyticsRequest
from backend.risk_analytics_service import analyse_risk
from backend.schemas import BacktestRequest
from backend.backtest_service import analyse_backtest
from backend.schemas import FactorAnalysisRequest
from backend.factor_service import analyse_factor_portfolio
from backend.schemas import BlackLittermanRequest
from backend.black_litterman_service import analyse_black_litterman_portfolio
from backend.schemas import SentimentAnalysisRequest
from backend.sentiment_service import analyse_portfolio_sentiment
from backend.news_service import fetch_portfolio_news
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from backend.market_data import (
    build_market_model,
)
from backend.optimizer import (
    efficient_frontier,
    maximise_sharpe,
    minimise_variance,
    portfolio_return,
    portfolio_volatility,
    sharpe_ratio,
)
from backend.portfolio_service import (
    analyse_portfolio as run_portfolio_analysis,
)
from backend.schemas import (
    MarketDataRequest,
    OptimisationRequest,
    PortfolioAnalysisRequest,
    NewsRequest,
)

# ========================================
# FINCLARITY API
# ========================================

app = FastAPI(
    title="FinClarity API",
    description=(
        "Quantitative portfolio analytics "
        "and sentiment intelligence backend."
    ),
    version="0.1.0",
)

app.include_router(action_centre_router)


app.include_router(performance_router)


app.include_router(exposure_router)


app.include_router(stress_router)


app.include_router(diversification_router)



# ========================================
# CORS
# Allows React frontend to call Python API
# ========================================


# ========================================
# DEPLOYMENT-AWARE CORS
# ========================================

_LOCAL_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def _finclarity_cors_origins() -> list[str]:

    configured = [
        origin
        .strip()
        .rstrip("/")
        for origin
        in os.getenv(
            "FINCLARITY_CORS_ORIGINS",
            "",
        ).split(",")
        if origin.strip()
    ]

    if configured:
        return list(
            dict.fromkeys(
                configured
            )
        )

    return _LOCAL_CORS_ORIGINS.copy()


CORS_ORIGINS = (
    _finclarity_cors_origins()
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================================
# ROOT ENDPOINT
# ========================================

@app.get("/")
def root():
    return {
        "message": "FinClarity API",
        "status": "running",
    }

# ========================================
# COMPLETE PORTFOLIO ANALYSIS
# ========================================

@app.post("/api/portfolio/analyse")
def analyse_portfolio(
    request: PortfolioAnalysisRequest,
):

    if len(request.tickers) < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least two tickers "
                "are required."
            ),
        )


    try:

        result = run_portfolio_analysis(
            tickers=request.tickers,
            years=request.years,
            current_weights=(
                request.current_weights
            ),
            risk_free_rate=(
                request.risk_free_rate
            ),
            min_weight=(
                request.min_weight
            ),
            max_weight=(
                request.max_weight
            ),
            frontier_points=(
                request.frontier_points
            ),
        )


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    return result

# ========================================
# HEALTH CHECK
# ========================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "finclarity-api",
        "version": "0.1.0",
    }# ========================================
# PORTFOLIO OPTIMISATION
# ========================================

@app.post("/api/portfolio/optimise")
def optimise_portfolio(
    request: OptimisationRequest,
):

    number_of_assets = len(
        request.tickers
    )


    # ------------------------------------
    # VALIDATION
    # ------------------------------------
    if request.current_weights is None:

        current_weights = [
            1 / number_of_assets
            for _ in range(number_of_assets)
        ]

    else:

        if (
            len(request.current_weights)
            != number_of_assets
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Current weights must match "
                    "the number of tickers."
                ),
            )

        current_weights = (
            request.current_weights
        )


    current_expected_return = (
        portfolio_return(
            current_weights,
            request.expected_returns,
        )
    )


    current_volatility = (
        portfolio_volatility(
            current_weights,
            request.covariance_matrix,
        )
    )


    current_sharpe = sharpe_ratio(
        current_weights,
        request.expected_returns,
        request.covariance_matrix,
        request.risk_free_rate,
    )
    if number_of_assets < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least two assets "
                "are required."
            ),
        )


    if (
        len(request.expected_returns)
        != number_of_assets
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Expected returns must "
                "match the number of tickers."
            ),
        )


    if (
        len(request.covariance_matrix)
        != number_of_assets
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Covariance matrix dimensions "
                "must match the number of assets."
            ),
        )


    for row in (
        request.covariance_matrix
    ):

        if len(row) != number_of_assets:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Covariance matrix must "
                    "be square."
                ),
            )


    if (
        request.min_weight
        > request.max_weight
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "min_weight cannot be "
                "greater than max_weight."
            ),
        )
# ========================================
# MARKET DATA
# ========================================

@app.post("/api/market/model")
def create_market_model(
    request: MarketDataRequest,
):

    if len(request.tickers) < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least two tickers "
                "are required."
            ),
        )


    try:

        result = build_market_model(
            request.tickers,
            request.years,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    return result

    # ------------------------------------
    # OPTIMISE
    # ------------------------------------

    try:

        max_sharpe = maximise_sharpe(
            request.expected_returns,
            request.covariance_matrix,
            request.risk_free_rate,
            request.min_weight,
            request.max_weight,
        )


        min_variance = minimise_variance(
            request.expected_returns,
            request.covariance_matrix,
            request.min_weight,
            request.max_weight,
        )


        frontier = efficient_frontier(
            request.expected_returns,
            request.covariance_matrix,
            request.frontier_points,
            request.min_weight,
            request.max_weight,
        )


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    # ------------------------------------
    # MAP WEIGHTS TO TICKERS
    # ------------------------------------

    max_sharpe_weights = {
        ticker: round(
            weight,
            6,
        )
        for ticker, weight
        in zip(
            request.tickers,
            max_sharpe["weights"],
        )
    }


    min_variance_weights = {
        ticker: round(
            weight,
            6,
        )
        for ticker, weight
        in zip(
            request.tickers,
            min_variance["weights"],
        )
    }


    # ------------------------------------
    # RESPONSE
    # ------------------------------------
    return {

        "tickers":
            request.tickers,

        "risk_free_rate":
            request.risk_free_rate,


        "current_portfolio": {

            "weights": {
                ticker: round(weight, 6)
                for ticker, weight
                in zip(
                    request.tickers,
                    current_weights,
                )
            },

            "expected_return":
                round(
                    current_expected_return,
                    6,
                ),

            "volatility":
                round(
                    current_volatility,
                    6,
                ),

            "sharpe_ratio":
                round(
                    current_sharpe,
                    6,
                ),
        },


        "maximum_sharpe": {

            "weights":
                max_sharpe_weights,

            "expected_return":
                round(
                    max_sharpe[
                        "expected_return"
                    ],
                    6,
                ),

            "volatility":
                round(
                    max_sharpe[
                        "volatility"
                    ],
                    6,
                ),

            "sharpe_ratio":
                round(
                    max_sharpe[
                        "sharpe_ratio"
                    ],
                    6,
                ),
        },


        "minimum_variance": {

            "weights":
                min_variance_weights,

            "expected_return":
                round(
                    min_variance[
                        "expected_return"
                    ],
                    6,
                ),

            "volatility":
                round(
                    min_variance[
                        "volatility"
                    ],
                    6,
                ),
        },


        "efficient_frontier":
            frontier,
    }


# ========================================
# SENTIMENT NEWS INGESTION
# ========================================

@app.post("/api/sentiment/news")
def get_sentiment_news(
    request: NewsRequest,
):

    if len(request.tickers) < 1:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least one ticker "
                "is required."
            ),
        )


    try:

        result = fetch_portfolio_news(
            tickers=request.tickers,
            articles_per_ticker=(
                request
                .articles_per_ticker
            ),
            lookback_hours=(
                request
                .lookback_hours
            ),
        )


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    return result



# ========================================
# FINBERT SENTIMENT ANALYSIS
# ========================================

@app.post("/api/sentiment/analyse")
def analyse_sentiment(
    request: SentimentAnalysisRequest,
):

    if len(request.tickers) < 1:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least one ticker "
                "is required."
            ),
        )


    try:

        result = (
            analyse_portfolio_sentiment(
                tickers=request.tickers,
                articles_per_ticker=(
                    request
                    .articles_per_ticker
                ),
                lookback_hours=(
                    request
                    .lookback_hours
                ),
            )
        )


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Sentiment analysis failed: "
                + str(error)
            ),
        ) from error


    return result



# ========================================
# BLACK-LITTERMAN ANALYSIS
# ========================================

@app.post("/api/black-litterman/analyse")
def analyse_black_litterman(
    request: BlackLittermanRequest,
):

    if len(request.tickers) < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least two tickers "
                "are required."
            ),
        )


    try:

        result = (
            analyse_black_litterman_portfolio(
                tickers=request.tickers,
                reference_weights=(
                    request.reference_weights
                ),
                years=request.years,
                risk_free_rate=(
                    request.risk_free_rate
                ),
                risk_aversion=(
                    request.risk_aversion
                ),
                tau=request.tau,
                view_scale=(
                    request.view_scale
                ),
                min_weight=(
                    request.min_weight
                ),
                max_weight=(
                    request.max_weight
                ),
                frontier_points=(
                    request.frontier_points
                ),
                articles_per_ticker=(
                    request
                    .articles_per_ticker
                ),
                lookback_hours=(
                    request
                    .lookback_hours
                ),
            )
        )


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Black-Litterman analysis failed: "
                + str(error)
            ),
        ) from error


    return result



# ========================================
# FACTOR MODEL ANALYSIS
# ========================================

@app.post("/api/factors/analyse")
def analyse_factors(
    request: FactorAnalysisRequest,
):

    if len(request.tickers) < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least two tickers "
                "are required."
            ),
        )


    try:

        result = (
            analyse_factor_portfolio(
                tickers=request.tickers,
                benchmark=(
                    request.benchmark
                ),
                years=request.years,
                articles_per_ticker=(
                    request
                    .articles_per_ticker
                ),
                lookback_hours=(
                    request
                    .lookback_hours
                ),
                factor_weights=(
                    request
                    .factor_weights
                ),
            )
        )


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Factor analysis failed: "
                + str(error)
            ),
        ) from error


    return result



# ========================================
# WALK-FORWARD BACKTEST
# ========================================

@app.post("/api/backtest/run")
def run_backtest(
    request: BacktestRequest,
):

    if len(request.tickers) < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least two tickers "
                "are required."
            ),
        )


    try:

        result = analyse_backtest(
            tickers=request.tickers,
            benchmark=request.benchmark,
            years=request.years,

            risk_free_rate=(
                request.risk_free_rate
            ),
            training_days=(
                request.training_days
            ),
            rebalance_days=(
                request.rebalance_days
            ),
            min_weight=(
                request.min_weight
            ),
            max_weight=(
                request.max_weight
            ),
            transaction_cost_bps=(
                request
                .transaction_cost_bps
            ),
        )


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Backtest failed: "
                + str(error)
            ),
        ) from error


    return result



# ========================================
# DEDICATED RISK ANALYTICS
# ========================================

@app.post("/api/risk/analyse")
def risk_analytics(
    request: RiskAnalyticsRequest,
):

    try:

        return analyse_risk(
            tickers=request.tickers,
            weights=request.weights,
            benchmark=request.benchmark,
            years=request.years,
            risk_free_rate=(
                request.risk_free_rate
            ),

            base_currency=(
                request.base_currency
            ),
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Risk analytics failed: "
                + str(error)
            ),
        ) from error



# ========================================
# GLOBAL MARKET INTELLIGENCE
# ========================================

@app.get("/api/markets/global-overview")
def global_market_overview():

    try:

        result = (
            get_global_market_overview()
        )


        if (
            result.get(
                "quote_count",
                0,
            )
            == 0
        ):

            raise HTTPException(
                status_code=503,
                detail=(
                    "Global market quotes "
                    "are temporarily unavailable."
                ),
            )


        return result


    except HTTPException:

        raise


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Global market data failed: "
                + str(
                    error
                )
            ),
        ) from error


@app.post("/api/retail/market-snapshot")
def retail_market_snapshot(
    request: RetailMarketRequest,
):

    try:

        return (
            build_retail_market_snapshot(
                request
            )
        )

    except ValueError as error:

        raise RetailHTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:

        raise RetailHTTPException(
            status_code=500,
            detail=(
                "Retail market analysis failed: "
                + str(error)
            ),
        ) from error


@app.get("/api/fx/quote")
def fx_quote(
    from_currency: str,
    to_currency: str,
):

    try:

        return get_fx_quote(
            from_currency,
            to_currency,
        )

    except ValueError as error:

        raise RetailHTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:

        raise RetailHTTPException(
            status_code=500,
            detail=(
                "FX quote failed: "
                + str(error)
            ),
        ) from error



# ========================================
# RETAIL / RESEARCH FILING EVIDENCE
# ========================================

@app.get("/api/filings/{ticker}")
def get_ticker_filings(
    ticker: str,
    max_items: int = 6,
):
    """
    Retrieve recent material SEC filings for a
    US-listed ticker.

    Filing evidence is intentionally kept
    separate from FinBERT news sentiment.
    """

    from backend.filing_service import (
        fetch_sec_filings,
    )

    safe_max = max(
        1,
        min(
            int(max_items),
            12,
        ),
    )

    try:

        filings = fetch_sec_filings(
            ticker=ticker,
            max_items=safe_max,
        )

        return {
            "ticker":
                ticker
                .strip()
                .upper(),

            "filings":
                filings,

            "count":
                len(
                    filings
                ),

            "source":
                "SEC EDGAR",

            "methodology":
                (
                    "Regulatory filings are "
                    "evidence/context only and "
                    "are excluded from FinBERT "
                    "sentiment aggregation."
                ),
        }

    except Exception as exc:

        return {
            "ticker":
                ticker
                .strip()
                .upper(),

            "filings":
                [],

            "count":
                0,

            "source":
                "SEC EDGAR",

            "error":
                str(exc),

            "methodology":
                (
                    "Regulatory filings are "
                    "evidence/context only and "
                    "are excluded from FinBERT "
                    "sentiment aggregation."
                ),
        }


# ========================================
# COMPANY / INVESTOR RELATIONS EVIDENCE
# ========================================

@app.get("/api/company/{ticker}")
def get_company_updates(
    ticker: str,
    max_items: int = 6,
):
    """
    Retrieve recent indexed first-party
    company-domain content.

    Company communications are evidence/context
    and are excluded from portfolio FinBERT
    sentiment aggregation.
    """

    from backend.company_service import (
        fetch_company_updates,
    )

    safe_max = max(
        1,
        min(
            int(max_items),
            12,
        ),
    )

    try:

        result = fetch_company_updates(
            ticker=ticker,
            max_items=safe_max,
        )

        result["methodology"] = (
            "Company communications are "
            "first-party evidence and are "
            "excluded from FinBERT portfolio "
            "sentiment aggregation."
        )

        return result

    except Exception as exc:

        return {
            "ticker":
                ticker
                .strip()
                .upper(),

            "items":
                [],

            "count":
                0,

            "error":
                str(exc),

            "methodology":
                (
                    "Company communications "
                    "are first-party evidence "
                    "and are excluded from "
                    "FinBERT portfolio "
                    "sentiment aggregation."
                ),
        }
