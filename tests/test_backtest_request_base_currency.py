from backend.schemas import BacktestRequest


def test_backtest_request_exposes_base_currency():
    assert "base_currency" in BacktestRequest.model_fields

    field = BacktestRequest.model_fields[
        "base_currency"
    ]

    assert field.default == "USD"


def test_backtest_request_can_hold_currency_override():
    request = BacktestRequest.model_construct(
        base_currency="GBP",
    )

    assert request.base_currency == "GBP"
