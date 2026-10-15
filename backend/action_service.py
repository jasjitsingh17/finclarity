def _safe_float(
    value,
):
    try:
        number = float(
            value
        )

        if number != number:
            return None

        return number

    except (
        TypeError,
        ValueError,
    ):
        return None


def _percent_text(
    value,
    digits=1,
):
    number = _safe_float(
        value
    )

    if number is None:
        return "Unavailable"

    return (
        f"{number * 100:.{digits}f}%"
    )


def _number_text(
    value,
    digits=2,
):
    number = _safe_float(
        value
    )

    if number is None:
        return "Unavailable"

    return (
        f"{number:.{digits}f}"
    )


def _currency_amount_text(
    currency,
    value,
):
    number = _safe_float(
        value
    )

    if number is None:
        return "Unavailable"


    code = str(
        currency
        or ""
    ).upper()


    symbols = {
        "GBP": "£",
        "USD": "$",
        "EUR": "€",
        "JPY": "¥",
    }


    symbol = symbols.get(
        code
    )


    sign = (
        "−"
        if number < 0
        else ""
    )


    if symbol:

        return (
            f"{sign}{symbol}"
            f"{abs(number):,.0f}"
        )


    return (
        f"{code} "
        f"{number:,.0f}"
    )


def _metric(
    label,
    value,
    display,
):
    return {
        "label":
            label,

        "value":
            value,

        "display":
            display,
    }


def _add_item(
    items,
    *,
    item_id,
    score,
    priority,
    tone,
    category,
    title,
    summary,
    review_prompt,
    evidence=None,
):
    items.append(
        {
            "id":
                item_id,

            "score":
                float(
                    score
                ),

            "priority":
                priority,

            "tone":
                tone,

            "category":
                category,

            "title":
                title,

            "summary":
                summary,

            "review_prompt":
                review_prompt,

            "evidence":
                evidence
                or [],
        }
    )


def _find_stress_period(
    stress,
    window_days,
):
    scenarios = (
        stress.get(
            "historical_scenarios",
            []
        )
        if isinstance(
            stress,
            dict,
        )
        else []
    )


    for scenario in scenarios:

        if (
            scenario.get(
                "window_days"
            )
            == window_days
        ):
            return scenario


    return None


def _sentiment_rows(
    sentiment,
):
    if not isinstance(
        sentiment,
        dict,
    ):
        return []


    for key in (
        "ticker_sentiment",
        "ticker_results",
        "holdings",
        "per_ticker",
    ):

        value = sentiment.get(
            key
        )


        if isinstance(
            value,
            list,
        ):
            return value


        if isinstance(
            value,
            dict,
        ):
            rows = []

            for (
                ticker,
                data,
            ) in value.items():

                if isinstance(
                    data,
                    dict,
                ):

                    rows.append(
                        {
                            "ticker":
                                ticker,

                            **data,
                        }
                    )

            return rows


    return []


