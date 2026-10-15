from datetime import datetime, timezone
from threading import Lock
import time

import pandas as pd
import yfinance as yf


CACHE_SECONDS = 45

_cache_lock = Lock()

_cache = {
    "timestamp": 0.0,
    "data": None,
}


MARKET_UNIVERSES = {
    "US": {
        "country": "United States",
        "flag": "🇺🇸",
        "exchange": "US",
        "currency": "USD",
        "symbols": [
            ("AAPL", "Apple"),
            ("MSFT", "Microsoft"),
            ("NVDA", "NVIDIA"),
            ("META", "Meta Platforms"),
        ],
    },
    "UK": {
        "country": "United Kingdom",
        "flag": "🇬🇧",
        "exchange": "London",
        "currency": "GBP",
        "symbols": [
            ("RR.L", "Rolls-Royce"),
            ("SHEL.L", "Shell"),
            ("AZN.L", "AstraZeneca"),
            ("HSBA.L", "HSBC"),
        ],
    },
    "IN": {
        "country": "India",
        "flag": "🇮🇳",
        "exchange": "NSE",
        "currency": "INR",
        "symbols": [
            ("RELIANCE.NS", "Reliance"),
            ("TCS.NS", "TCS"),
            ("HDFCBANK.NS", "HDFC Bank"),
            ("INFY.NS", "Infosys"),
        ],
    },
    "DE": {
        "country": "Germany",
        "flag": "🇩🇪",
        "exchange": "Xetra",
        "currency": "EUR",
        "symbols": [
            ("SAP.DE", "SAP"),
            ("SIE.DE", "Siemens"),
            ("ALV.DE", "Allianz"),
            ("DTE.DE", "Deutsche Telekom"),
        ],
    },
    "FR": {
        "country": "France",
        "flag": "🇫🇷",
        "exchange": "Paris",
        "currency": "EUR",
        "symbols": [
            ("MC.PA", "LVMH"),
            ("OR.PA", "L'Oréal"),
            ("AIR.PA", "Airbus"),
            ("BNP.PA", "BNP Paribas"),
        ],
    },
    "JP": {
        "country": "Japan",
        "flag": "🇯🇵",
        "exchange": "Tokyo",
        "currency": "JPY",
        "symbols": [
            ("7203.T", "Toyota"),
            ("6758.T", "Sony"),
            ("9984.T", "SoftBank Group"),
            ("8306.T", "Mitsubishi UFJ"),
        ],
    },
    "HK": {
        "country": "Hong Kong",
        "flag": "🇭🇰",
        "exchange": "Hong Kong",
        "currency": "HKD",
        "symbols": [
            ("0700.HK", "Tencent"),
            ("9988.HK", "Alibaba"),
            ("0005.HK", "HSBC"),
            ("1299.HK", "AIA"),
        ],
    },
}


def rank_quotes(quotes, limit=3):
    usable = [
        quote
        for quote in quotes
        if quote.get("change_percent") is not None
    ]

    return sorted(
        usable,
        key=lambda item: item["change_percent"],
        reverse=True,
    )[:limit]


def _ticker_metadata():
    metadata = {}

    for market_code, market in MARKET_UNIVERSES.items():
        for ticker, company in market["symbols"]:
            metadata[ticker] = {
                "company": company,
                "market_code": market_code,
                "country": market["country"],
                "flag": market["flag"],
                "exchange": market["exchange"],
                "currency": market["currency"],
            }

    return metadata


def _extract_close_series(frame, ticker):
    if frame is None or frame.empty:
        return pd.Series(dtype=float)

    if isinstance(frame.columns, pd.MultiIndex):
        candidates = [
            ("Close", ticker),
            (ticker, "Close"),
        ]

        for candidate in candidates:
            if candidate in frame.columns:
                return frame[candidate].dropna().astype(float)

        try:
            if ticker in frame.columns.get_level_values(0):
                ticker_frame = frame[ticker]

                if "Close" in ticker_frame.columns:
                    return ticker_frame["Close"].dropna().astype(float)
        except Exception:
            pass

        try:
            if ticker in frame.columns.get_level_values(1):
                ticker_frame = frame.xs(
                    ticker,
                    axis=1,
                    level=1,
                )

                if "Close" in ticker_frame.columns:
                    return ticker_frame["Close"].dropna().astype(float)
        except Exception:
            pass

        return pd.Series(dtype=float)

    if "Close" in frame.columns:
        return frame["Close"].dropna().astype(float)

    return pd.Series(dtype=float)


