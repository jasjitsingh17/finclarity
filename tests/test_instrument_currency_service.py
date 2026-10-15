from backend import (
    instrument_currency_service
    as service,
)


class FakeFastInfo:

    def __init__(
        self,
        currency=None,
    ):
        self.currency = (
            currency
        )


    def get(
        self,
        key,
        default=None,
    ):
        if (
            key
            == "currency"
        ):
            return (
                self.currency
                or default
            )

        return default


class FakeTicker:

    def __init__(
        self,
        *,
        fast_currency=None,
        info_currency=None,
        fast_raises=False,
        info_raises=False,
    ):
        self._fast_currency = (
            fast_currency
        )

        self._info_currency = (
            info_currency
        )

        self._fast_raises = (
            fast_raises
        )

        self._info_raises = (
            info_raises
        )


    @property
    def fast_info(
        self,
    ):
        if self._fast_raises:

            raise RuntimeError(
                "fast_info unavailable"
            )


        return FakeFastInfo(
            self._fast_currency
        )


    @property
    def info(
        self,
    ):
        if self._info_raises:

            raise RuntimeError(
                "info unavailable"
            )


        return {
            "currency":
                self._info_currency
        }


def clear_cache():

    service.resolve_trading_currency.cache_clear()


def test_fast_info_currency_used_first(
    monkeypatch,
):

    clear_cache()


    monkeypatch.setattr(
        service.yf,
        "Ticker",
        lambda ticker:
            FakeTicker(
                fast_currency="USD",
                info_currency="EUR",
            ),
    )


    result = (
        service.resolve_trading_currency(
            "aapl"
        )
    )


    assert (
        result[
            "ticker"
        ]
        == "AAPL"
    )

    assert (
        result[
            "currency"
        ]
        == "USD"
    )

    assert (
        result[
            "source"
        ]
        == "yahoo_fast_info"
    )


def test_info_is_fallback(
    monkeypatch,
):

    clear_cache()


    monkeypatch.setattr(
        service.yf,
        "Ticker",
        lambda ticker:
            FakeTicker(
                fast_currency=None,
                info_currency="EUR",
            ),
    )


    result = (
        service.resolve_trading_currency(
            "sap.de"
        )
    )


    assert (
        result[
            "currency"
        ]
        == "EUR"
    )

    assert (
        result[
            "source"
        ]
        == "yahoo_info"
    )


def test_fast_info_error_falls_back(
    monkeypatch,
):

    clear_cache()


    monkeypatch.setattr(
        service.yf,
        "Ticker",
        lambda ticker:
            FakeTicker(
                fast_raises=True,
                info_currency="USD",
            ),
    )


    result = (
        service.resolve_trading_currency(
            "AAPL"
        )
    )


    assert (
        result[
            "status"
        ]
        == "available"
    )

    assert (
        result[
            "currency"
        ]
        == "USD"
    )


def test_gbpence_normalisation(
    monkeypatch,
):

    clear_cache()


    monkeypatch.setattr(
        service.yf,
        "Ticker",
        lambda ticker:
            FakeTicker(
                fast_currency="GBp",
            ),
    )


    result = (
        service.resolve_trading_currency(
            "VOD.L"
        )
    )


    assert (
        result[
            "currency"
        ]
        == "GBP"
    )

    assert (
        result[
            "raw_currency"
        ]
        == "GBp"
    )

    assert (
        result[
            "price_scale"
        ]
        == 0.01
    )


def test_gbx_normalisation(
    monkeypatch,
):

    clear_cache()


    monkeypatch.setattr(
        service.yf,
        "Ticker",
        lambda ticker:
            FakeTicker(
                fast_currency="GBX",
            ),
    )


    result = (
        service.resolve_trading_currency(
            "TEST.L"
        )
    )


    assert (
        result[
            "currency"
        ]
        == "GBP"
    )

    assert (
        result[
            "price_scale"
        ]
        == 0.01
    )


def test_plain_gbp_is_not_scaled(
    monkeypatch,
):

    clear_cache()


    monkeypatch.setattr(
        service.yf,
        "Ticker",
        lambda ticker:
            FakeTicker(
                fast_currency="GBP",
            ),
    )


    result = (
        service.resolve_trading_currency(
            "TEST.L"
        )
    )


    assert (
        result[
            "currency"
        ]
        == "GBP"
    )

    assert (
        result[
            "price_scale"
        ]
        == 1.0
    )


def test_missing_currency_is_explicit(
    monkeypatch,
):

    clear_cache()


    monkeypatch.setattr(
        service.yf,
        "Ticker",
        lambda ticker:
            FakeTicker(),
    )


    result = (
        service.resolve_trading_currency(
            "UNKNOWN"
        )
    )


    assert (
        result[
            "status"
        ]
        == "unavailable"
    )

    assert (
        result[
            "currency"
        ]
        is None
    )

    assert (
        result[
            "error"
        ]
    )


def test_currency_map_deduplicates(
    monkeypatch,
):

    clear_cache()


    calls = []


    def fake_ticker(
        ticker,
    ):

        calls.append(
            ticker
        )

        return FakeTicker(
            fast_currency="USD",
        )


    monkeypatch.setattr(
        service.yf,
        "Ticker",
        fake_ticker,
    )


    result = (
        service.resolve_currency_map(
            [
                "AAPL",
                "aapl",
                "MSFT",
            ]
        )
    )


    assert set(
        result.keys()
    ) == {
        "AAPL",
        "MSFT",
    }


    assert len(
        calls
    ) == 2
