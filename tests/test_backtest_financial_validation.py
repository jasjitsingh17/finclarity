import numpy as np
import pandas as pd
import pytest

import backend.backtest_engine as engine


def make_prices():
    dates = pd.bdate_range("2025-01-01", periods=15)
    prices = pd.DataFrame(
        {
            "AAA": 100 * 1.10 ** np.arange(15),
            "BBB": np.full(15, 100.0),
        },
        index=dates,
    )
    benchmark = pd.Series(
        100 * 1.01 ** np.arange(15),
        index=dates,
    )
    return prices, benchmark


def fixed_optimizer(*args, **kwargs):
    return {"weights": [0.5, 0.5]}


def test_performance_metrics_reconcile():
    returns = pd.Series([0.02, -0.01, 0.03, 0.005])
    result = engine.calculate_performance_metrics(
        returns, risk_free_rate=0.04
    )

    wealth = (1 + returns).cumprod()
    expected_cumulative = wealth.iloc[-1] - 1
    expected_cagr = wealth.iloc[-1] ** (252 / len(returns)) - 1
    expected_vol = returns.std(ddof=1) * np.sqrt(252)
    expected_sharpe = (
        returns.mean() * 252 - 0.04
    ) / expected_vol

    assert result["cumulative_return"] == pytest.approx(expected_cumulative)
    assert result["cagr"] == pytest.approx(expected_cagr)
    assert result["annualised_volatility"] == pytest.approx(expected_vol)
    assert result["sharpe_ratio"] == pytest.approx(expected_sharpe)


def test_future_prices_do_not_change_earlier_allocations():
    prices, benchmark = make_prices()

    original = engine.run_walk_forward_backtest(
        prices, benchmark,
        training_days=3,
        rebalance_days=3,
    )

    modified = prices.copy()
    modified.iloc[10:, 0] *= 2

    changed = engine.run_walk_forward_backtest(
        modified, benchmark,
        training_days=3,
        rebalance_days=3,
    )

    assert (
        original["weight_history"][0]["weights"]
        == changed["weight_history"][0]["weights"]
    )

    assert (
        original["cumulative_series"][0]["strategy"]
        == pytest.approx(
            changed["cumulative_series"][0]["strategy"]
        )
    )


def test_weights_drift_between_rebalances(monkeypatch):
    monkeypatch.setattr(engine, "maximise_sharpe", fixed_optimizer)
    prices, benchmark = make_prices()

    result = engine.run_walk_forward_backtest(
        prices, benchmark,
        training_days=3,
        rebalance_days=3,
        transaction_cost_bps=0,
    )

    # Starting with 50% AAA and 50% BBB, AAA rises 10%
    # and BBB is unchanged. The portfolio must drift.
    first_day = 0.5 * 0.10
    weight_aaa_after_day = 0.55 / 1.05
    second_day = weight_aaa_after_day * 0.10

    expected_wealth = (1 + first_day) * (1 + second_day)

    actual_wealth = result["cumulative_series"][1]["strategy"]

    assert actual_wealth == pytest.approx(expected_wealth)


def test_transaction_cost_uses_pretrade_weights(monkeypatch):
    monkeypatch.setattr(engine, "maximise_sharpe", fixed_optimizer)
    prices, benchmark = make_prices()

    result = engine.run_walk_forward_backtest(
        prices, benchmark,
        training_days=3,
        rebalance_days=3,
        transaction_cost_bps=10,
    )

    # Even if target weights stay at 50/50, the holdings
    # drift as AAA rises. Returning to 50/50 requires
    # trading and should incur a positive transaction cost.
    second_rebalance = result["weight_history"][1]

    assert second_rebalance["turnover"] > 0
    assert second_rebalance["transaction_cost"] > 0

def test_transaction_cost_reduces_performance(monkeypatch):
    monkeypatch.setattr(engine, "maximise_sharpe", fixed_optimizer)
    prices, benchmark = make_prices()

    def run(cost):
        return engine.run_walk_forward_backtest(
            prices, benchmark,
            training_days=3,
            rebalance_days=3,
            transaction_cost_bps=cost,
        )

    free = run(0)
    paid = run(10)

    assert paid["weight_history"][1]["transaction_cost"] > 0
    assert (
        paid["strategy"]["cumulative_return"]
        < free["strategy"]["cumulative_return"]
    )