def _download_batch(tickers):
    return yf.download(
        tickers=tickers,
        period="5d",
        interval="1d",
        auto_adjust=False,
        progress=False,
        threads=False,
        group_by="column",
        timeout=15,
    )


def _build_global_overview():
    metadata = _ticker_metadata()
    tickers = list(metadata.keys())

    quotes = []
    failures = []

    batch_size = 7

    for start in range(0, len(tickers), batch_size):
        batch = tickers[start : start + batch_size]

        try:
            frame = _download_batch(batch)
        except Exception as error:
            for ticker in batch:
                failures.append(
                    {
                        "ticker": ticker,
                        "market_code": metadata[ticker]["market_code"],
                        "error": str(error),
                    }
                )
            continue

        for ticker in batch:
            series = _extract_close_series(
                frame,
                ticker,
            )

            if len(series) < 2:
                failures.append(
                    {
                        "ticker": ticker,
                        "market_code": metadata[ticker]["market_code"],
                        "error": "Not enough price observations.",
                    }
                )
                continue

            previous_close = float(series.iloc[-2])
            price = float(series.iloc[-1])

            info = metadata[ticker]

            #
            # Yahoo commonly supplies London-listed
            # equities in GBp (pence). FinClarity
            # normalises them to GBP so all portfolio
            # and market displays use standard pounds.
            #
            if info["market_code"] == "UK":
                previous_close /= 100.0
                price /= 100.0

            if previous_close == 0:
                change = 0.0
                change_percent = 0.0
            else:
                change = price - previous_close
                change_percent = (
                    change
                    / previous_close
                    * 100
                )

            try:
                market_time = pd.Timestamp(
                    series.index[-1]
                ).isoformat()
            except Exception:
                market_time = None

            quotes.append(
                {
                    "ticker": ticker,
                    "company": info["company"],
                    "market_code": info["market_code"],
                    "country": info["country"],
                    "flag": info["flag"],
                    "exchange": info["exchange"],
                    "price": price,
                    "previous_close": previous_close,
                    "change": float(change),
                    "change_percent": float(change_percent),
                    "currency": info["currency"],
                    "market_time": market_time,
                }
            )

    markets = []

    for market_code, market in MARKET_UNIVERSES.items():
        market_quotes = [
            quote
            for quote in quotes
            if quote["market_code"] == market_code
        ]

        markets.append(
            {
                "market_code": market_code,
                "country": market["country"],
                "flag": market["flag"],
                "exchange": market["exchange"],
                "leaders": rank_quotes(
                    market_quotes,
                    limit=3,
                ),
                "quote_count": len(
                    market_quotes
                ),
            }
        )

    global_leaders = rank_quotes(
        quotes,
        limit=14,
    )

    return {
        "status": (
            "live"
            if not failures
            else "partial"
        ),
        "generated_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "refresh_seconds": 60,
        "quote_count": len(quotes),
        "tracked_count": len(tickers),
        "global_leaders": global_leaders,
        "markets": markets,
        "failures": failures,
        "methodology": {
            "universe": (
                "Curated liquid large-cap equities "
                "across selected global markets"
            ),
            "ranking": (
                "Latest available percentage change "
                "versus previous trading-session close"
            ),
            "data_source": (
                "Yahoo Finance market data through yfinance"
            ),
            "timing": (
                "Live or near-real-time where available. "
                "Quotes may be delayed, and closed markets "
                "show their latest available session."
            ),
            "not_exchange_feed": True,
        },
    }


def get_global_market_overview():
    now = time.time()

    with _cache_lock:
        cached_data = _cache["data"]
        cached_timestamp = _cache["timestamp"]

        if (
            cached_data
            and now - cached_timestamp
            < CACHE_SECONDS
        ):
            return cached_data

    data = _build_global_overview()

    with _cache_lock:
        _cache["timestamp"] = now
        _cache["data"] = data

    return data