def build_action_centre(
    *,
    exposure=None,
    diversification=None,
    stress=None,
    performance=None,
    sentiment=None,
    portfolio_value=None,
    currency="GBP",
    max_items=6,
):
    """
    Synthesise existing FinClarity analytics into
    ranked decision-support observations.

    This engine does not produce buy/sell
    recommendations or forecast future returns.
    """

    items = []


    exposure = (
        exposure
        if isinstance(
            exposure,
            dict,
        )
        else {}
    )


    diversification = (
        diversification
        if isinstance(
            diversification,
            dict,
        )
        else {}
    )


    stress = (
        stress
        if isinstance(
            stress,
            dict,
        )
        else {}
    )


    performance = (
        performance
        if isinstance(
            performance,
            dict,
        )
        else {}
    )


    # ======================================================
    # HISTORICAL DATA-COVERAGE POLICY
    # ======================================================
    #
    # Action Centre is an executive synthesis layer.
    # Historical analytics calculated on a renormalised
    # subset of the requested portfolio must remain visible
    # in source analytics, but must not generate confident
    # ranked observations here.
    # ======================================================

    performance_coverage = (
        performance.get(
            "data_coverage",
            {},
        )
        if isinstance(
            performance,
            dict,
        )
        else {}
    )


    performance_weight_coverage = (
        _safe_float(
            performance_coverage.get(
                "weight_coverage"
            )
        )
    )


    performance_partial = (
        bool(
            performance.get(
                "missing_tickers"
            )
        )
        or bool(
            performance_coverage.get(
                "excluded_tickers"
            )
        )
        or (
            performance_coverage.get(
                "weights_renormalised"
            )
            is True
        )
        or (
            performance_weight_coverage
            is not None
            and performance_weight_coverage
            < 0.999999
        )
        or (
            performance.get(
                "benchmark_available"
            )
            is False
        )
    )


    diversification_partial = (
        bool(
            diversification.get(
                "missing_tickers"
            )
        )
    )


    stress_partial = (
        bool(
            stress.get(
                "missing_tickers"
            )
        )
    )


    historical_ranking_eligibility = {

        "performance":
            (
                "unavailable"
                if not performance
                else (
                    "partial_excluded"
                    if performance_partial
                    else "eligible"
                )
            ),

        "diversification":
            (
                "unavailable"
                if not diversification
                else (
                    "partial_excluded"
                    if diversification_partial
                    else "eligible"
                )
            ),

        "stress":
            (
                "unavailable"
                if not stress
                else (
                    "partial_excluded"
                    if stress_partial
                    else "eligible"
                )
            ),
    }


    # Preserve the original module payloads in
    # source_analytics at the API layer, but remove partial
    # historical modules from this ranking calculation.

    if performance_partial:
        performance = {}


    if diversification_partial:
        diversification = {}


    if stress_partial:
        stress = {}


    # ======================================================
    # EXPOSURE / CONCENTRATION
    # ======================================================

    concentration = (
        exposure.get(
            "concentration",
            {}
        )
        or {}
    )


    largest_sector = (
        concentration.get(
            "largest_sector"
        )
        or {}
    )


    sector_name = (
        largest_sector.get(
            "name"
        )
    )


    sector_weight = (
        _safe_float(
            largest_sector.get(
                "weight"
            )
        )
    )


    if (
        sector_name
        and sector_name
        != "Unavailable"
        and sector_weight
        is not None
        and sector_weight
        >= 0.50
    ):

        if sector_weight >= 0.65:

            priority = "high"
            score = 98

        else:

            priority = "medium"
            score = 84


        _add_item(
            items,

            item_id=
                "sector-concentration",

            score=
                score,

            priority=
                priority,

            tone=
                "warning",

            category=
                "Exposure",

            title=
                f"High exposure to {sector_name}",

            summary=
                (
                    f"{sector_name} represents "
                    f"{_percent_text(sector_weight)} "
                    "of current portfolio weight."
                ),

            review_prompt=
                (
                    "Review whether this level of sector "
                    "concentration matches the portfolio's "
                    "intended risk profile."
                ),

            evidence=[
                _metric(
                    "Sector weight",
                    sector_weight,
                    _percent_text(
                        sector_weight
                    ),
                ),
            ],
        )


    largest_holding = (
        concentration.get(
            "largest_holding"
        )
        or {}
    )


    largest_ticker = (
        largest_holding.get(
            "ticker"
        )
    )


    largest_weight = (
        _safe_float(
            largest_holding.get(
                "weight"
            )
        )
    )


    if (
        largest_ticker
        and largest_weight
        is not None
        and largest_weight
        >= 0.35
    ):

        _add_item(
            items,

            item_id=
                "single-name-concentration",

            score=
                87
                if largest_weight
                < 0.50
                else 94,

            priority=
                "medium"
                if largest_weight
                < 0.50
                else "high",

            tone=
                "warning",

            category=
                "Exposure",

            title=
                (
                    f"{largest_ticker} is a large "
                    "single-name exposure"
                ),

            summary=
                (
                    f"{largest_ticker} represents "
                    f"{_percent_text(largest_weight)} "
                    "of the portfolio."
                ),

            review_prompt=
                (
                    "Check whether one company's price "
                    "movement has more influence on total "
                    "portfolio outcomes than intended."
                ),

            evidence=[
                _metric(
                    "Portfolio weight",
                    largest_weight,
                    _percent_text(
                        largest_weight
                    ),
                ),
            ],
        )


    top_two = (
        _safe_float(
            concentration.get(
                "top_two_weight"
            )
        )
    )


    if (
        top_two
        is not None
        and top_two >= 0.75
        and (
            largest_weight
            is None
            or largest_weight < 0.35
        )
    ):

        _add_item(
            items,

            item_id=
                "top-two-concentration",

            score=
                80,

            priority=
                "medium",

            tone=
                "warning",

            category=
                "Exposure",

            title=
                "Two holdings dominate portfolio weight",

            summary=
                (
                    "The two largest positions account for "
                    f"{_percent_text(top_two)} "
                    "of the portfolio."
                ),

            review_prompt=
                (
                    "Review whether the portfolio is as "
                    "diversified at the position level as "
                    "the number of holdings suggests."
                ),

            evidence=[
                _metric(
                    "Top-two weight",
                    top_two,
                    _percent_text(
                        top_two
                    ),
                ),
            ],
        )


    # ======================================================
    # DIVERSIFICATION
    # ======================================================

    diversification_score = (
        _safe_float(
            diversification.get(
                "diversification_score"
            )
        )
    )


    average_correlation = (
        _safe_float(
            diversification.get(
                "weighted_average_correlation"
            )
        )
    )


    effective_holdings = (
        _safe_float(
            diversification.get(
                "effective_holdings"
            )
        )
    )


    if diversification_score is not None:

        if diversification_score < 50:

            _add_item(
                items,

                item_id=
                    "limited-diversification",

                score=
                    93,

                priority=
                    "high",

                tone=
                    "warning",

                category=
                    "Diversification",

                title=
                    "Portfolio diversification is limited",

                summary=
                    (
                        "The current diversification score "
                        f"is {diversification_score:.0f}/100."
                    ),

                review_prompt=
                    (
                        "Review position concentration and "
                        "historical correlations to understand "
                        "which holdings are providing limited "
                        "incremental diversification."
                    ),

                evidence=[
                    _metric(
                        "Diversification score",
                        diversification_score,
                        f"{diversification_score:.0f}/100",
                    ),

                    _metric(
                        "Average correlation",
                        average_correlation,
                        _number_text(
                            average_correlation
                        ),
                    ),
                ],
            )

        elif diversification_score < 65:

            _add_item(
                items,

                item_id=
                    "moderate-diversification",

                score=
                    76,

                priority=
                    "medium",

                tone=
                    "warning",

                category=
                    "Diversification",

                title=
                    "Diversification could be stronger",

                summary=
                    (
                        "The current diversification score "
                        f"is {diversification_score:.0f}/100."
                    ),

                review_prompt=
                    (
                        "Review whether correlated holdings "
                        "or uneven position sizes are reducing "
                        "effective diversification."
                    ),

                evidence=[
                    _metric(
                        "Diversification score",
                        diversification_score,
                        f"{diversification_score:.0f}/100",
                    ),

                    _metric(
                        "Effective holdings",
                        effective_holdings,
                        _number_text(
                            effective_holdings
                        ),
                    ),
                ],
            )


    # ======================================================
    # POSITIVE DIVERSIFICATION CONTEXT
    # ======================================================

    if (
        diversification_score
        is not None
        and diversification_score >= 65
        and effective_holdings
        is not None
        and average_correlation
        is not None
        and average_correlation <= 0.60
    ):

        _add_item(
            items,

            item_id=
                "diversification-context",

            score=
                58,

            priority=
                "context",

            tone=
                "positive",

            category=
                "Diversification",

            title=
                (
                    "Holdings provide useful "
                    "correlation diversification"
                ),

            summary=
                (
                    "Although portfolio concentration remains "
                    "important, the holdings have not historically "
                    "moved perfectly together. The diversification "
                    f"score is {diversification_score:.0f}/100 "
                    f"with {effective_holdings:.2f} effective "
                    "holdings."
                ),

            review_prompt=
                (
                    "Consider both exposure concentration and "
                    "historical co-movement when assessing "
                    "portfolio diversification."
                ),

            evidence=[
                _metric(
                    "Diversification score",
                    diversification_score,
                    f"{diversification_score:.0f}/100",
                ),

                _metric(
                    "Effective holdings",
                    effective_holdings,
                    f"{effective_holdings:.2f}",
                ),

                _metric(
                    "Average correlation",
                    average_correlation,
                    f"{average_correlation:.2f}",
                ),
            ],
        )


    # ======================================================
    # HISTORICAL STRESS
    # ======================================================

    worst_month = (
        _find_stress_period(
            stress,
            21,
        )
    )


    if worst_month:

        month_return = (
            _safe_float(
                worst_month.get(
                    "portfolio_return"
                )
            )
        )


        if (
            month_return
            is not None
            and month_return <= -0.12
        ):

            priority = (
                "high"
                if month_return <= -0.20
                else "medium"
            )


            score = (
                96
                if month_return <= -0.20
                else 88
            )


            evidence = [
                _metric(
                    "Worst 21-day return",
                    month_return,
                    _percent_text(
                        month_return
                    ),
                ),
            ]


            portfolio_number = (
                _safe_float(
                    portfolio_value
                )
            )


            if (
                portfolio_number
                is not None
            ):

                estimated_loss = (
                    portfolio_number
                    * month_return
                )


                evidence.append(
                    _metric(
                        "Current-value equivalent",
                        estimated_loss,
                        _currency_amount_text(
                            currency,
                            estimated_loss,
                        ),
                    )
                )


            _add_item(
                items,

                item_id=
                    "historical-stress",

                score=
                    score,

                priority=
                    priority,

                tone=
                    "negative",

                category=
                    "Stress",

                title=
                    "Historical downside has been material",

                summary=
                    (
                        "Using today's portfolio weights, "
                        "the worst observed 21-trading-day "
                        "period produced a simulated return of "
                        f"{_percent_text(month_return)}."
                    ),

                review_prompt=
                    (
                        "Consider whether a drawdown of this "
                        "magnitude would be consistent with the "
                        "portfolio's intended risk tolerance."
                    ),

                evidence=
                    evidence,
            )


    # ======================================================
    # PERFORMANCE VS BENCHMARK
    # ======================================================

    portfolio_metrics = (
        performance.get(
            "portfolio",
            {}
        )
        or {}
    )


    benchmark_metrics = (
        performance.get(
            "benchmark_metrics",
            {}
        )
        or {}
    )


    relative = (
        performance.get(
            "relative",
            {}
        )
        or {}
    )


    benchmark_name = (
        performance.get(
            "benchmark",
            "benchmark"
        )
    )


    portfolio_vol = (
        _safe_float(
            portfolio_metrics.get(
                "annualised_volatility"
            )
        )
    )


    benchmark_vol = (
        _safe_float(
            benchmark_metrics.get(
                "annualised_volatility"
            )
        )
    )


    portfolio_drawdown = (
        _safe_float(
            portfolio_metrics.get(
                "max_drawdown"
            )
        )
    )


    benchmark_drawdown = (
        _safe_float(
            benchmark_metrics.get(
                "max_drawdown"
            )
        )
    )


    outperformance = (
        _safe_float(
            relative.get(
                "cumulative_return_difference"
            )
        )
    )


    beta = (
        _safe_float(
            relative.get(
                "beta"
            )
        )
    )


    if (
        portfolio_drawdown
        is not None
        and benchmark_drawdown
        is not None
        and (
            portfolio_drawdown
            < benchmark_drawdown
            - 0.05
        )
    ):

        _add_item(
            items,

            item_id=
                "benchmark-drawdown-gap",

            score=
                86,

            priority=
                "medium",

            tone=
                "warning",

            category=
                "Performance",

            title=
                (
                    f"Drawdowns have been deeper than "
                    f"{benchmark_name}"
                ),

            summary=
                (
                    "The simulated portfolio's maximum "
                    f"drawdown was {_percent_text(portfolio_drawdown)} "
                    f"versus {_percent_text(benchmark_drawdown)} "
                    f"for {benchmark_name}."
                ),

            review_prompt=
                (
                    "Review whether the additional downside "
                    "variation is consistent with the return "
                    "profile being targeted."
                ),

            evidence=[
                _metric(
                    "Portfolio drawdown",
                    portfolio_drawdown,
                    _percent_text(
                        portfolio_drawdown
                    ),
                ),

                _metric(
                    f"{benchmark_name} drawdown",
                    benchmark_drawdown,
                    _percent_text(
                        benchmark_drawdown
                    ),
                ),
            ],
        )


    if (
        portfolio_vol
        is not None
        and benchmark_vol
        is not None
        and benchmark_vol > 0
        and portfolio_vol
        >= benchmark_vol * 1.20
    ):

        if (
            outperformance
            is not None
            and outperformance > 0
        ):

            title = (
                "Historical outperformance came with "
                "higher volatility"
            )

            tone = "context"
            priority = "context"
            score = 70

        else:

            title = (
                "Portfolio volatility exceeded "
                "the benchmark without outperformance"
            )

            tone = "warning"
            priority = "high"
            score = 92


        _add_item(
            items,

            item_id=
                "volatility-versus-benchmark",

            score=
                score,

            priority=
                priority,

            tone=
                tone,

            category=
                "Performance",

            title=
                title,

            summary=
                (
                    "Annualised portfolio volatility was "
                    f"{_percent_text(portfolio_vol)} versus "
                    f"{_percent_text(benchmark_vol)} for "
                    f"{benchmark_name}."
                ),

            review_prompt=
                (
                    "Evaluate return and risk together rather "
                    "than interpreting historical outperformance "
                    "in isolation."
                ),

            evidence=[
                _metric(
                    "Portfolio volatility",
                    portfolio_vol,
                    _percent_text(
                        portfolio_vol
                    ),
                ),

                _metric(
                    f"{benchmark_name} volatility",
                    benchmark_vol,
                    _percent_text(
                        benchmark_vol
                    ),
                ),

                _metric(
                    "Beta",
                    beta,
                    _number_text(
                        beta
                    ),
                ),
            ],
        )


    if (
        outperformance
        is not None
        and outperformance > 0
    ):

        _add_item(
            items,

            item_id=
                "historical-outperformance",

            score=
                52,

            priority=
                "context",

            tone=
                "positive",

            category=
                "Performance",

            title=
                (
                    f"Current-weight simulation outperformed "
                    f"{benchmark_name}"
                ),

            summary=
                (
                    "The historical constant-weight simulation "
                    "exceeded the benchmark by "
                    f"{outperformance * 100:.1f} percentage points "
                    "in cumulative return."
                ),

            review_prompt=
                (
                    "Treat this as historical context rather "
                    "than evidence that future outperformance "
                    "will persist."
                ),

            evidence=[
                _metric(
                    "Cumulative outperformance",
                    outperformance,
                    (
                        f"{outperformance * 100:.1f} pp"
                    ),
                ),
            ],
        )


    # ======================================================
    # SENTIMENT — OPTIONAL / FLEXIBLE SCHEMA
    # ======================================================

    for row in _sentiment_rows(
        sentiment
    ):

        ticker = (
            row.get(
                "ticker"
            )
            or row.get(
                "symbol"
            )
        )


        signal = str(
            row.get(
                "signal",
                row.get(
                    "regime",
                    row.get(
                        "label",
                        row.get(
                            "sentiment_label",
                            ""
                        )
                    )
                )
            )
        ).strip().lower()


        confidence = (
            _safe_float(
                row.get(
                    "confidence"
                )
            )
        )


        article_count = (
            _safe_float(
                row.get(
                    "article_count"
                )
            )
        )


        if (
            not ticker
            or confidence
            is None
            or confidence < 0.55
            or (
                article_count
                is not None
                and article_count <= 0
            )
        ):
            continue


        bearish = (
            signal in (
                "bearish",
                "negative",
            )
            or "bearish" in signal
            or signal.startswith(
                "negative"
            )
        )


        bullish = (
            signal in (
                "bullish",
                "positive",
            )
            or "bullish" in signal
            or signal.startswith(
                "positive"
            )
        )


        if bearish:

            _add_item(
                items,

                item_id=
                    f"sentiment-{ticker}-bearish",

                score=
                    74,

                priority=
                    "medium",

                tone=
                    "warning",

                category=
                    "Sentiment",

                title=
                    f"Recent news tone for {ticker} is bearish",

                summary=
                    (
                        "FinClarity's headline-language model "
                        f"shows a bearish signal with "
                        f"{_percent_text(confidence)} confidence."
                    ),

                review_prompt=
                    (
                        "Review the underlying evidence rather "
                        "than treating headline sentiment as a "
                        "forecast."
                    ),

                evidence=[
                    _metric(
                        "Model confidence",
                        confidence,
                        _percent_text(
                            confidence
                        ),
                    ),
                ],
            )


        elif bullish:

            _add_item(
                items,

                item_id=
                    f"sentiment-{ticker}-bullish",

                score=
                    48,

                priority=
                    "context",

                tone=
                    "positive",

                category=
                    "Sentiment",

                title=
                    f"Recent news tone for {ticker} is bullish",

                summary=
                    (
                        "FinClarity's headline-language model "
                        f"shows a bullish signal with "
                        f"{_percent_text(confidence)} confidence."
                    ),

                review_prompt=
                    (
                        "Use the underlying news as research "
                        "context, not as a return forecast."
                    ),

                evidence=[
                    _metric(
                        "Model confidence",
                        confidence,
                        _percent_text(
                            confidence
                        ),
                    ),
                ],
            )


    # ======================================================
    # RANK
    # ======================================================

    ranked = sorted(
        items,
        key=lambda item:
            (
                item[
                    "score"
                ],
                item[
                    "id"
                ],
            ),
        reverse=True,
    )


    ranked = ranked[
        :max(
            1,
            int(
                max_items
            )
        )
    ]


    high_count = sum(
        1
        for item
        in ranked
        if item[
            "priority"
        ] == "high"
    )


    medium_count = sum(
        1
        for item
        in ranked
        if item[
            "priority"
        ] == "medium"
    )


    context_count = sum(
        1
        for item
        in ranked
        if item[
            "priority"
        ] == "context"
    )


    if high_count > 0:

        attention_level = "High"

    elif medium_count > 0:

        attention_level = "Moderate"

    elif context_count > 0:

        attention_level = "Low"

    else:

        attention_level = (
            "No material findings"
        )


    return {
        "attention_level":
            attention_level,

        "counts":
            {
                "high":
                    high_count,

                "medium":
                    medium_count,

                "context":
                    context_count,
            },

        "top_item":
            (
                ranked[0]
                if ranked
                else None
            ),

        "items":
            ranked,

        "synthesis_coverage":
            historical_ranking_eligibility,

        "methodology":
            {
                "type":
                    "deterministic_evidence_ranking",

                "coverage_policy":
                    (
                        "Performance, diversification and historical "
                        "stress observations contribute to ranking "
                        "only when all requested holdings required "
                        "for that analysis are represented. Partial "
                        "historical modules remain visible in source "
                        "analytics but are excluded from ranking."
                    ),

                "description":
                    (
                        "The Action Centre ranks observations "
                        "from FinClarity's existing analytics "
                        "using explicit thresholds. It does not "
                        "predict returns or issue buy, sell or "
                        "hold recommendations."
                    ),
            },
    }
