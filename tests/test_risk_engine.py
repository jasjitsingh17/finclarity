import numpy as np
import pandas as pd

from backend.risk_engine import (
    calculate_risk_summary,
    historical_cvar,
    historical_var,
    maximum_drawdown,
    portfolio_return_series,
)


def sample_returns():

    return pd.DataFrame(
        {
            "AAPL": [
                0.010,
                -0.020,
                0.015,
                -0.030,
                0.012,
                0.008,
                -0.010,
                0.018,
            ],

            "MSFT": [
                0.008,
                -0.010,
                0.012,
                -0.020,
                0.010,
                0.006,
                -0.008,
                0.015,
            ],
        }
    )


def test_portfolio_return_series():

    portfolio = portfolio_return_series(
        sample_returns(),
        [0.5, 0.5],
    )

    assert len(portfolio) == 8
    assert np.isfinite(portfolio).all()


def test_cvar_is_worse_than_var():

    portfolio = portfolio_return_series(
        sample_returns(),
        [0.5, 0.5],
    )

    var_95 = historical_var(
        portfolio
    )

    cvar_95 = historical_cvar(
        portfolio
    )

    assert cvar_95 <= var_95


def test_drawdown_is_non_positive():

    portfolio = portfolio_return_series(
        sample_returns(),
        [0.5, 0.5],
    )

    assert maximum_drawdown(
        portfolio
    ) <= 0


def test_risk_summary():

    summary = calculate_risk_summary(
        sample_returns(),
        [0.5, 0.5],
        risk_free_rate=0.04,
    )

    assert "var_95" in summary
    assert "cvar_95" in summary
    assert "max_drawdown" in summary
    assert "downside_deviation" in summary
    assert "sortino_ratio" in summary
    assert summary["observations"] == 8
