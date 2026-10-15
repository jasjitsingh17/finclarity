import { API_BASE_URL } from "../lib/apiBase";
import { writeRetailMarketSnapshot } from "../lib/retailMarketSnapshot";
import RetailPortfolioIntelligence from "../components/RetailPortfolioIntelligence";
import RetailPortfolioSearch from "../components/RetailPortfolioSearch";
import RetailMarketTape from "../components/RetailMarketTape";
import RetailSidebar from "../components/RetailSidebar";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  LineChart,
  PieChart,
  Settings2,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import useRetailPortfolio
  from "../hooks/useRetailPortfolio";

import {
  readRetailAnalysisCache,
  saveRetailAnalysisCache,
} from "../lib/retailAnalysisCache";

import {
  buildRetailFlags,
  buildRetailHealth,
  extractRetailRisk,
  extractRetailSentiment,
} from "../lib/retailResearchAnalytics";

import "./RetailDashboardLive.css";


const API = API_BASE_URL;


const CURRENCY_SYMBOLS = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  INR: "₹",
  JPY: "¥",
  HKD: "HK$",
  CHF: "CHF ",
  CAD: "C$",
  AUD: "A$",
};






function money(
  value,
  currency = "GBP",
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(
      number
    )
  ) {

    return "—";
  }


  const symbol =
    CURRENCY_SYMBOLS[
      currency
    ]
    ?? `${currency} `;


  const digits =
    Math.abs(number) >= 1000
      ? 0
      : 2;


  return (
    symbol
    + Math.abs(
        number
      ).toLocaleString(
        "en-GB",
        {
          minimumFractionDigits:
            digits,

          maximumFractionDigits:
            digits,
        }
      )
  );
}


function signedMoney(
  value,
  currency,
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(
      number
    )
  ) {

    return "—";
  }


  return (
    `${number >= 0 ? "+" : "-"}`
    + money(
        Math.abs(number),
        currency,
      )
  );
}


function percent(
  value,
  digits = 1,
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(
      number
    )
  ) {

    return "—";
  }


  return (
    `${number >= 0 ? "+" : ""}`
    + number.toFixed(
        digits
      )
    + "%"
  );
}


function ratio(
  value,
) {

  const number =
    Number(value);


  return Number.isFinite(
    number
  )
    ? number.toFixed(2)
    : "—";
}


function fxRateLabel(
  quote,
) {

  if (
    !quote
    || !Number.isFinite(
      Number(
        quote.rate
      )
    )
  ) {

    return null;
  }


  return Number(
    quote.rate
  ).toLocaleString(
    "en-GB",
    {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }
  );
}


function dateTime(
  value,
) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";
  }


  return date.toLocaleString(
    [],
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}






function attentionSignal(
  holding,
  tickerSentiment,
) {

  const weight =
    Number(
      holding.weight
    );


  const volatility =
    Number(
      holding
        .annualised_volatility
    );


  const dailyMove =
    Math.abs(
      Number(
        holding
          .change_percent
      )
    );


  const sentimentScore =
    tickerSentiment
      ?.score;


  const sentimentConfidence =
    tickerSentiment
      ?.confidence;


  const severeSentiment =
    Number.isFinite(
      sentimentScore
    )
    && Number.isFinite(
      sentimentConfidence
    )
    && sentimentScore < -0.15
    && sentimentConfidence >= 0.55;


  if (
    severeSentiment
    || (
      Number.isFinite(
        volatility
      )
      && volatility > 0.45
    )
    || (
      Number.isFinite(
        weight
      )
      && weight > 0.50
    )
  ) {

    return "Attention";
  }


  if (
    (
      Number.isFinite(
        volatility
      )
      && volatility > 0.30
    )
    || (
      Number.isFinite(
        weight
      )
      && weight > 0.35
    )
    || (
      Number.isFinite(
        dailyMove
      )
      && dailyMove > 3
    )
  ) {

    return "Monitor";
  }


  return "Stable";
}


function attentionReason(
  holding,
  tickerSentiment,
) {

  const weight =
    Number(
      holding.weight
    );


  const volatility =
    Number(
      holding
        .annualised_volatility
    );


  const move =
    Number(
      holding
        .change_percent
    );


  if (
    Number.isFinite(
      weight
    )
    && weight > 0.40
  ) {

    return "Large portfolio position";
  }


  if (
    Number.isFinite(
      volatility
    )
    && volatility > 0.35
  ) {

    return "High historical volatility";
  }


  if (
    Number.isFinite(
      volatility
    )
    && volatility > 0.30
  ) {

    return "Elevated historical volatility";
  }


  if (
    tickerSentiment
      ?.score !== null
    && tickerSentiment
      ?.score < -0.15
    && tickerSentiment
      ?.confidence >= 0.55
  ) {

    return "Negative news sentiment";
  }


  if (
    Number.isFinite(
      move
    )
    && Math.abs(
      move
    ) > 2.5
  ) {

    return "Large recent price move";
  }


  return "No major warning detected";
}


