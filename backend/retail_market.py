from __future__ import annotations

from datetime import datetime, timezone
import json
import math
import time

import numpy as np
import pandas as pd
import yfinance as yf
from pydantic import BaseModel, Field


from backend.fx_service import (
    get_fx_quote,
)


CACHE_SECONDS = 60

_cache = {
    "key": None,
    "timestamp": 0.0,
    "data": None,
}


class RetailHoldingInput(BaseModel):

    ticker: str

    quantity: float = Field(
        gt=0
    )

    average_cost: float | None = Field(
        default=None,
        ge=0
    )

    currency: str = "GBP"

    name: str | None = None


class RetailMarketRequest(BaseModel):

    holdings: list[RetailHoldingInput]

    display_currency: str = "GBP"

    lookback_days: int = Field(
        default=252,
        ge=63,
        le=756,
    )


def normalise_london_price(
    ticker,
    value,
):

    number = float(value)

    if (
        str(ticker)
        .upper()
        .endswith(".L")
    ):

        return number / 100.0

    return number


def _safe_float(
    value,
):

    try:

        number = float(value)

    except (
        TypeError,
        ValueError,
    ):

        return None


    if not math.isfinite(
        number
    ):

        return None


    return number


def _download_close_series(
    ticker,
    period="1y",
):

    frame = yf.download(
        ticker,
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        threads=False,
        timeout=10,
    )


    if (
        frame is None
        or frame.empty
    ):

        raise ValueError(
            f"No market data returned for {ticker}."
        )


    if (
        isinstance(
            frame.columns,
            pd.MultiIndex,
        )
    ):

        if (
            "Close"
            not in frame.columns
            .get_level_values(0)
        ):

            raise ValueError(
                f"No closing prices returned for {ticker}."
            )


        close = frame["Close"]


        if isinstance(
            close,
            pd.DataFrame,
        ):

            if ticker in close.columns:

                series = close[ticker]

            else:

                series = close.iloc[:, 0]

        else:

            series = close

    else:

        if "Close" not in frame.columns:

            raise ValueError(
                f"No closing prices returned for {ticker}."
            )

        series = frame["Close"]


    series = (
        pd.to_numeric(
            series,
            errors="coerce",
        )
        .dropna()
    )


    if series.empty:

        raise ValueError(
            f"No valid closing prices returned for {ticker}."
        )


    return series


def _latest_fx_quote(
    source_currency,
    destination_currency,
):

    try:

        return get_fx_quote(
            source_currency,
            destination_currency,
        )

    except Exception:

        return None


def _latest_fx_rate(
    source_currency,
    destination_currency,
):

    quote = _latest_fx_quote(
        source_currency,
        destination_currency,
    )


    if quote is None:

        return None


    return quote[
        "rate"
    ]


def _annualised_volatility(
    series,
):

    returns = (
        series
        .pct_change()
        .dropna()
    )


    if len(returns) < 20:

        return None


    value = (
        returns.std()
        * np.sqrt(252)
    )


    return _safe_float(
        value
    )


def _period_for_days(
    lookback_days,
):

    if lookback_days <= 252:
        return "1y"

    if lookback_days <= 504:
        return "2y"

    return "3y"


def _request_payload(
    request,
):

    if hasattr(
        request,
        "model_dump",
    ):

        return request.model_dump()

    return request.dict()


def _cache_key(
    request,
):

    return json.dumps(
        _request_payload(
            request
        ),
        sort_keys=True,
    )


