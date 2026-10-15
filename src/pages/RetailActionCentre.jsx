import { API_BASE_URL } from "../lib/apiBase";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import RetailSidebar
  from "../components/RetailSidebar";

import "./RetailDashboardLive.css";
import "./RetailActionCentre.css";


const API = API_BASE_URL;

const SNAPSHOT_KEY =
  "finclarity_retail_market_snapshot_v1";


const CATEGORY_ROUTE = {
  Exposure:
    "/retail/exposure",

  Diversification:
    "/retail/diversification",

  Stress:
    "/retail/stress",

  Performance:
    "/retail/performance",

  Sentiment:
    "/retail/sentiment",
};


function findMarketObject(
  value,
  depth = 0,
) {

  if (
    !value
    || typeof value !== "object"
    || depth > 6
  ) {
    return null;
  }


  if (
    Array.isArray(
      value.holdings
    )
  ) {
    return value;
  }


  for (
    const child
    of Object.values(
      value
    )
  ) {

    const found =
      findMarketObject(
        child,
        depth + 1,
      );


    if (found) {
      return found;
    }

  }


  return null;
}


function readMarketSnapshot() {

  try {

    const raw =
      window.localStorage
        .getItem(
          SNAPSHOT_KEY
        );


    if (!raw) {
      return null;
    }


    return findMarketObject(
      JSON.parse(
        raw
      )
    );

  } catch {

    return null;

  }
}


function buildRequest(
  market,
) {

  if (
    !market
    || !Array.isArray(
      market.holdings
    )
  ) {
    return null;
  }


  const candidates =
    market.holdings
      .map(
        (holding) => {

          const ticker =
            String(
              holding?.ticker
              ?? holding?.symbol
              ?? ""
            )
              .trim()
              .toUpperCase();


          const weight =
            Number(
              holding?.weight
            );


          const marketValue =
            Number(
              holding?.market_value
              ?? holding?.marketValue
              ?? holding?.value
            );


          return {
            ticker,
            weight,
            marketValue,
            status:
              holding?.status,
          };

        }
      )
      .filter(
        (holding) =>
          holding.ticker
          && (
            holding.status
            === undefined
            || holding.status
            === "live"
          )
      );


  if (
    candidates.length === 0
  ) {
    return null;
  }


  let weights =
    candidates.map(
      (holding) =>
        Number.isFinite(
          holding.weight
        )
          ? holding.weight
          : 0
    );


  let totalWeight =
    weights.reduce(
      (sum, value) =>
        sum + value,
      0
    );


  if (
    totalWeight <= 0
  ) {

    const values =
      candidates.map(
        (holding) =>
          Number.isFinite(
            holding.marketValue
          )
            ? holding.marketValue
            : 0
      );


    const totalValue =
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      );


    if (
      totalValue <= 0
    ) {
      return null;
    }


    weights =
      values.map(
        (value) =>
          value / totalValue
      );


    totalWeight = 1;

  }


  weights =
    weights.map(
      (value) =>
        value / totalWeight
    );


  const holdingValue =
    candidates.reduce(
      (sum, holding) =>
        sum
        + (
            Number.isFinite(
              holding.marketValue
            )
              ? holding.marketValue
              : 0
          ),
      0
    );


  const portfolioValue =
    Number(
      market.total_market_value
      ?? market.totalMarketValue
      ?? market.portfolio_value
      ?? market.portfolioValue
      ?? holdingValue
    );


  const currency =
    String(
      market.base_currency
      ?? market.baseCurrency
      ?? market.currency
      ?? "GBP"
    )
      .trim()
      .toUpperCase();


  return {
    tickers:
      candidates.map(
        (holding) =>
          holding.ticker
      ),

    weights,

    portfolio_value:
      Number.isFinite(
        portfolioValue
      )
        ? portfolioValue
        : null,

    currency:
      currency || "GBP",

    benchmark:
      "ACWI",

    years:
      3,

    max_items:
      6,
  };
}