function componentLabel(
  value,
) {

  if (
    value === null
    || value === undefined
  ) {

    return "Awaiting data";
  }


  if (value >= 85) {
    return "Strong";
  }

  if (value >= 70) {
    return "Healthy";
  }

  if (value >= 55) {
    return "Moderate";
  }

  return "Needs attention";
}


function RetailDashboard() {

  const portfolio =
    useRetailPortfolio();


  const initialCache =
    readRetailAnalysisCache(
      portfolio
    );


  const [
    analysisRecord,
    setAnalysisRecord,
  ] = useState(
    initialCache
  );


  const [
    market,
    setMarket,
  ] = useState(
    initialCache
      ?.result
      ?.market
    ?? null
  );


  const [
    marketLoading,
    setMarketLoading,
  ] = useState(false);


  const [
    analysing,
    setAnalysing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const holdings =
    useMemo(
      () =>
        portfolio.holdings
        ?? [],
      [
        portfolio.holdings,
      ]
    );


  const displayCurrency =
    portfolio.baseCurrency
    || "GBP";


  const marketRequest =
    useMemo(
      () => ({
        display_currency:
          displayCurrency,

        lookback_days:
          252,

        holdings:
          holdings
            .filter(
              (holding) =>
                holding.ticker
            )
            .map(
              (holding) => ({
                ticker:
                  holding.ticker,

                name:
                  holding.name
                  || holding.ticker,

                quantity:
                  Number(
                    holding.quantity
                  ),

                average_cost:
                  holding.averageCost
                  === null
                  || holding.averageCost
                    === undefined
                    ? null
                    : Number(
                        holding.averageCost
                      ),

                currency:
                  holding.nativeCurrency
                  || displayCurrency,
              })
            ),
      }),
      [
        displayCurrency,
        holdings,
      ]
    );


  const loadMarket =
    useCallback(
      async (
        showLoading = true,
      ) => {

        if (
          !marketRequest
            .holdings
            .length
        ) {

          setMarket(
            null
          );

          return null;
        }


        if (showLoading) {

          setMarketLoading(
            true
          );
        }


        try {

          const response =
            await fetch(
              `${API}/api/retail/market-snapshot`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    marketRequest
                  ),
              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data.detail
              || "Market data unavailable."
            );
          }


          setMarket(
            data
          );

          return data;

        } catch (
          requestError
        ) {

          setError(
            requestError.message
          );

          return null;

        } finally {

          if (showLoading) {

            setMarketLoading(
              false
            );
          }
        }
      },
      [marketRequest]
    );


  useEffect(
    () => {

      /*
       * Schedule the initial request outside the
       * synchronous effect body. Subsequent state
       * changes happen from asynchronous callbacks.
       */

      const initialRequest =
        window.setTimeout(
          () => {

            void loadMarket(
              true
            );
          },
          0,
        );


      const interval =
        window.setInterval(
          () => {

            void loadMarket(
              false
            );
          },
          60000,
        );


      return () => {

        window.clearTimeout(
          initialRequest
        );


        window.clearInterval(
          interval
        );
      };

    },
    [loadMarket]
  );


  const riskRaw =
    analysisRecord
      ?.result
      ?.risk
    ?? null;


  const sentimentRaw =
    analysisRecord
      ?.result
      ?.sentiment
    ?? null;


  const risk =
    useMemo(
      () =>
        extractRetailRisk(
          riskRaw
        ),
      [riskRaw]
    );


  const sentiment =
    useMemo(
      () =>
        extractRetailSentiment(
          sentimentRaw
        ),
      [sentimentRaw]
    );


  const health =
    useMemo(
      () =>
        buildRetailHealth(
          market,
          riskRaw,
          sentimentRaw,
        ),
      [
        market,
        riskRaw,
        sentimentRaw,
      ]
    );


  const flags =
    useMemo(
      () =>
        buildRetailFlags(
          market,
          riskRaw,
          sentimentRaw,
        ),
      [
        market,
        riskRaw,
        sentimentRaw,
      ]
    );


  const flagCounts =
    useMemo(
      () => ({
        red:
          flags.filter(
            (flag) =>
              flag.type === "red"
          ).length,

        amber:
          flags.filter(
            (flag) =>
              flag.type === "amber"
          ).length,

        green:
          flags.filter(
            (flag) =>
              flag.type === "green"
          ).length,
      }),
      [flags]
    );


  const attention =
    useMemo(
      () => {

        return (
          market?.holdings
          ?? []
        )
          .map(
            (holding) => {

              const tickerSentiment =
                sentiment.byTicker[
                  holding.ticker
                ]
                ?? null;


              const weight =
                Number(
                  holding.weight
                );


              const volatility =
                Number(
                  holding
                    .annualised_volatility
                );


              const move =
                Math.abs(
                  Number(
                    holding
                      .change_percent
                  )
                );


              const negativeSentiment =
                tickerSentiment
                  ?.score !== null
                && Number(
                    tickerSentiment
                      ?.score
                  ) < 0
                  ? Math.abs(
                      Number(
                        tickerSentiment
                          .score
                      )
                    )
                  : 0;


              /*
               * Retail attention ranking prioritises
               * material threshold breaches before
               * smaller combinations of exposures.
               */

              let score = 0;


              if (
                Number.isFinite(
                  volatility
                )
              ) {

                if (
                  volatility > 0.35
                ) {

                  score += 40;

                } else if (
                  volatility > 0.30
                ) {

                  score += 22;

                } else {

                  score +=
                    Math.min(
                      volatility / 0.30,
                      1
                    )
                    * 10;
                }
              }


              if (
                Number.isFinite(
                  weight
                )
              ) {

                if (
                  weight > 0.50
                ) {

                  score += 45;

                } else if (
                  weight > 0.40
                ) {

                  score += 35;

                } else if (
                  weight > 0.35
                ) {

                  score += 20;

                } else {

                  score +=
                    weight * 20;
                }
              }


              if (
                Number.isFinite(
                  move
                )
              ) {

                score +=
                  Math.min(
                    move / 5,
                    1
                  )
                  * 10;
              }


              score +=
                negativeSentiment
                * 25;


              return {
                ...holding,

                attentionScore:
                  score,

                signal:
                  attentionSignal(
                    holding,
                    tickerSentiment,
                  ),

                reason:
                  attentionReason(
                    holding,
                    tickerSentiment,
                  ),

                sentiment:
                  tickerSentiment,
              };
            }
          )
          .sort(
            (left, right) =>
              right.attentionScore
              - left.attentionScore
          );

      },
      [
        market,
        sentiment,
      ]
    );


  async function runAnalysis() {

    if (
      holdings.length === 0
    ) {

      setError(
        "Add a portfolio before running analysis."
      );

      return;
    }


    setAnalysing(
      true
    );

    setError("");


    try {

      const latestMarket =
        await loadMarket(
          false
        );


      if (!latestMarket) {

        throw new Error(
          "Live market data is required before the portfolio can be analysed."
        );
      }


      writeRetailMarketSnapshot(
        portfolio,
        latestMarket
      );


      const analysable =
        latestMarket
          .holdings
          .filter(
            (holding) =>
              holding.status
              === "live"
              && Number.isFinite(
                Number(
                  holding.weight
                )
              )
          );


      if (
        analysable.length === 0
      ) {

        throw new Error(
          "No holdings currently have analysable market data."
        );
      }


      const tickers =
        analysable.map(
          (holding) =>
            holding.ticker
        );


      const weights =
        analysable.map(
          (holding) =>
            Number(
              holding.weight
            )
        );


      const totalWeight =
        weights.reduce(
          (
            total,
            weight,
          ) =>
            total + weight,
          0
        );


      const normalisedWeights =
        weights.map(
          (weight) =>
            weight
            / totalWeight
        );


      const riskRequest = {
        tickers,
        weights:
          normalisedWeights,

        benchmark:
          "SPY",

        years:
          3,

        base_currency:
          String(
            portfolio?.baseCurrency
            ?? latestMarket?.baseCurrency
            ?? "USD"
          )
            .trim()
            .toUpperCase(),

        risk_free_rate:
          0.04,
      };


      const sentimentRequest = {
        tickers,

        max_articles_per_ticker:
          5,

        lookback_hours:
          72,
      };


      const [
        riskResponse,
        sentimentResponse,
      ] =
        await Promise.allSettled(
          [
            fetch(
              `${API}/api/risk/analyse`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    riskRequest
                  ),
              }
            )
              .then(
                async (
                  response,
                ) => {

                  const data =
                    await response.json();


                  if (!response.ok) {

                    throw new Error(
                      data.detail
                      || "Risk analysis failed."
                    );
                  }


                  return data;
                }
              ),

            fetch(
              `${API}/api/sentiment/analyse`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    sentimentRequest
                  ),
              }
            )
              .then(
                async (
                  response,
                ) => {

                  const data =
                    await response.json();


                  if (!response.ok) {

                    throw new Error(
                      data.detail
                      || "Sentiment analysis failed."
                    );
                  }


                  return data;
                }
              ),
          ]
        );


      const riskResult =
        riskResponse.status
          === "fulfilled"
          ? riskResponse.value
          : null;


      const sentimentResult =
        sentimentResponse.status
          === "fulfilled"
          ? sentimentResponse.value
          : null;


      if (
        !riskResult
        && !sentimentResult
      ) {

        throw new Error(
          "Both risk and sentiment analysis failed. Market values are still available."
        );
      }


      const saved =
        saveRetailAnalysisCache(
          {
            market:
              latestMarket,

            risk:
              riskResult,

            sentiment:
              sentimentResult,

            errors: {
              risk:
                riskResponse.status
                === "rejected"
                  ? String(
                      riskResponse.reason
                    )
                  : null,

              sentiment:
                sentimentResponse.status
                === "rejected"
                  ? String(
                      sentimentResponse.reason
                    )
                  : null,
            },
          },
          portfolio,
        );


      setAnalysisRecord(
        saved
      );


      setMarket(
        latestMarket
      );

    } catch (
      analysisError
    ) {

      setError(
        analysisError.message
      );

    } finally {

      setAnalysing(
        false
      );
    }
  }


  const sourceLabel =
    portfolio.source === "import"
      ? "CSV IMPORT"
      : portfolio.source === "linked"
        ? "LINKED PORTFOLIO"
        : "MANUAL PORTFOLIO";


  const primaryFxQuote =
    market?.fx_quotes?.[0]
    ?? null;


  const marketCoverage =
    market
      ? `${market.live_count}/${market.holding_count}`
      : "—";


  const sentimentCoverage =
    Object.keys(
      sentiment.byTicker
    ).length;


  const currencies =
    new Set(
      holdings.map(
        (holding) =>
          holding.nativeCurrency
      )
    );


  const riskAvailable =
    (
      risk.volatility !== null
      || risk.drawdown !== null
      || risk.var95 !== null
      || risk.cvar95 !== null
    );


  const riskLevel =
    !riskAvailable
      ? "Awaiting analysis"
      : risk.volatility > 0.35
        ? "High"
        : risk.volatility > 0.25
          ? "Elevated"
          : "Moderate";


  const analysisStale =
    analysisRecord
      ?.status === "stale";


  return (
    <div className="retail-live-dashboard">

      <RetailSidebar active="dashboard" />


      <main className="retail-live-main">

        <header className="retail-live-topbar">

          <RetailPortfolioSearch holdings={holdings} />


          <div className="retail-live-data-state">

            <i
              className={
                market?.status
                === "live"
                  ? "live"
                  : ""
              }
            />

            {
              marketLoading
                ? "UPDATING MARKET DATA"
                : market
                  ? "MARKET DATA • MAY BE DELAYED"
                  : "MARKET DATA PENDING"
            }

          </div>

        </header>

        <RetailMarketTape />


        <div className="retail-live-content">

          {
            analysisStale
            && (

              <div className="retail-stale-banner">

                <AlertTriangle
                  size={16}
                />

                <div>

                  <strong>
                    Portfolio changed — analysis refresh required
                  </strong>

                  <span>
                    Market values are current, but the saved risk and sentiment analysis belongs to the previous portfolio.
                  </span>

                </div>

              </div>

            )
          }


          {
            error
            && (

              <div className="retail-error-banner">
                {error}
              </div>

            )
          }


          <section className="retail-live-heading">

            <div>

              <span className="retail-live-eyebrow">
                PORTFOLIO INTELLIGENCE
              </span>


              <h1>
                Here's what matters
                <span>
                  {" "}in your portfolio.
                </span>
              </h1>


              <p>
                Live portfolio valuation, historical risk and news sentiment translated into straightforward signals.
              </p>


              <div className="retail-portfolio-identity">

                <strong>
                  {
                    portfolio.name
                    || "My Portfolio"
                  }
                </strong>

                <span>
                  {sourceLabel}
                </span>

                <span>
                  {
                    holdings.length
                  }
                  {" holdings"}
                </span>

              </div>

            </div>


            <div className="retail-live-actions">

              <Link
                to="/retail/portfolio"
                className="retail-edit-button"
              >
                <Settings2 size={16} />
                Edit Portfolio
              </Link>


              <button
                type="button"
                className="retail-analyse-button"
                onClick={
                  runAnalysis
                }
                disabled={
                  analysing
                  || holdings.length === 0
                }
              >

                <Sparkles
                  size={17}
                />

                {
                  analysing
                    ? "Analysing..."
                    : "Analyse Portfolio"
                }

              </button>

            </div>

          </section>


          <section className="retail-primary-metrics">

            <article>

              <span>
                Portfolio Value
              </span>

              <strong>
                {
                  market?.total_market_value
                  !== null
                  && market?.total_market_value
                    !== undefined
                    ? money(
                        market.total_market_value,
                        displayCurrency,
                      )
                    : marketLoading
                      ? "Loading..."
                      : "—"
                }
              </strong>

              <small>
                {
                  market?.total_pnl
                  !== null
                  && market?.total_pnl
                    !== undefined
                    ? (
                      <>
                        {
                          signedMoney(
                            market.total_pnl,
                            displayCurrency,
                          )
                        }
                        {" "}
                        total unrealised P&L
                      </>
                    )
                    : "Current market value"
                }
              </small>


              {
                primaryFxQuote
                && (

                  <em className="retail-metric-fx">

                    {
                      primaryFxQuote.pair
                    }
                    {" "}
                    {
                      fxRateLabel(
                        primaryFxQuote
                      )
                    }

                  </em>

                )
              }

            </article>


            <article>

              <span>
                Today's Change
              </span>

              <strong
                className={
                  Number(
                    market
                      ?.total_day_change
                  ) >= 0
                    ? "positive"
                    : "negative"
                }
              >
                {
                  market?.total_day_change
                  !== null
                  && market?.total_day_change
                    !== undefined
                    ? signedMoney(
                        market.total_day_change,
                        displayCurrency,
                      )
                    : "—"
                }
              </strong>

              <small>
                {
                  market?.total_day_change_percent
                  !== null
                  && market?.total_day_change_percent
                    !== undefined
                    ? percent(
                        market.total_day_change_percent
                      )
                    : "Latest available session"
                }
              </small>

            </article>


            <article>

              <span>
                Portfolio Health
              </span>

              <strong>
                {
                  health
                    ? `${health.overall}/100`
                    : "Awaiting analysis"
                }
              </strong>

              <small>
                {
                  health
                    ? health.label
                    : "Run portfolio analysis"
                }
              </small>

            </article>


            <article>

              <span>
                Risk Level
              </span>

              <strong>
                {riskLevel}
              </strong>

              <small>
                {
                  risk.volatility
                  !== null
                    ? (
                      `${(
                        risk.volatility
                        * 100
                      ).toFixed(1)}% historical volatility`
                    )
                    : "Risk model not yet run"
                }
              </small>

            </article>

          </section>


          <section className="retail-coverage-strip">

            <span>
              <CheckCircle2 size={13} />
              Market data:
              {" "}
              {marketCoverage}
            </span>


            <span>
              <ShieldCheck size={13} />
              Risk:
              {" "}
              {
                riskAvailable
                  ? "analysed"
                  : "pending"
              }
            </span>


            <span>
              <BrainCircuit size={13} />
              Sentiment:
              {" "}
              {
                sentimentCoverage
              }
              /
              {
                holdings.length
              }
            </span>


            <span>
              <Clock3 size={13} />

              Analysis:
              {" "}
              {
                analysisRecord
                  ?.generatedAt
                  ? dateTime(
                      analysisRecord.generatedAt
                    )
                  : "not run"
              }
            </span>


            {
              primaryFxQuote
              && (

                <span className="retail-fx-status">

                  <LineChart size={13} />

                  FX:
                  {" "}
                  {
                    primaryFxQuote.pair
                  }
                  {" "}
                  {
                    fxRateLabel(
                      primaryFxQuote
                    )
                  }

                  <small>
                    {
                      primaryFxQuote.provider
                    }
                    {" • "}
                    latest available
                  </small>

                </span>

              )
            }

          </section>


          <RetailPortfolioIntelligence />

        <section className="retail-main-grid">

            <article className="retail-live-panel">

              <div className="retail-panel-heading">

                <div>

                  <h2>
                    Portfolio Composition
                  </h2>

                  <p>
                    Current value-weighted allocation.
                  </p>

                </div>

                <PieChart size={19} />

              </div>


              {
                market
                  ?.weights_available
                ? (

                  <div className="retail-allocation-list">

                    {
                      market.holdings
                        .filter(
                          (holding) =>
                            holding.weight
                            !== null
                        )
                        .sort(
                          (left, right) =>
                            right.weight
                            - left.weight
                        )
                        .map(
                          (holding) => (

                            <div
                              className="retail-allocation-item"
                              key={
                                holding.ticker
                              }
                            >

                              <div>

                                <strong>
                                  {
                                    holding.ticker
                                  }
                                </strong>

                                <span>
                                  {
                                    (
                                      holding.weight
                                      * 100
                                    ).toFixed(1)
                                  }
                                  %
                                </span>

                              </div>


                              <div className="retail-allocation-track">

                                <div
                                  style={{
                                    width:
                                      `${Math.max(
                                        2,
                                        holding.weight
                                        * 100
                                      )}%`,
                                  }}
                                />

                              </div>

                            </div>

                          )
                        )
                    }

                  </div>

                )
                : (

                  <div className="retail-awaiting">
                    Allocation is waiting for sufficient market/FX data.
                  </div>

                )
              }


              <div className="retail-composition-meta">

                <span>
                  {
                    holdings.length
                  }
                  {" holdings"}
                </span>

                <span>
                  {
                    currencies.size
                  }
                  {" holding "}
                  {
                    currencies.size === 1
                      ? "currency"
                      : "currencies"
                  }
                </span>

                <span>
                  Display:
                  {" "}
                  {displayCurrency}
                </span>

              </div>


              {
                market
                && !market.fx_complete
                && (

                  <div className="retail-info-note">

                    <AlertTriangle size={15} />

                    {
                      currencies.size === 1
                        ? (
                          `FX conversion from ${
                            [
                              ...currencies,
                            ][0]
                          } to ${
                            displayCurrency
                          } is incomplete. Relative weights can still be calculated when possible.`
                        )
                        : (
                          "Some portfolio currencies could not be converted, so the displayed total may be incomplete."
                        )
                    }

                  </div>

                )
              }

            </article>


            <article
              className="retail-live-panel"
              id="health"
            >

              <div className="retail-panel-heading">

                <div>

                  <h2>
                    Portfolio Health
                  </h2>

                  <p>
                    Separate from analysis coverage.
                  </p>

                </div>

                <ShieldCheck size={19} />

              </div>


              {
                health
                ? (

                  <>

                    <div className="retail-health-layout">

                      <div
                        className="retail-health-donut"
                        style={{
                          background:
                            `conic-gradient(
                              #4fd1b1 ${
                                health.overall
                                * 3.6
                              }deg,
                              #1a3147 0deg
                            )`,
                        }}
                      >

                        <div>

                          <strong>
                            {
                              health.overall
                            }
                          </strong>

                          <span>
                            /100
                          </span>

                          <small>
                            {
                              health.label
                            }
                          </small>

                        </div>

                      </div>


                      <div className="retail-health-flags">

                        <span className="green">
                          Green signals
                          <strong>
                            {
                              flagCounts.green
                            }
                          </strong>
                        </span>

                        <span className="amber">
                          Amber signals
                          <strong>
                            {
                              flagCounts.amber
                            }
                          </strong>
                        </span>

                        <span className="red">
                          Red signals
                          <strong>
                            {
                              flagCounts.red
                            }
                          </strong>
                        </span>

                      </div>

                    </div>


                    <div className="retail-health-components">

                      {
                        [
                          [
                            "Downside Risk",
                            health.components.risk,
                          ],

                          [
                            "Concentration",
                            health.components.concentration,
                          ],

                          [
                            "Sentiment Context",
                            health.components.sentiment,
                          ],
                        ].map(
                          (
                            [
                              label,
                              value,
                            ]
                          ) => (

                            <div
                              key={label}
                            >

                              <span>
                                {label}
                              </span>

                              <strong>
                                {
                                  value
                                  ?? "—"
                                }
                              </strong>

                              <small>
                                {
                                  componentLabel(
                                    value
                                  )
                                }
                              </small>

                            </div>

                          )
                        )
                      }

                    </div>

                  </>

                )
                : (

                  <div className="retail-awaiting health">

                    <ShieldCheck size={27} />

                    <strong>
                      Awaiting analysis
                    </strong>

                    <span>
                      Portfolio Health is shown only when historical risk and complete current-valuation coverage are available. Low-confidence sentiment is excluded from the score.
                    </span>

                  </div>

                )
              }

            </article>

          </section>


          <section
            className="retail-live-panel retail-holdings-panel"
          >

            <div className="retail-panel-heading">

              <div>

                <h2>
                  Your Holdings
                </h2>

                <p>
                  Imported facts and live market data are shown separately from FinClarity analysis.
                </p>

              </div>

              <WalletCards size={19} />

            </div>


            <div className="retail-holdings-table">

              <div className="retail-holdings-row header">

                <span>
                  Holding
                </span>

                <span>
                  Current Price
                </span>

                <span>
                  Market Value
                </span>

                <span>
                  Unrealised P&L
                </span>

                <span>
                  Today
                </span>

                <span>
                  Weight
                </span>

                <span>
                  Sentiment
                </span>

              </div>


              {
                (
                  market?.holdings
                  ?? []
                ).map(
                  (holding) => {

                    const tickerSentiment =
                      sentiment
                        .byTicker[
                          holding.ticker
                        ];


                    return (

                      <div
                        className="retail-holdings-row"
                        key={
                          holding.ticker
                        }
                      >

                        <div>

                          <strong>
                            {
                              holding.name
                              || holding.ticker
                            }
                          </strong>

                          <small>
                            {
                              holding.ticker
                            }
                            {" • "}
                            {
                              holding.quantity
                            }
                            {" units"}
                          </small>

                        </div>


                        <span>
                          {
                            holding.price
                            !== null
                              ? money(
                                  holding.price,
                                  holding.currency,
                                )
                              : "Unavailable"
                          }
                        </span>


                        <span>
                          {
                            holding
                              .market_value_display
                            !== null
                              ? money(
                                  holding.market_value_display,
                                  displayCurrency,
                                )
                              : "—"
                          }
                        </span>


                        <span
                          className={
                            Number(
                              holding
                                .pnl_display
                            ) >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          {
                            holding
                              .pnl_display
                            !== null
                              ? (
                                <>
                                  {
                                    signedMoney(
                                      holding.pnl_display,
                                      displayCurrency,
                                    )
                                  }

                                  <small>
                                    {
                                      percent(
                                        holding.pnl_percent
                                      )
                                    }
                                  </small>
                                </>
                              )
                              : "—"
                          }
                        </span>


                        <span
                          className={
                            Number(
                              holding
                                .change_percent
                            ) >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          {
                            holding
                              .change_percent
                            !== null
                              ? percent(
                                  holding.change_percent
                                )
                              : "—"
                          }
                        </span>


                        <span>
                          {
                            holding.weight
                            !== null
                              ? `${(
                                  holding.weight
                                  * 100
                                ).toFixed(1)}%`
                              : "—"
                          }
                        </span>


                        <span>
                          {
                            tickerSentiment
                              ? tickerSentiment.label
                              : "Awaiting analysis"
                          }
                        </span>

                      </div>

                    );
                  }
                )
              }

            </div>

          </section>


          <section
            className="retail-live-panel"
            id="attention"
          >

            <div className="retail-panel-heading">

              <div>

                <h2>
                  What Needs Your Attention
                </h2>

                <p>
                  Ranked using live position size, volatility, recent movement and available sentiment.
                </p>

              </div>

              <AlertTriangle size={19} />

            </div>


            {
              attention.length
                ? (

                  <div className="retail-attention-list">

                    {
                      attention.map(
                        (
                          holding,
                          index,
                        ) => (

                          <div
                            key={
                              holding.ticker
                            }
                          >

                            <span className="retail-attention-rank">
                              #
                              {
                                index + 1
                              }
                            </span>


                            <div>

                              <strong>
                                {
                                  holding.ticker
                                }
                              </strong>

                              <small>
                                {
                                  holding.reason
                                }
                              </small>

                            </div>


                            <span>
                              {
                                holding.weight
                                !== null
                                  ? `${(
                                      holding.weight
                                      * 100
                                    ).toFixed(1)}% of portfolio`
                                  : "Weight unavailable"
                              }
                            </span>


                            <span>
                              {
                                holding
                                  .annualised_volatility
                                !== null
                                  ? `${(
                                      holding
                                        .annualised_volatility
                                      * 100
                                    ).toFixed(1)}% volatility`
                                  : "Risk unavailable"
                              }
                            </span>


                            <strong
                              className={
                                `retail-signal ${
                                  holding.signal
                                    .toLowerCase()
                                }`
                              }
                            >
                              {
                                holding.signal
                              }
                            </strong>

                          </div>

                        )
                      )
                    }

                  </div>

                )
                : (

                  <div className="retail-awaiting">
                    Live holdings are required before attention ranking can be calculated.
                  </div>

                )
            }

          </section>


          <section className="retail-secondary-grid">

            <article
              className="retail-live-panel"
              id="risk"
            >

              <div className="retail-panel-heading">

                <div>

                  <h2>
                    Risk Analysis
                  </h2>

                  <p>
                    Historical portfolio risk, not a forecast.
                  </p>

                </div>

                <Activity size={19} />

              </div>


              {
                riskAvailable
                  ? (

                    <div className="retail-risk-grid">

                      <div>

                        <span>
                          Annualised Volatility
                        </span>

                        <strong>
                          {
                            risk.volatility
                            !== null
                              ? `${(
                                  risk.volatility
                                  * 100
                                ).toFixed(1)}%`
                              : "—"
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Max Drawdown
                        </span>

                        <strong>
                          {
                            risk.drawdown
                            !== null
                              ? `${(
                                  risk.drawdown
                                  * 100
                                ).toFixed(1)}%`
                              : "—"
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          1-Day VaR 95%
                        </span>

                        <strong>
                          {
                            risk.var95
                            !== null
                              ? `${(
                                  risk.var95
                                  * 100
                                ).toFixed(2)}%`
                              : "—"
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Sharpe Ratio
                        </span>

                        <strong>
                          {
                            ratio(
                              risk.sharpe
                            )
                          }
                        </strong>

                      </div>

                    </div>

                  )
                  : (

                    <div className="retail-awaiting">
                      Run Analyse Portfolio to calculate historical risk.
                    </div>

                  )
              }

            </article>


            <article
              className="retail-live-panel"
              id="sentiment"
            >

              <div className="retail-panel-heading">

                <div>

                  <h2>
                    Sentiment Insights
                  </h2>

                  <p>
                    FinBERT headline sentiment with confidence controls.
                  </p>

                </div>

                <BrainCircuit size={19} />

              </div>


              {
                sentimentRaw
                  ? (

                    <div className="retail-sentiment-summary">

                      <div>

                        <span>
                          Portfolio Regime
                        </span>

                        <strong>
                          {
                            sentiment
                              .portfolio
                              .label
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Sentiment Score
                        </span>

                        <strong>
                          {
                            sentiment
                              .portfolio
                              .score
                            !== null
                              ? sentiment
                                  .portfolio
                                  .score
                                  .toFixed(3)
                              : "—"
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Model Confidence
                        </span>

                        <strong>
                          {
                            sentiment
                              .portfolio
                              .confidence
                            !== null
                              ? `${(
                                  sentiment
                                    .portfolio
                                    .confidence
                                  * 100
                                ).toFixed(1)}%`
                              : "—"
                          }
                        </strong>

                      </div>


                      <p>
                        Sentiment measures language in current news headlines. It is not a prediction of future returns or a buy/sell recommendation.
                      </p>

                    </div>

                  )
                  : (

                    <div className="retail-awaiting">
                      Run Analyse Portfolio to retrieve current news sentiment.
                    </div>

                  )
              }

            </article>

          </section>


          {
            flags.length > 0
            && riskAvailable
            && (

              <section className="retail-live-panel">

                <div className="retail-panel-heading">

                  <div>

                    <h2>
                      Why FinClarity Scored It This Way
                    </h2>

                    <p>
                      Material portfolio-level observations only.
                    </p>

                  </div>

                  <Sparkles size={19} />

                </div>


                <div className="retail-flag-list">

                  {
                    flags.map(
                      (
                        flag,
                        index,
                      ) => (

                        <div
                          className={
                            `retail-flag ${
                              flag.type
                            }`
                          }
                          key={
                            `${flag.title}-${index}`
                          }
                        >

                          <span />

                          <div>

                            <strong>
                              {
                                flag.title
                              }
                            </strong>

                            <p>
                              {
                                flag.detail
                              }
                            </p>

                          </div>

                        </div>

                      )
                    )
                  }

                </div>

              </section>

            )
          }


          <footer className="retail-live-footer">

            <span>
              Market data may be delayed.
            </span>

            <span>
              Historical risk does not predict future losses.
            </span>

            <span>
              Sentiment is research context, not investment advice.
            </span>

          </footer>

        </div>

      </main>

    </div>
  );
}


export default
RetailDashboard;