def build_retail_market_snapshot(
    request: RetailMarketRequest,
):

    if not request.holdings:

        raise ValueError(
            "At least one retail holding is required."
        )


    key = _cache_key(
        request
    )


    now = time.time()


    if (
        _cache["key"] == key
        and _cache["data"] is not None
        and (
            now
            - _cache["timestamp"]
        ) < CACHE_SECONDS
    ):

        return _cache["data"]


    display_currency = (
        request.display_currency
        .strip()
        .upper()
    )


    period = _period_for_days(
        request.lookback_days
    )


    holdings = []


    for input_holding in request.holdings:

        ticker = (
            input_holding.ticker
            .strip()
            .upper()
        )


        currency = (
            input_holding.currency
            .strip()
            .upper()
        )


        quantity = float(
            input_holding.quantity
        )


        base = {
            "ticker": ticker,
            "name": (
                input_holding.name
                or ticker
            ),
            "quantity": quantity,
            "currency": currency,
            "display_currency": display_currency,
        }


        try:

            series = (
                _download_close_series(
                    ticker,
                    period=period,
                )
            )


            if len(series) < 2:

                raise ValueError(
                    "At least two prices are required."
                )


            raw_price = float(
                series.iloc[-1]
            )

            raw_previous = float(
                series.iloc[-2]
            )


            price = normalise_london_price(
                ticker,
                raw_price,
            )

            previous_close = (
                normalise_london_price(
                    ticker,
                    raw_previous,
                )
            )


            change = (
                price
                - previous_close
            )


            change_percent = (
                change
                / previous_close
                * 100
                if previous_close
                else 0.0
            )


            volatility = (
                _annualised_volatility(
                    series
                )
            )


            fx_quote = (
                _latest_fx_quote(
                    currency,
                    display_currency,
                )
            )


            fx_rate = (
                fx_quote["rate"]
                if fx_quote is not None
                else None
            )


            market_value_native = (
                quantity
                * price
            )


            market_value_display = (
                market_value_native
                * fx_rate
                if fx_rate is not None
                else None
            )


            day_change_native = (
                quantity
                * change
            )


            day_change_display = (
                day_change_native
                * fx_rate
                if fx_rate is not None
                else None
            )


            average_cost = (
                _safe_float(
                    input_holding
                    .average_cost
                )
            )


            cost_basis_native = (
                quantity
                * average_cost
                if average_cost is not None
                else None
            )


            cost_basis_display = (
                cost_basis_native
                * fx_rate
                if (
                    cost_basis_native
                    is not None
                    and fx_rate
                    is not None
                )
                else None
            )


            pnl_display = (
                market_value_display
                - cost_basis_display
                if (
                    market_value_display
                    is not None
                    and cost_basis_display
                    is not None
                )
                else None
            )


            pnl_percent = (
                (
                    pnl_display
                    / cost_basis_display
                    * 100
                )
                if (
                    pnl_display
                    is not None
                    and cost_basis_display
                    not in (
                        None,
                        0,
                    )
                )
                else None
            )


            latest_index = (
                pd.Timestamp(
                    series.index[-1]
                )
            )


            holdings.append(
                {
                    **base,

                    "status":
                        "live",

                    "price":
                        price,

                    "previous_close":
                        previous_close,

                    "change":
                        change,

                    "change_percent":
                        change_percent,

                    "annualised_volatility":
                        volatility,

                    "fx_rate":
                        fx_rate,

                    "fx_quote":
                        fx_quote,

                    "market_value_native":
                        market_value_native,

                    "market_value_display":
                        market_value_display,

                    "day_change_display":
                        day_change_display,

                    "average_cost":
                        average_cost,

                    "cost_basis_native":
                        cost_basis_native,

                    "cost_basis_display":
                        cost_basis_display,

                    "pnl_display":
                        pnl_display,

                    "pnl_percent":
                        pnl_percent,

                    "market_date":
                        latest_index
                        .date()
                        .isoformat(),
                }
            )


        except Exception as error:

            holdings.append(
                {
                    **base,

                    "status":
                        "unavailable",

                    "error":
                        str(error),

                    "price":
                        None,

                    "previous_close":
                        None,

                    "change":
                        None,

                    "change_percent":
                        None,

                    "annualised_volatility":
                        None,

                    "fx_rate":
                        None,

                    "fx_quote":
                        None,

                    "market_value_native":
                        None,

                    "market_value_display":
                        None,

                    "day_change_display":
                        None,

                    "average_cost":
                        input_holding
                        .average_cost,

                    "cost_basis_native":
                        None,

                    "cost_basis_display":
                        None,

                    "pnl_display":
                        None,

                    "pnl_percent":
                        None,

                    "market_date":
                        None,
                }
            )


    live = [
        holding
        for holding in holdings
        if holding[
            "status"
        ] == "live"
    ]


    converted = [
        holding
        for holding in live
        if holding[
            "market_value_display"
        ] is not None
    ]


    fx_complete = (
        len(converted)
        == len(holdings)
    )


    total_market_value = (
        sum(
            holding[
                "market_value_display"
            ]
            for holding in converted
        )
        if converted
        else None
    )


    converted_day_changes = [
        holding[
            "day_change_display"
        ]
        for holding in converted
        if holding[
            "day_change_display"
        ] is not None
    ]


    total_day_change = (
        sum(
            converted_day_changes
        )
        if converted_day_changes
        else None
    )


    previous_total = (
        total_market_value
        - total_day_change
        if (
            total_market_value
            is not None
            and total_day_change
            is not None
        )
        else None
    )


    total_day_change_percent = (
        (
            total_day_change
            / previous_total
            * 100
        )
        if (
            total_day_change is not None
            and previous_total
            not in (
                None,
                0,
            )
        )
        else None
    )


    cost_values = [
        holding[
            "cost_basis_display"
        ]
        for holding in converted
        if holding[
            "cost_basis_display"
        ] is not None
    ]


    total_cost_basis = (
        sum(
            cost_values
        )
        if (
            cost_values
            and len(cost_values)
            == len(converted)
        )
        else None
    )


    total_pnl = (
        total_market_value
        - total_cost_basis
        if (
            total_market_value
            is not None
            and total_cost_basis
            is not None
        )
        else None
    )


    total_pnl_percent = (
        (
            total_pnl
            / total_cost_basis
            * 100
        )
        if (
            total_pnl is not None
            and total_cost_basis
            not in (
                None,
                0,
            )
        )
        else None
    )


    #
    # Weight using display-currency market values.
    #
    if (
        total_market_value
        not in (
            None,
            0,
        )
    ):

        for holding in holdings:

            value = holding.get(
                "market_value_display"
            )


            holding[
                "weight"
            ] = (
                value
                / total_market_value
                if value is not None
                else None
            )

    else:

        native_currencies = {
            holding[
                "currency"
            ]
            for holding in live
        }


        native_values = [
            holding[
                "market_value_native"
            ]
            for holding in live
            if holding[
                "market_value_native"
            ] is not None
        ]


        native_total = (
            sum(
                native_values
            )
            if native_values
            else None
        )


        for holding in holdings:

            value = holding.get(
                "market_value_native"
            )


            holding[
                "weight"
            ] = (
                value
                / native_total
                if (
                    len(
                        native_currencies
                    ) == 1
                    and native_total
                    not in (
                        None,
                        0,
                    )
                    and value is not None
                )
                else None
            )


    weights_available = (
        bool(holdings)
        and all(
            holding.get(
                "weight"
            ) is not None
            for holding in holdings
        )
    )


    fx_quotes = []


    seen_fx_pairs = set()


    for holding in holdings:

        quote = holding.get(
            "fx_quote"
        )


        if (
            not quote
            or quote.get(
                "is_identity"
            )
        ):

            continue


        pair = quote.get(
            "pair"
        )


        if (
            pair
            and pair
            not in seen_fx_pairs
        ):

            seen_fx_pairs.add(
                pair
            )

            fx_quotes.append(
                quote
            )


    result = {

        "status": (
            "live"
            if len(live)
            == len(holdings)
            else "partial"
        ),

        "generated_at":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "display_currency":
            display_currency,

        "holding_count":
            len(holdings),

        "live_count":
            len(live),

        "fx_complete":
            fx_complete,

        "fx_quotes":
            fx_quotes,

        "fx_provider":
            (
                "Yahoo Finance"
                if fx_quotes
                else "Identity"
            ),

        "weights_available":
            weights_available,

        "total_market_value":
            total_market_value,

        "total_day_change":
            total_day_change,

        "total_day_change_percent":
            total_day_change_percent,

        "total_cost_basis":
            total_cost_basis,

        "total_pnl":
            total_pnl,

        "total_pnl_percent":
            total_pnl_percent,

        "holdings":
            holdings,
    }


    _cache["key"] = key
    _cache["timestamp"] = now
    _cache["data"] = result


    return result
