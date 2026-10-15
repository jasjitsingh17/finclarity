import { API_BASE_URL } from "../lib/apiBase";
import useInstitutionalModelResult from "../hooks/useInstitutionalModelResult";
import InstitutionalModelStatus from "../components/InstitutionalModelStatus";
import { useState } from "react";
import {
  Activity,
  BrainCircuit,
  ExternalLink,
  Newspaper,
  RefreshCw,
} from "lucide-react";

import "./SentimentIntelligence.css";


import InstitutionalSidebar from "../components/InstitutionalSidebar";

import {
  buildSentimentRequest,
} from "../lib/institutionalModelRequests";

import "../design/FinClarityInstitutionalGlobalTypeScale.css";



const sentimentRequest = {
  tickers: [
    "AAPL",
    "MSFT",
    "NVDA",
  ],

  articles_per_ticker: 5,

  lookback_hours: 72,
};


function percentage(
  value,
  digits = 1,
) {
  return `${(
    Number(value || 0)
    * 100
  ).toFixed(digits)}%`;
}


function signedScore(
  value,
) {
  const numericValue =
    Number(value || 0);

  return (
    numericValue >= 0
      ? `+${numericValue.toFixed(3)}`
      : numericValue.toFixed(3)
  );
}


function ragClass(
  status,
) {
  return (
    String(
      status || "AMBER"
    )
    .toLowerCase()
  );
}


