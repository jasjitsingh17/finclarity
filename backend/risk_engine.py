import numpy as np


TRADING_DAYS = 252


# ========================================
# PORTFOLIO RETURN SERIES
# ========================================

def portfolio_return_series(
    daily_returns,
    weights,
):
    """
    Convert asset daily returns into
    portfolio daily returns.
    """

    returns_matrix = np.asarray(
        daily_returns,
        dtype=float,
    )

    weights = np.asarray(
        weights,
        dtype=float,
    )

    if returns_matrix.ndim != 2:

        raise ValueError(
            "Daily returns must be "
            "two-dimensional."
        )

    if (
        returns_matrix.shape[1]
        != len(weights)
    ):

        raise ValueError(
            "Portfolio weights must match "
            "the number of assets."
        )

    return (
        returns_matrix
        @ weights
    )


# ========================================
# HISTORICAL VALUE AT RISK
# ========================================

def historical_var(
    portfolio_returns,
    confidence=0.95,
):
    """
    Historical one-day VaR return threshold.
    """

    portfolio_returns = np.asarray(
        portfolio_returns,
        dtype=float,
    )

    return float(
        np.quantile(
            portfolio_returns,
            1.0 - confidence,
        )
    )


# ========================================
# EXPECTED SHORTFALL / CVAR
# ========================================

def historical_cvar(
    portfolio_returns,
    confidence=0.95,
):
    """
    Average return in the historical
    tail beyond VaR.
    """

    portfolio_returns = np.asarray(
        portfolio_returns,
        dtype=float,
    )

    var_threshold = historical_var(
        portfolio_returns,
        confidence,
    )

    tail_returns = (
        portfolio_returns[
            portfolio_returns
            <= var_threshold
        ]
    )

    if len(tail_returns) == 0:
        return var_threshold

    return float(
        np.mean(
            tail_returns
        )
    )


# ========================================
# MAXIMUM DRAWDOWN
# ========================================

def maximum_drawdown(
    portfolio_returns,
):
    """
    Maximum peak-to-trough loss.
    """

    portfolio_returns = np.asarray(
        portfolio_returns,
        dtype=float,
    )

    wealth_index = np.cumprod(
        1.0 + portfolio_returns
    )

    running_peak = np.maximum.accumulate(
        wealth_index
    )

    drawdowns = (
        wealth_index
        / running_peak
        - 1.0
    )

    return float(
        np.min(
            drawdowns
        )
    )


# ========================================
# DOWNSIDE DEVIATION
# ========================================

def downside_deviation(
    portfolio_returns,
    risk_free_rate=0.0,
):
    """
    Annualised downside deviation.
    """

    portfolio_returns = np.asarray(
        portfolio_returns,
        dtype=float,
    )

    daily_target = (
        risk_free_rate
        / TRADING_DAYS
    )

    downside = np.minimum(
        portfolio_returns
        - daily_target,
        0.0,
    )

    return float(
        np.sqrt(
            np.mean(
                downside ** 2
            )
        )
        * np.sqrt(
            TRADING_DAYS
        )
    )


# ========================================
# SORTINO RATIO
# ========================================

def sortino_ratio(
    portfolio_returns,
    risk_free_rate=0.0,
):
    """
    Annualised Sortino ratio.
    """

    portfolio_returns = np.asarray(
        portfolio_returns,
        dtype=float,
    )

    annualised_return = (
        np.mean(
            portfolio_returns
        )
        * TRADING_DAYS
    )

    downside = downside_deviation(
        portfolio_returns,
        risk_free_rate,
    )

    if downside <= 0:
        return 0.0

    return float(
        (
            annualised_return
            - risk_free_rate
        )
        / downside
    )


# ========================================
# COMPLETE RISK SUMMARY
# ========================================

def calculate_risk_summary(
    daily_returns,
    weights,
    risk_free_rate=0.0,
):
    """
    Calculate historical portfolio
    risk analytics.
    """

    portfolio_returns = (
        portfolio_return_series(
            daily_returns,
            weights,
        )
    )

    return {

        "var_95":
            historical_var(
                portfolio_returns,
            ),

        "cvar_95":
            historical_cvar(
                portfolio_returns,
            ),

        "max_drawdown":
            maximum_drawdown(
                portfolio_returns,
            ),

        "downside_deviation":
            downside_deviation(
                portfolio_returns,
                risk_free_rate,
            ),

        "sortino_ratio":
            sortino_ratio(
                portfolio_returns,
                risk_free_rate,
            ),

        "observations":
            int(
                len(portfolio_returns)
            ),
    }