function priorityLabel(
  priority,
) {

  if (
    priority === "high"
  ) {
    return "HIGH PRIORITY";
  }


  if (
    priority === "medium"
  ) {
    return "REVIEW";
  }


  return "CONTEXT";
}


function nullableNumber(
  value,
) {

  if (
    value === null
    || value === undefined
    || value === ""
  ) {
    return null;
  }


  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : null;
}


function attentionClassName(
  value,
) {

  const normalized =
    String(
      value
      ?? "Unavailable"
    )
      .trim()
      .toLowerCase();


  if (
    normalized
    === "no material findings"
  ) {
    return "no-findings";
  }


  if (
    [
      "high",
      "moderate",
      "low",
      "unavailable",
    ].includes(
      normalized
    )
  ) {
    return normalized;
  }


  return "unavailable";
}


function RetailActionCentre() {

  const [
    market,
    setMarket,
  ] =
    useState(
      () =>
        readMarketSnapshot()
    );


  const [
    result,
    setResult,
  ] =
    useState(
      null
    );


  const [
    error,
    setError,
  ] =
    useState(
      null
    );


  const [
    refreshToken,
    setRefreshToken,
  ] =
    useState(
      0
    );


  const request =
    useMemo(
      () =>
        buildRequest(
          market
        ),
      [
        market,
      ]
    );


  const requestJson =
    useMemo(
      () =>
        request
          ? JSON.stringify(
              request
            )
          : "",
      [
        request,
      ]
    );


  const loading =
    Boolean(
      requestJson
      && !result
      && !error
    );


  useEffect(
    () => {

      if (
        !requestJson
      ) {
        return undefined;
      }


      const controller =
        new AbortController();


      const timeout =
        window.setTimeout(
          () => {
            controller.abort();
          },
          12000
        );


      let cancelled =
        false;


      async function run() {

        try {

          const response =
            await fetch(
              `${API}/api/action-centre/analyse`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  requestJson,

                signal:
                  controller.signal,
              }
            );


          const payload =
            await response.json();


          if (
            !response.ok
          ) {
            throw new Error(
              payload?.detail
              ?? "Action Centre analysis failed."
            );
          }


          if (
            cancelled
          ) {
            return;
          }


          setResult(
            payload
          );

          setError(
            null
          );

        } catch (
          runError
        ) {

          if (
            cancelled
          ) {
            return;
          }


          if (
            runError?.name
            === "AbortError"
          ) {

            setError(
              "The Action Centre took too long to respond. Please try Refresh Intelligence."
            );

          } else {

            setError(
              runError?.message
              ?? "Action Centre analysis failed."
            );

          }

        } finally {

          window.clearTimeout(
            timeout
          );

        }

      }


      run();


      return () => {

        cancelled =
          true;

        controller.abort();

        window.clearTimeout(
          timeout
        );

      };

    },
    [
      requestJson,
      refreshToken,
    ]
  );


  const refresh =
    () => {

      setMarket(
        readMarketSnapshot()
      );

      setResult(
        null
      );

      setError(
        null
      );

      setRefreshToken(
        (value) =>
          value + 1
      );

    };


  if (
    !request
  ) {

    return (
      <div className="retail-live-dashboard retail-action-page">

        <RetailSidebar
          active="action"
        />


        <main className="retail-live-main">

          <section className="retail-action-empty">

            <Sparkles size={34} />

            <h1>
              Portfolio Action Centre
            </h1>

            <p>
              FinClarity needs a live portfolio snapshot before it can synthesise your portfolio intelligence.
            </p>

            <Link to="/retail">
              Analyse Portfolio
            </Link>

          </section>

        </main>

      </div>
    );

  }


  const items =
    Array.isArray(
      result?.items
    )
      ? result.items
      : [];


  const topItem =
    result?.top_item
    ?? items[0]
    ?? null;


  const status =
    result?.analytics_status
    ?? {};


  const sentiment =
    result
      ?.source_analytics
      ?.sentiment
    ?? null;


  const portfolioSentiment =
    sentiment
      ?.portfolio_sentiment
    ?? null;


  const tickerSentiment =
    sentiment
      ?.ticker_sentiment
    ?? {};


  const sentimentRegime =
    String(
      portfolioSentiment
        ?.regime
      ?? "Unavailable"
    );


  const sentimentConfidence =
    nullableNumber(
      portfolioSentiment
        ?.confidence
    );


  const sentimentScore =
    nullableNumber(
      portfolioSentiment
        ?.sentiment_score
    );


  const totalArticles =
    nullableNumber(
      sentiment
        ?.total_articles
    );


  return (
    <div className="retail-live-dashboard retail-action-page">

      <RetailSidebar
        active="action"
      />


      <main className="retail-live-main">

        <div className="retail-action-content">

          <header className="retail-action-header">

            <div>

              <span>
                PORTFOLIO SYNTHESIS
              </span>

              <h1>
                Portfolio Action Centre
              </h1>

              <p>
                See which portfolio findings deserve attention first, combining concentration, diversification, stress, benchmark and sentiment evidence.
              </p>

            </div>


            <button
              type="button"
              onClick={
                refresh
              }
            >
              <RefreshCw size={15} />
              Refresh Intelligence
            </button>

          </header>


          {
            error
            && (

              <div className="retail-action-error">

                <AlertTriangle size={16} />

                <span>
                  {error}
                </span>

              </div>

            )
          }


          {
            loading
            && (

              <section className="retail-action-loading">

                <Sparkles size={28} />

                <strong>
                  Synthesising portfolio intelligence…
                </strong>

                <span>
                  Combining the existing FinClarity analytical engines.
                </span>

              </section>

            )
          }


          {
            result
            && (

              <>

                <section className="retail-action-overview">

                  <article className={
                    `retail-action-attention ${
                      attentionClassName(
                        result.attention_level
                      )
                    }`
                  }>

                    <span>
                      ATTENTION LEVEL
                    </span>

                    <strong>
                      {
                        result.attention_level
                        ?? "Unavailable"
                      }
                    </strong>

                    <p>
                      Determined by the highest-ranked portfolio observations.
                    </p>

                  </article>


                  <article>

                    <span>
                      High Priority
                    </span>

                    <strong className="high">
                      {
                        result?.counts?.high
                        ?? "—"
                      }
                    </strong>

                    <small>
                      strongest review signals
                    </small>

                  </article>


                  <article>

                    <span>
                      Review
                    </span>

                    <strong className="medium">
                      {
                        result?.counts?.medium
                        ?? "—"
                      }
                    </strong>

                    <small>
                      moderate attention items
                    </small>

                  </article>


                  <article>

                    <span>
                      Context
                    </span>

                    <strong className="context">
                      {
                        result?.counts?.context
                        ?? "—"
                      }
                    </strong>

                    <small>
                      supporting evidence
                    </small>

                  </article>

                </section>


                {
                  topItem
                  && (

                    <section className="retail-action-hero">

                      <div className="retail-action-hero-icon">

                        <Target size={20} />

                      </div>


                      <div className="retail-action-hero-copy">

                        <div className="retail-action-hero-meta">

                          <span className={
                            topItem.priority
                          }>
                            #1 PRIORITY
                          </span>

                          <span>
                            {
                              topItem.category
                            }
                          </span>

                        </div>


                        <h2>
                          {
                            topItem.title
                          }
                        </h2>


                        <p>
                          {
                            topItem.summary
                          }
                        </p>


                        <div className="retail-action-review">

                          <Target size={14} />

                          <span>
                            {
                              topItem.review_prompt
                            }
                          </span>

                        </div>

                      </div>


                      {
                        CATEGORY_ROUTE[
                          topItem.category
                        ]
                        && (

                          <Link
                            className="retail-action-hero-link"
                            to={
                              CATEGORY_ROUTE[
                                topItem.category
                              ]
                            }
                          >
                            Explore analysis
                            <ArrowRight size={14} />
                          </Link>

                        )
                      }

                    </section>

                  )
                }


                <section className="retail-action-main-grid">

                  <div className="retail-action-priority-list">

                    <header>

                      <div>

                        <Sparkles size={18} />

                        <div>

                          <h2>
                            Ranked Portfolio Observations
                          </h2>

                          <p>
                            Ordered by diagnostic materiality rather than investment recommendation.
                          </p>

                        </div>

                      </div>

                    </header>


                    {
                      items.map(
                        (
                          item,
                          index,
                        ) => (

                          <article
                            className={
                              `retail-action-item ${
                                item.priority
                              }`
                            }
                            key={
                              item.id
                            }
                          >

                            <div className="retail-action-rank">

                              <span>
                                #{index + 1}
                              </span>

                            </div>


                            <div className="retail-action-item-body">

                              <div className="retail-action-item-top">

                                <div>

                                  <span className={
                                    `retail-action-priority-badge ${
                                      item.priority
                                    }`
                                  }>
                                    {
                                      priorityLabel(
                                        item.priority
                                      )
                                    }
                                  </span>


                                  <span className="retail-action-category">
                                    {
                                      item.category
                                    }
                                  </span>

                                </div>


                                {
                                  CATEGORY_ROUTE[
                                    item.category
                                  ]
                                  && (

                                    <Link
                                      to={
                                        CATEGORY_ROUTE[
                                          item.category
                                        ]
                                      }
                                    >
                                      <ArrowRight size={16} />
                                    </Link>

                                  )
                                }

                              </div>


                              <h3>
                                {
                                  item.title
                                }
                              </h3>


                              <p>
                                {
                                  item.summary
                                }
                              </p>


                              {
                                Array.isArray(
                                  item.evidence
                                )
                                && item.evidence.length > 0
                                && (

                                  <div className="retail-action-evidence">

                                    {
                                      item.evidence.map(
                                        (
                                          metric,
                                          metricIndex,
                                        ) => (

                                          <div
                                            key={
                                              `${item.id}-${metricIndex}`
                                            }
                                          >

                                            <span>
                                              {
                                                metric.label
                                              }
                                            </span>

                                            <strong>
                                              {
                                                metric.display
                                              }
                                            </strong>

                                          </div>

                                        )
                                      )
                                    }

                                  </div>

                                )
                              }


                              <div className="retail-action-review-line">

                                <Target size={14} />

                                <span>
                                  {
                                    item.review_prompt
                                  }
                                </span>

                              </div>

                            </div>

                          </article>

                        )
                      )
                    }

                  </div>


                  <aside className="retail-action-side">

                    <section className="retail-action-coverage">

                      <header>

                        <ShieldCheck size={18} />

                        <div>

                          <h2>
                            Intelligence Coverage
                          </h2>

                          <p>
                            Analytics included in this synthesis.
                          </p>

                        </div>

                      </header>


                      {
                        Object.entries(
                          status
                        )
                          .map(
                            (
                              [
                                key,
                                value,
                              ]
                            ) => (

                              <div
                                className="retail-action-coverage-row"
                                key={
                                  key
                                }
                              >

                                <span>
                                  {
                                    key
                                      .charAt(0)
                                      .toUpperCase()
                                    + key.slice(1)
                                  }
                                </span>

                                <strong className={
                                  value
                                }>
                                  {
                                    value
                                  }
                                </strong>

                              </div>

                            )
                          )
                      }

                    </section>


                    {
                      sentiment
                      && (

                        <section className="retail-action-sentiment">

                          <header>

                            <BrainCircuit size={18} />

                            <div>

                              <h2>
                                Current Sentiment Pulse
                              </h2>

                              <p>
                                FinBERT headline tone from the current evidence window.
                              </p>

                            </div>

                          </header>


                          <div className="retail-action-sentiment-hero">

                            <div>

                              <span>
                                PORTFOLIO REGIME
                              </span>

                              <strong className={
                                sentimentRegime
                                  .toLowerCase()
                              }>
                                {
                                  sentimentRegime
                                }
                              </strong>

                            </div>


                            <div>

                              <span>
                                CONFIDENCE
                              </span>

                              <strong>
                                {
                                  Number.isFinite(
                                    sentimentConfidence
                                  )
                                    ? `${
                                        (
                                          sentimentConfidence
                                          * 100
                                        ).toFixed(
                                          0
                                        )
                                      }%`
                                    : "—"
                                }
                              </strong>

                            </div>


                            <div>

                              <span>
                                ARTICLES
                              </span>

                              <strong>
                                {
                                  Number.isFinite(
                                    totalArticles
                                  )
                                    ? totalArticles
                                    : "—"
                                }
                              </strong>

                            </div>

                          </div>


                          {
                            Number.isFinite(
                              sentimentScore
                            )
                            && (

                              <div className="retail-action-sentiment-score">

                                <span>
                                  Aggregate score
                                </span>

                                <strong>
                                  {
                                    sentimentScore > 0
                                      ? "+"
                                      : ""
                                  }
                                  {
                                    sentimentScore
                                      .toFixed(
                                        2
                                      )
                                  }
                                </strong>

                              </div>

                            )
                          }


                          <div className="retail-action-sentiment-tickers">

                            {
                              Object.entries(
                                tickerSentiment
                              )
                                .slice(
                                  0,
                                  5
                                )
                                .map(
                                  (
                                    [
                                      ticker,
                                      data,
                                    ]
                                  ) => {

                                    const label =
                                      String(
                                        data?.signal
                                        ?? data?.regime
                                        ?? data?.label
                                        ?? "Unavailable"
                                      );


                                    const confidence =
                                      Number(
                                        data?.confidence
                                      );


                                    const count =
                                      Number(
                                        data?.article_count
                                      );


                                    return (
                                      <div
                                        key={
                                          ticker
                                        }
                                      >

                                        <div>

                                          <strong>
                                            {
                                              ticker
                                            }
                                          </strong>

                                          <span className={
                                            label
                                              .toLowerCase()
                                          }>
                                            {
                                              label
                                            }
                                          </span>

                                        </div>


                                        <small>
                                          {
                                            Number.isFinite(
                                              confidence
                                            )
                                              ? `${
                                                  (
                                                    confidence
                                                    * 100
                                                  ).toFixed(
                                                    0
                                                  )
                                                }% confidence`
                                              : "confidence unavailable"
                                          }

                                          {
                                            Number.isFinite(
                                              count
                                            )
                                              ? ` · ${count} items`
                                              : ""
                                          }
                                        </small>

                                      </div>
                                    );

                                  }
                                )
                            }

                          </div>


                          <Link
                            to="/retail/sentiment"
                            className="retail-action-sentiment-link"
                          >
                            Open Sentiment Insights
                            <ArrowRight size={14} />
                          </Link>


                          <p className="retail-action-sentiment-note">
                            Headline sentiment is research context, not a forecast of future returns.
                          </p>

                        </section>

                      )
                    }


                    <section className="retail-action-principles">

                      <header>

                        <Target size={18} />

                        <div>

                          <h2>
                            How to use this
                          </h2>

                          <p>
                            Prioritisation, not portfolio instructions.
                          </p>

                        </div>

                      </header>


                      <div>

                        <strong>
                          Start at the top
                        </strong>

                        <p>
                          Higher-ranked findings represent stronger diagnostic evidence.
                        </p>

                      </div>


                      <div>

                        <strong>
                          Follow the evidence
                        </strong>

                        <p>
                          Open the underlying analytical page to inspect the numbers behind each observation.
                        </p>

                      </div>


                      <div>

                        <strong>
                          No buy or sell calls
                        </strong>

                        <p>
                          FinClarity highlights evidence to review rather than issuing investment recommendations.
                        </p>

                      </div>

                    </section>

                  </aside>

                </section>


                <section className="retail-action-methodology">

                  <ShieldCheck size={17} />

                  <div>

                    <strong>
                      Deterministic evidence ranking
                    </strong>

                    <p>
                      FinClarity combines outputs from its existing analytics using explicit thresholds. Rankings describe portfolio diagnostics and historical evidence; they do not forecast future returns or determine investment suitability.
                    </p>

                  </div>

                </section>

              </>

            )
          }

        </div>

      </main>

    </div>
  );
}


export default RetailActionCentre;