function SentimentIntelligence() {

  const {
    result,
    saveResult,
    cacheStatus,
    cacheMetadata,
  } = useInstitutionalModelResult(
    "sentiment"
  );


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    selectedTicker,
    setSelectedTicker,
  ] = useState("AAPL");


  async function runSentimentAnalysis() {

    setLoading(true);
    setError("");

    try {

      const response = await fetch(
        `${API_BASE_URL}/api/sentiment/analyse`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(buildSentimentRequest(sentimentRequest)),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail
          || "Sentiment analysis failed."
        );
      }


      saveResult(
        data
      );


      if (
        data.tickers?.length
        && !data.tickers.includes(
          selectedTicker
        )
      ) {

        setSelectedTicker(
          data.tickers[0]
        );
      }


    } catch (requestError) {

      setError(
        requestError.message
      );


    } finally {

      setLoading(false);
    }
  }


  const portfolio =
    result?.portfolio_sentiment;


  const portfolioRag =
    portfolio?.rag_signal;


  const tickerData =
    result?.ticker_sentiment
    ?? {};


  const activeTicker =
    tickerData[
      selectedTicker
    ];


  const activeArticles =
    result
      ?.articles_by_ticker
      ?.[selectedTicker]
    ?? [];


  return (
    <div className="sentiment-page">

      <InstitutionalSidebar />


      <main className="sentiment-main fc-inst-standard-page">

        <header className="sentiment-header">

          <div>

            <p className="sentiment-eyebrow">
              INSTITUTIONAL RESEARCH
            </p>

            <h1>
              Sentiment Intelligence
            </h1>

            <p>
              Financial-news sentiment,
              confidence and signal attribution
              across the portfolio.
            </p>

          </div>


          <button
            className="sentiment-run-button"
            onClick={
              runSentimentAnalysis
            }
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "sentiment-spin"
                  : ""
              }
            />

            {
              loading
                ? "Analysing..."
                : "Run Sentiment Analysis"
            }

          </button>

        </header>

        <InstitutionalModelStatus
          status={cacheStatus}
          metadata={cacheMetadata}
          modelName="Sentiment Intelligence"
        />



        {error && (
          <div className="sentiment-error">
            {error}
          </div>
        )}


        {!result && !loading && (

          <section className="sentiment-empty">

            <BrainCircuit size={34} />

            <h2>
              Awaiting sentiment analysis
            </h2>

            <p>
              Run the model to retrieve
              recent financial headlines,
              score them with FinBERT and
              construct confidence-aware
              portfolio signals.
            </p>

          </section>

        )}


        {loading && !result && (

          <section className="sentiment-empty">

            <RefreshCw
              size={34}
              className="sentiment-spin"
            />

            <h2>
              Analysing financial news
            </h2>

            <p>
              Retrieving headlines and
              running FinBERT inference.
            </p>

          </section>

        )}


        {result && (

          <>
            <section className="sentiment-summary-grid">

              <div className="sentiment-summary-card">

                <span>
                  Portfolio Regime
                </span>

                <strong>
                  {
                    portfolio
                      ?.regime
                    ?? "—"
                  }
                </strong>

                <small>
                  Confidence-aware
                  classification
                </small>

              </div>


              <div className="sentiment-summary-card">

                <span>
                  Sentiment Score
                </span>

                <strong>
                  {
                    signedScore(
                      portfolio
                        ?.sentiment_score
                    )
                  }
                </strong>

                <small>
                  FinBERT weighted score
                </small>

              </div>


              <div className="sentiment-summary-card">

                <span>
                  Confidence
                </span>

                <strong>
                  {
                    percentage(
                      portfolio
                        ?.confidence
                    )
                  }
                </strong>

                <small>
                  Portfolio-level
                  conviction
                </small>

              </div>


              <div className="sentiment-summary-card">

                <span>
                  Research Signal
                </span>

                <div
                  className={
                    `sentiment-rag large ${
                      ragClass(
                        portfolioRag
                          ?.status
                      )
                    }`
                  }
                >
                  {
                    portfolioRag
                      ?.status
                    ?? "AMBER"
                  }
                </div>

                <small>
                  {
                    portfolioRag
                      ?.label
                    ?? "Awaiting signal"
                  }
                </small>

              </div>

            </section>


            <section className="sentiment-panel">

              <div className="sentiment-panel-header">

                <div>

                  <h2>
                    Portfolio Signal
                  </h2>

                  <p>
                    Why the current RAG
                    classification was assigned.
                  </p>

                </div>


                <div
                  className={
                    `sentiment-rag ${
                      ragClass(
                        portfolioRag
                          ?.status
                      )
                    }`
                  }
                >
                  {
                    portfolioRag
                      ?.status
                    ?? "AMBER"
                  }
                </div>

              </div>


              <div className="sentiment-explanation">

                <Activity size={18} />

                <div>

                  <strong>
                    {
                      portfolioRag
                        ?.label
                      ?? "Neutral"
                    }
                  </strong>

                  <p>
                    {
                      portfolioRag
                        ?.reason
                      ?? "No explanation available."
                    }
                  </p>

                </div>

              </div>

            </section>


            <section className="sentiment-panel">

              <div className="sentiment-panel-header">

                <div>

                  <h2>
                    Ticker Sentiment
                  </h2>

                  <p>
                    Weighted FinBERT signal
                    by portfolio constituent.
                  </p>

                </div>

                <span className="sentiment-article-total">

                  <Newspaper size={14} />

                  {
                    result
                      .total_articles
                  }{" "}
                  headlines

                </span>

              </div>


              <div className="sentiment-table">

                <div className="sentiment-table-row header">

                  <span>
                    Ticker
                  </span>

                  <span>
                    Score
                  </span>

                  <span>
                    Confidence
                  </span>

                  <span>
                    Signal
                  </span>

                  <span>
                    Headlines
                  </span>

                  <span>
                    RAG
                  </span>

                </div>


                {
                  result.tickers.map(
                    (ticker) => {

                      const tickerResult =
                        tickerData[
                          ticker
                        ];


                      const rag =
                        tickerResult
                          ?.rag_signal;


                      return (

                        <button
                          key={ticker}
                          className={
                            `sentiment-table-row ${
                              selectedTicker
                              === ticker
                                ? "selected"
                                : ""
                            }`
                          }
                          onClick={() =>
                            setSelectedTicker(
                              ticker
                            )
                          }
                        >

                          <strong>
                            {ticker}
                          </strong>


                          <span>
                            {
                              signedScore(
                                tickerResult
                                  ?.sentiment_score
                              )
                            }
                          </span>


                          <span>
                            {
                              percentage(
                                tickerResult
                                  ?.confidence
                              )
                            }
                          </span>


                          <span>
                            {
                              tickerResult
                                ?.signal
                              ?? "—"
                            }
                          </span>


                          <span>
                            {
                              tickerResult
                                ?.article_count
                              ?? 0
                            }
                          </span>


                          <span
                            className={
                              `sentiment-rag ${
                                ragClass(
                                  rag
                                    ?.status
                                )
                              }`
                            }
                          >
                            {
                              rag
                                ?.status
                              ?? "AMBER"
                            }
                          </span>

                        </button>

                      );
                    }
                  )
                }

              </div>

            </section>


            {activeTicker && (

              <section className="sentiment-research-grid">

                <div className="sentiment-panel">

                  <div className="sentiment-panel-header">

                    <div>

                      <h2>
                        {selectedTicker}
                        {" "}Signal Breakdown
                      </h2>

                      <p>
                        Headline distribution
                        and model conviction.
                      </p>

                    </div>


                    <span
                      className={
                        `sentiment-rag ${
                          ragClass(
                            activeTicker
                              .rag_signal
                              ?.status
                          )
                        }`
                      }
                    >
                      {
                        activeTicker
                          .rag_signal
                          ?.status
                        ?? "AMBER"
                      }
                    </span>

                  </div>


                  <div className="sentiment-breakdown">

                    <div>
                      <span>
                        Positive
                      </span>

                      <strong>
                        {
                          activeTicker
                            .positive_articles
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        Neutral
                      </span>

                      <strong>
                        {
                          activeTicker
                            .neutral_articles
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        Negative
                      </span>

                      <strong>
                        {
                          activeTicker
                            .negative_articles
                        }
                      </strong>
                    </div>

                  </div>


                  <div className="sentiment-signal-reason">

                    <strong>
                      {
                        activeTicker
                          .rag_signal
                          ?.label
                        ?? "Neutral"
                      }
                    </strong>

                    <p>
                      {
                        activeTicker
                          .rag_signal
                          ?.reason
                        ?? ""
                      }
                    </p>

                  </div>

                </div>


                <div className="sentiment-panel headlines">

                  <div className="sentiment-panel-header">

                    <div>

                      <h2>
                        Recent Headlines
                      </h2>

                      <p>
                        News observations used
                        in the current signal.
                      </p>

                    </div>

                  </div>


                  <div className="sentiment-headline-list">

                    {
                      activeArticles.length
                        ? activeArticles.map(
                            (
                              article,
                              index,
                            ) => (

                              <article
                                className="sentiment-headline"
                                key={
                                  `${selectedTicker}-${index}`
                                }
                              >

                                <div className="sentiment-headline-top">

                                  <span>
                                    {
                                      article
                                        .source
                                    }
                                  </span>

                                  <span>
                                    {
                                      Number(
                                        article
                                          .age_hours
                                        || 0
                                      )
                                      .toFixed(1)
                                    }h ago
                                  </span>

                                </div>


                                <h3>
                                  {
                                    article
                                      .title
                                  }
                                </h3>


                                <div className="sentiment-headline-footer">

                                  <span>
                                    {
                                      article
                                        .sentiment
                                        ?.dominant_label
                                      ?? "neutral"
                                    }
                                  </span>


                                  <span>
                                    {
                                      percentage(
                                        article
                                          .sentiment
                                          ?.model_confidence
                                      )
                                    }
                                    {" "}confidence
                                  </span>


                                  {
                                    article.link
                                    && (

                                      <a
                                        href={
                                          article
                                            .link
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                      >

                                        Source

                                        <ExternalLink
                                          size={12}
                                        />

                                      </a>

                                    )
                                  }

                                </div>

                              </article>

                            )
                          )

                        : (
                            <div className="sentiment-no-news">
                              No recent headlines
                              available.
                            </div>
                          )
                    }

                  </div>

                </div>

              </section>

            )}


            <section className="sentiment-methodology">

              <span>
                Model:
                {" "}
                {
                  result
                    .methodology
                    ?.sentiment_model
                }
              </span>

              <span>
                Headline weighting:
                {" "}
                source quality × recency × relevance
              </span>

              <span>
                Signal:
                {" "}
                confidence-aware RAG
              </span>

            </section>

          </>

        )}

      </main>

    </div>
  );
}


export default SentimentIntelligence;
