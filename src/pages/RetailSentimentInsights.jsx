import RetailTickerCompany from "../components/RetailTickerCompany";
import RetailTickerFilings from "../components/RetailTickerFilings";
import {
  BrainCircuit,
  Clock3,
  ExternalLink,
  Newspaper,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import RetailSidebar
  from "../components/RetailSidebar";

import useRetailPortfolio
  from "../hooks/useRetailPortfolio";

import {
  readRetailAnalysisCache,
} from "../lib/retailAnalysisCache";

import {
  extractRetailSentiment,
} from "../lib/retailResearchAnalytics";

import "./RetailDashboardLive.css";
import "./RetailResearchPages.css";


import RetailAnalysisNotice from "../components/RetailAnalysisNotice";
function confidenceText(
  value,
) {

  const number =
    Number(value);


  return Number.isFinite(
    number
  )
    ? `${(
        number * 100
      ).toFixed(1)}%`
    : "—";
}


function scoreText(
  value,
) {

  const number =
    Number(value);


  return Number.isFinite(
    number
  )
    ? (
        number >= 0
          ? `+${number.toFixed(3)}`
          : number.toFixed(3)
      )
    : "—";
}


function signalClass(
  label,
) {

  const value =
    String(
      label || ""
    )
      .toLowerCase();


  if (
    value.includes("bull")
    || value.includes("positive")
    || value.includes("green")
  ) {
    return "positive";
  }


  if (
    value.includes("bear")
    || value.includes("negative")
    || value.includes("red")
  ) {
    return "negative";
  }


  return "neutral";
}


function articleTone(
  article,
) {

  const sentiment =
    article?.sentiment
    ?? {};


  const score =
    Number(
      sentiment
        .sentiment_score
    );


  const confidence =
    Number(
      sentiment
        .model_confidence
    );


  if (
    !Number.isFinite(score)
    || !Number.isFinite(confidence)
  ) {
    return "neutral";
  }


  if (
    confidence < 0.55
  ) {
    return "neutral";
  }


  if (
    score >= 0.15
  ) {
    return "positive";
  }


  if (
    score <= -0.15
  ) {
    return "negative";
  }


  return "neutral";
}


function articleLabel(
  article,
) {

  const tone =
    articleTone(
      article
    );


  if (
    tone === "positive"
  ) {
    return "Positive";
  }


  if (
    tone === "negative"
  ) {
    return "Negative";
  }


  return "Neutral / Mixed";
}


function ageText(
  value,
) {

  const hours =
    Number(value);


  if (
    !Number.isFinite(hours)
  ) {
    return "Unknown age";
  }


  if (
    hours < 1
  ) {
    return "Less than 1h ago";
  }


  if (
    hours < 24
  ) {
    return `${Math.round(hours)}h ago`;
  }


  const days =
    Math.round(
      hours / 24
    );


  return (
    `${days}d ago`
  );
}


function importanceScore(
  article,
) {

  const relevance =
    Number(
      article
        ?.relevance_score
      ?? 0
    );

  const source =
    Number(
      article
        ?.source_weight
      ?? 0
    );

  const recency =
    Number(
      article
        ?.recency_weight
      ?? 0
    );

  const confidence =
    Number(
      article
        ?.sentiment
        ?.model_confidence
      ?? 0
    );


  return (
    relevance
    * source
    * recency
    * (
      0.6
      + (
        0.4
        * confidence
      )
    )
  );
}


function RetailSentimentInsights() {

  const portfolio =
    useRetailPortfolio();


  const cache =
    readRetailAnalysisCache(
      portfolio
    );


  const current =
    cache?.status === "current"
      ? cache
      : null;


  const rawSentiment =
    current
      ?.result
      ?.sentiment
    ?? null;


  const sentiment =
    extractRetailSentiment(
      rawSentiment
    );


  const tickerRows =
    Object.values(
      sentiment.byTicker
    );


  const articlesByTicker =
    rawSentiment
      ?.articles_by_ticker
    ?? {};


  const [
    selectedTicker,
    setSelectedTicker,
  ] =
    useState(
      tickerRows.find(
        (item) =>
          Number(
            item.articleCount
            ?? 0
          ) > 0
      )?.ticker
      ?? tickerRows[0]?.ticker
      ?? null
    );


  const [
    contentFilter,
    setContentFilter,
  ] =
    useState("all");


  const selectedSentiment =
    selectedTicker
      ? sentiment
          .byTicker[
            selectedTicker
          ]
      : null;


  const selectedArticles =
    [
      ...(
        selectedTicker
          ? (
              articlesByTicker[
                selectedTicker
              ]
              ?? []
            )
          : []
      ),
    ].sort(
      (
        left,
        right,
      ) =>
        importanceScore(
          right
        )
        - importanceScore(
            left
          )
    );

  const newsCount =
    selectedArticles.filter(
      (article) =>
        (
          article.source_type
          ?? "news"
        ) === "news"
    ).length;


  const socialCount =
    selectedArticles.filter(
      (article) =>
        article.source_type
        === "social"
    ).length;


  const filteredArticles =
    (
      contentFilter === "filing"
      || contentFilter === "company"
    )
      ? []
      : (
          contentFilter === "all"
            ? selectedArticles
            : selectedArticles.filter(
                (article) =>
                  (
                    article.source_type
                    ?? "news"
                  ) === contentFilter
              )
        );


  const socialProviderError =
    Boolean(
      selectedTicker
      && rawSentiment
          ?.errors
          ?.[selectedTicker]
          ?.reddit
    );



  return (
    <div className="retail-live-dashboard retail-research-page">

      <RetailSidebar
        active="sentiment"
      />


      <main className="retail-live-main">

        <div className="retail-research-content">

          <header className="retail-research-header">

            <div>

              <span>
                NEWS & SIGNALS
              </span>

              <h1>
                Sentiment Insights
              </h1>

              <p>
                See how recent financial news is being interpreted across every stock in your active portfolio.
              </p>

            </div>


            <Link
              to="/retail"
              className="retail-research-action"
            >
              <RefreshCw size={15} />
              Refresh from Dashboard
            </Link>

          </header>
          <RetailAnalysisNotice
            cache={cache}
          />



          {
            !current
              ? (

                <section className="retail-research-empty">

                  <BrainCircuit size={31} />

                  <h2>
                    Analysis required
                  </h2>

                  <p>
                    Run Analyse Portfolio from the Dashboard first. FinClarity will preserve the result while you move between Retail pages.
                  </p>

                  <Link to="/retail">
                    Go to Dashboard
                  </Link>

                </section>

              )
              : (

                <>

                  <section className="retail-research-kpis">

                    <article>

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

                      <small>
                        Current news interpretation
                      </small>

                    </article>


                    <article>

                      <span>
                        Sentiment Score
                      </span>

                      <strong>
                        {
                          scoreText(
                            sentiment
                              .portfolio
                              .score
                          )
                        }
                      </strong>

                      <small>
                        Positive minus negative probability
                      </small>

                    </article>


                    <article>

                      <span>
                        Model Confidence
                      </span>

                      <strong>
                        {
                          confidenceText(
                            sentiment
                              .portfolio
                              .confidence
                          )
                        }
                      </strong>

                      <small>
                        Confidence controls directional interpretation
                      </small>

                    </article>


                    <article>

                      <span>
                        Coverage
                      </span>

                      <strong>
                        {tickerRows.length}
                        /
                        {
                          portfolio
                            ?.holdings
                            ?.length
                          ?? 0
                        }
                      </strong>

                      <small>
                        Holdings with sentiment output
                      </small>

                    </article>

                  </section>


                  <section className="retail-research-panel">

                    <div className="retail-research-panel-heading">

                      <div>

                        <h2>
                          Holding Sentiment
                        </h2>

                        <p>
                          Select a stock to inspect the evidence behind its current signal.
                        </p>

                      </div>

                      <BrainCircuit size={18} />

                    </div>


                    <div className="retail-research-table">

                      <div className="retail-research-row header">

                        <span>
                          Ticker
                        </span>

                        <span>
                          Signal
                        </span>

                        <span>
                          Score
                        </span>

                        <span>
                          Confidence
                        </span>

                        <span>
                          Headlines
                        </span>

                      </div>


                      {
                        tickerRows.map(
                          (item) => (

                            <button
                              type="button"
                              className={
                                `retail-research-row retail-sentiment-stock-row ${
                                  selectedTicker
                                  === item.ticker
                                    ? "selected"
                                    : ""
                                }`
                              }
                              key={
                                item.ticker
                              }
                              onClick={
                                () =>
                                  setSelectedTicker(
                                    item.ticker
                                  )
                              }
                            >

                              <strong>
                                {item.ticker}
                              </strong>


                              <span
                                className={
                                  `retail-sentiment-pill ${
                                    signalClass(
                                      item.label
                                    )
                                  }`
                                }
                              >
                                {item.label}
                              </span>


                              <span>
                                {
                                  scoreText(
                                    item.score
                                  )
                                }
                              </span>


                              <span>
                                {
                                  confidenceText(
                                    item.confidence
                                  )
                                }
                              </span>


                              <span>
                                {
                                  item.articleCount
                                  ?? 0
                                }
                              </span>

                            </button>

                          )
                        )
                      }

                    </div>

                  </section>


                  {
                    selectedTicker
                    && (

                      <section className="retail-stock-intelligence">

                        <header className="retail-stock-intelligence-header">

                          <div>

                            <span>
                              STOCK INTELLIGENCE
                            </span>

                            <h2>
                              {selectedTicker}
                              {" "}
                              News Intelligence
                            </h2>

                            <p>
                              Highest-priority recent stories ranked by relevance, source quality, recency and model confidence.
                            </p>

                          </div>


                          <div
                            className={
                              `retail-stock-signal ${
                                signalClass(
                                  selectedSentiment
                                    ?.label
                                )
                              }`
                            }
                          >

                            <span>
                              Current Signal
                            </span>

                            <strong>
                              {
                                selectedSentiment
                                  ?.label
                                ?? "Unavailable"
                              }
                            </strong>

                            <small>
                              {
                                confidenceText(
                                  selectedSentiment
                                    ?.confidence
                                )
                              }
                              {" confidence"}
                            </small>

                          </div>

                        </header>

                        <div className="retail-content-filters">

                          <button
                            type="button"
                            className={
                              contentFilter === "all"
                                ? "active"
                                : ""
                            }
                            onClick={
                              () =>
                                setContentFilter(
                                  "all"
                                )
                            }
                          >
                            All
                            <span>
                              {
                                selectedArticles.length
                              }
                            </span>
                          </button>


                          <button
                            type="button"
                            className={
                              contentFilter === "news"
                                ? "active"
                                : ""
                            }
                            onClick={
                              () =>
                                setContentFilter(
                                  "news"
                                )
                            }
                          >
                            News
                            <span>
                              {newsCount}
                            </span>
                          </button>


                          <button
                            type="button"
                            className={
                              contentFilter === "social"
                                ? "active"
                                : ""
                            }
                            onClick={
                              () =>
                                setContentFilter(
                                  "social"
                                )
                            }
                          >
                            Social
                            <span>
                              {
                                socialProviderError
                                  ? "!"
                                  : socialCount
                              }
                            </span>
                          </button>


                          <button
                            type="button"
                            className={
                              contentFilter === "filing"
                                ? "active"
                                : ""
                            }
                            onClick={
                              () =>
                                setContentFilter(
                                  "filing"
                                )
                            }
                          >
                            Filings
                          </button>


                          <button
                            type="button"
                            className={
                              contentFilter === "company"
                                ? "active"
                                : ""
                            }
                            onClick={
                              () =>
                                setContentFilter(
                                  "company"
                                )
                            }
                          >
                            Company
                          </button>

                        </div>


                        {
                          socialProviderError
                          && (

                            <div className="retail-social-provider-state">

                              Social source temporarily rate-limited.
                              News intelligence remains fully active.

                            </div>

                          )
                        }



                        {
                          contentFilter === "filing"
                            ? (

                              <RetailTickerFilings
                                key={
                                  `filing-${selectedTicker}`
                                }
                                ticker={
                                  selectedTicker
                                }
                              />

                            )
                            : contentFilter === "company"
                            ? (

                              <RetailTickerCompany
                                key={
                                  `company-${selectedTicker}`
                                }
                                ticker={
                                  selectedTicker
                                }
                              />

                            )
                            : filteredArticles.length
                            ? (

                              <div className="retail-headline-list">

                                {
                                  filteredArticles.map(
                                    (
                                      article,
                                      index,
                                    ) => {

                                      const tone =
                                        articleTone(
                                          article
                                        );


                                      return (

                                        <article
                                          className={
                                            `retail-headline-card ${tone}`
                                          }
                                          key={
                                            `${
                                              article.link
                                              ?? article.title
                                            }-${index}`
                                          }
                                        >

                                          <div className="retail-headline-tone-bar" />


                                          <div className="retail-headline-main">

                                            <div className="retail-headline-meta">

                                              <span className="retail-headline-rank">
                                                #
                                                {
                                                  index + 1
                                                }
                                              </span>


                                              <span>
                                                {
                                                  article.source
                                                  ?? "Unknown source"
                                                }
                                              </span>


                                              <span>
                                                <Clock3 size={12} />

                                                {
                                                  ageText(
                                                    article.age_hours
                                                  )
                                                }
                                              </span>


                                              <span>
                                                {
                                                  article.provider
                                                  ?? "News"
                                                }
                                              </span>

                                            </div>


                                            <h3>
                                              {
                                                article.title
                                              }
                                            </h3>


                                            <div className="retail-headline-metrics">

                                              <span
                                                className={
                                                  `retail-headline-sentiment ${tone}`
                                                }
                                              >
                                                {
                                                  articleLabel(
                                                    article
                                                  )
                                                }
                                              </span>


                                              <span>
                                                Score
                                                {" "}
                                                <strong>
                                                  {
                                                    scoreText(
                                                      article
                                                        ?.sentiment
                                                        ?.sentiment_score
                                                    )
                                                  }
                                                </strong>
                                              </span>


                                              <span>
                                                Confidence
                                                {" "}
                                                <strong>
                                                  {
                                                    confidenceText(
                                                      article
                                                        ?.sentiment
                                                        ?.model_confidence
                                                    )
                                                  }
                                                </strong>
                                              </span>


                                              <span>
                                                Relevance
                                                {" "}
                                                <strong>
                                                  {
                                                    confidenceText(
                                                      article
                                                        ?.relevance_score
                                                    )
                                                  }
                                                </strong>
                                              </span>

                                            </div>

                                          </div>


                                          {
                                            article.link
                                            && (

                                              <a
                                                href={
                                                  article.link
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                aria-label={
                                                  `Open ${article.title}`
                                                }
                                              >
                                                <ExternalLink size={17} />
                                              </a>

                                            )
                                          }

                                        </article>

                                      );
                                    }
                                  )
                                }

                              </div>

                            )
                            : (

                              <div className="retail-no-headlines">

                                <Newspaper size={25} />

                                <div>

                                  <strong>
                                    {
                                      contentFilter === "social"
                                        ? (
                                            socialProviderError
                                              ? "Social source temporarily unavailable"
                                              : "No qualifying recent social discussion"
                                          )
                                        : "No sufficiently relevant recent headlines"
                                    }
                                  </strong>

                                  <p>
                                    {
                                      contentFilter === "social"
                                        ? (
                                            socialProviderError
                                              ? (
                                                  "The social-data provider is temporarily rate-limited. "
                                                  + "FinClarity has preserved the working news and regulatory evidence instead of treating the outage as neutral sentiment."
                                                )
                                              : (
                                                  `FinClarity found no sufficiently relevant recent social posts for ${selectedTicker} in the current lookback window.`
                                                )
                                          )
                                        : (
                                            `FinClarity found too little high-quality coverage for ${selectedTicker} in the current lookback window, so it is not manufacturing a directional signal.`
                                          )
                                    }
                                  </p>

                                </div>

                              </div>

                            )
                        }


                                                {
                          contentFilter === "all"
                          && (

                            <div className="retail-all-filings">

                              <RetailTickerFilings
                                key={
                                  `all-${selectedTicker}`
                                }
                                ticker={
                                  selectedTicker
                                }
                              />


                              <div
                                style={{
                                  marginTop:
                                    "20px",
                                }}
                              >
                                <RetailTickerCompany
                                  key={
                                    `all-company-${selectedTicker}`
                                  }
                                  ticker={
                                    selectedTicker
                                  }
                                />
                              </div>

                            </div>

                          )
                        }


<div className="retail-stock-methodology">

                          <ShieldCheck size={16} />

                          <div>

                            <strong>
                              Evidence-ranked, not headline-count ranked
                            </strong>

                            <p>
                              FinClarity prioritises stories using source quality × recency × ticker relevance, while FinBERT evaluates the language of each headline independently.
                            </p>

                          </div>

                        </div>

                      </section>

                    )
                  }


                  <section className="retail-methodology-note">

                    <BrainCircuit size={17} />

                    <div>

                      <strong>
                        How to interpret sentiment
                      </strong>

                      <p>
                        Sentiment measures language in recent financial news. It is not a forecast of future returns. Low-confidence readings are intentionally treated cautiously.
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


export default RetailSentimentInsights;
