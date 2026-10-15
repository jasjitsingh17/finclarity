import { API_BASE_URL } from "../lib/apiBase";
import useInstitutionalModelResult from "../hooks/useInstitutionalModelResult";
import InstitutionalModelStatus from "../components/InstitutionalModelStatus";
import { useState } from "react";
import {
  BarChart3,
  ChartNoAxesCombined,
  Gauge,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import "./FactorModels.css";


import InstitutionalSidebar from "../components/InstitutionalSidebar";

import {
  buildFactorRequest,
} from "../lib/institutionalModelRequests";

import "../design/FinClarityInstitutionalGlobalTypeScale.css";



const factorRequest = {

  tickers: [
    "AAPL",
    "MSFT",
    "NVDA",
  ],

  benchmark: "SPY",

  years: 3,

  articles_per_ticker: 5,

  lookback_hours: 72,
};


function percentage(
  value,
  digits = 2,
) {

  return `${(
    Number(value || 0)
    * 100
  ).toFixed(digits)}%`;
}


function signedNumber(
  value,
  digits = 2,
) {

  const numeric =
    Number(value || 0);

  return (
    `${numeric >= 0 ? "+" : ""}` +
    numeric.toFixed(digits)
  );
}


function scoreClass(
  value,
) {

  const numeric =
    Number(value || 0);


  if (numeric > 0.25) {
    return "factor-positive";
  }


  if (numeric < -0.25) {
    return "factor-negative";
  }


  return "factor-neutral";
}


function FactorModels() {

  const {
    result,
    saveResult,
    cacheStatus,
    cacheMetadata,
  } = useInstitutionalModelResult(
    "factors"
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


  async function runFactorModel() {

    setLoading(true);

    setError("");


    try {

      const response = await fetch(
        `${API_BASE_URL}/api/factors/analyse`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(buildFactorRequest(factorRequest)),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail
          || "Factor analysis failed."
        );
      }


      saveResult(
        data
      );


      if (
        data.assets?.length
      ) {

        setSelectedTicker(
          data.assets[0].ticker
        );
      }


    } catch (
      requestError
    ) {

      setError(
        requestError.message
      );


    } finally {

      setLoading(false);
    }
  }


  const assets =
    result?.assets
    ?? [];


  const selectedAsset =
    assets.find(
      (asset) =>
        asset.ticker
        === selectedTicker
    )
    ?? assets[0];


  const topAsset =
    assets[0];


  const factorWeights =
    result?.factor_weights
    ?? {};


  return (

    <div className="factor-page">

      <InstitutionalSidebar />


      <main className="factor-main fc-inst-standard-page">

        <header className="factor-header">

          <div>

            <p className="factor-eyebrow">
              MULTI-FACTOR RESEARCH
            </p>

            <h1>
              Factor Models
            </h1>

            <p>
              Compare systematic exposures,
              sentiment alpha and composite
              cross-sectional rankings.
            </p>

          </div>


          <button
            className="factor-run-button"
            onClick={runFactorModel}
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "factor-spin"
                  : ""
              }
            />

            {
              loading
                ? "Running Model..."
                : "Run Factor Model"
            }

          </button>

        </header>

        <InstitutionalModelStatus
          status={cacheStatus}
          metadata={cacheMetadata}
          modelName="Factor Models"
        />



        {error && (

          <div className="factor-error">
            {error}
          </div>

        )}


        {!result && (

          <section className="factor-empty">

            {
              loading
                ? (
                    <RefreshCw
                      size={36}
                      className="factor-spin"
                    />
                  )

                : (
                    <BarChart3
                      size={36}
                    />
                  )
            }


            <h2>
              {
                loading
                  ? "Estimating factor exposures"
                  : "Awaiting factor analysis"
              }
            </h2>


            <p>
              FinClarity will combine
              SPY-relative market beta,
              12–1 momentum, volatility,
              idiosyncratic risk and
              FinBERT sentiment into a
              cross-sectional factor model.
            </p>

          </section>

        )}


        {result && (

          <>

            <section className="factor-summary-grid">


              <div className="factor-summary-card">

                <span>
                  Top Ranked Asset
                </span>

                <strong>
                  {
                    topAsset
                      ?.ticker
                    ?? "—"
                  }
                </strong>

                <small>
                  Composite factor rank #1
                </small>

              </div>


              <div className="factor-summary-card">

                <span>
                  Composite Score
                </span>

                <strong
                  className={
                    scoreClass(
                      topAsset
                        ?.composite_alpha_score
                    )
                  }
                >
                  {
                    signedNumber(
                      topAsset
                        ?.composite_alpha_score,
                      2
                    )
                  }
                </strong>

                <small>
                  Standardised factor score
                </small>

              </div>


              <div className="factor-summary-card">

                <span>
                  Benchmark
                </span>

                <strong>
                  {
                    result
                      .benchmark
                  }
                </strong>

                <small>
                  Market beta reference
                </small>

              </div>


              <div className="factor-summary-card">

                <span>
                  Portfolio Regime
                </span>

                <strong>
                  {
                    result
                      .portfolio_sentiment
                      ?.regime
                    ?? "—"
                  }
                </strong>

                <small>
                  Live FinBERT sentiment
                </small>

              </div>

            </section>


            <section className="factor-panel">

              <div className="factor-panel-header">

                <div>

                  <h2>
                    Cross-Sectional Ranking
                  </h2>

                  <p>
                    Raw factor exposures
                    and composite model output.
                  </p>

                </div>

                <ChartNoAxesCombined
                  size={18}
                />

              </div>


              <div className="factor-table">

                <div className="factor-table-row header">

                  <span>
                    Rank
                  </span>

                  <span>
                    Ticker
                  </span>

                  <span>
                    Beta
                  </span>

                  <span>
                    Momentum
                  </span>

                  <span>
                    Volatility
                  </span>

                  <span>
                    Idio Risk
                  </span>

                  <span>
                    Sentiment
                  </span>

                  <span>
                    Composite
                  </span>

                </div>


                {
                  assets.map(
                    (asset) => (

                      <button
                        key={
                          asset.ticker
                        }
                        className={
                          `factor-table-row ${
                            selectedTicker
                            === asset.ticker
                              ? "selected"
                              : ""
                          }`
                        }
                        onClick={() =>
                          setSelectedTicker(
                            asset.ticker
                          )
                        }
                      >

                        <strong
                          className="factor-rank"
                        >
                          #
                          {
                            asset.rank
                          }
                        </strong>


                        <strong>
                          {
                            asset.ticker
                          }
                        </strong>


                        <span>
                          {
                            Number(
                              asset.beta
                            )
                            .toFixed(2)
                          }
                        </span>


                        <span>
                          {
                            percentage(
                              asset.momentum
                            )
                          }
                        </span>


                        <span>
                          {
                            percentage(
                              asset.volatility
                            )
                          }
                        </span>


                        <span>
                          {
                            percentage(
                              asset
                                .idiosyncratic_volatility
                            )
                          }
                        </span>


                        <span
                          className={
                            scoreClass(
                              asset.sentiment
                            )
                          }
                        >
                          {
                            signedNumber(
                              asset.sentiment,
                              3
                            )
                          }
                        </span>


                        <strong
                          className={
                            scoreClass(
                              asset
                                .composite_alpha_score
                            )
                          }
                        >
                          {
                            signedNumber(
                              asset
                                .composite_alpha_score,
                              2
                            )
                          }
                        </strong>

                      </button>

                    )
                  )
                }

              </div>

            </section>


            {
              selectedAsset
              && (

                <section className="factor-two-column">


                  <div className="factor-panel">

                    <div className="factor-panel-header">

                      <div>

                        <h2>
                          {
                            selectedAsset
                              .ticker
                          }
                          {" "}Factor Profile
                        </h2>

                        <p>
                          Standardised
                          cross-sectional
                          factor scores.
                        </p>

                      </div>

                      <Gauge
                        size={18}
                      />

                    </div>


                    <div className="factor-score-list">


                      {
                        [
                          [
                            "Momentum",
                            selectedAsset
                              .factor_scores
                              .momentum,
                          ],

                          [
                            "Low Volatility",
                            selectedAsset
                              .factor_scores
                              .low_volatility,
                          ],

                          [
                            "Low Idiosyncratic Risk",
                            selectedAsset
                              .factor_scores
                              .low_idiosyncratic_risk,
                          ],

                          [
                            "Sentiment Alpha",
                            selectedAsset
                              .factor_scores
                              .sentiment_alpha,
                          ],
                        ].map(
                          (
                            [
                              label,
                              value,
                            ]
                          ) => {

                            const numeric =
                              Number(
                                value || 0
                              );


                            const width =
                              Math.min(
                                Math.abs(
                                  numeric
                                )
                                * 33,
                                50
                              );


                            return (

                              <div
                                className="factor-score-item"
                                key={label}
                              >

                                <div className="factor-score-heading">

                                  <span>
                                    {label}
                                  </span>

                                  <strong
                                    className={
                                      scoreClass(
                                        numeric
                                      )
                                    }
                                  >
                                    {
                                      signedNumber(
                                        numeric,
                                        2
                                      )
                                    }
                                  </strong>

                                </div>


                                <div className="factor-score-axis">

                                  <div className="factor-score-centre" />

                                  <div
                                    className={
                                      numeric >= 0
                                        ? "factor-score-bar positive"
                                        : "factor-score-bar negative"
                                    }
                                    style={
                                      numeric >= 0
                                        ? {
                                            left:
                                              "50%",

                                            width:
                                              `${width}%`,
                                          }

                                        : {
                                            right:
                                              "50%",

                                            width:
                                              `${width}%`,
                                          }
                                    }
                                  />

                                </div>

                              </div>

                            );
                          }
                        )
                      }

                    </div>

                  </div>


                  <div className="factor-panel">

                    <div className="factor-panel-header">

                      <div>

                        <h2>
                          Exposure Snapshot
                        </h2>

                        <p>
                          Raw risk and
                          signal measurements.
                        </p>

                      </div>

                      <TrendingUp
                        size={18}
                      />

                    </div>


                    <div className="factor-exposure-grid">


                      <div>

                        <span>
                          Market Beta
                        </span>

                        <strong>
                          {
                            Number(
                              selectedAsset
                                .beta
                            )
                            .toFixed(2)
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          12–1 Momentum
                        </span>

                        <strong>
                          {
                            percentage(
                              selectedAsset
                                .momentum
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Annualised Vol.
                        </span>

                        <strong>
                          {
                            percentage(
                              selectedAsset
                                .volatility
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Idiosyncratic Vol.
                        </span>

                        <strong>
                          {
                            percentage(
                              selectedAsset
                                .idiosyncratic_volatility
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          FinBERT Score
                        </span>

                        <strong
                          className={
                            scoreClass(
                              selectedAsset
                                .sentiment
                            )
                          }
                        >
                          {
                            signedNumber(
                              selectedAsset
                                .sentiment,
                              3
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Sentiment Confidence
                        </span>

                        <strong>
                          {
                            percentage(
                              selectedAsset
                                .sentiment_confidence,
                              1
                            )
                          }
                        </strong>

                      </div>

                    </div>


                    <div className="factor-signal-line">

                      <span>
                        Sentiment Signal
                      </span>

                      <strong>
                        {
                          selectedAsset
                            .sentiment_signal
                        }
                      </strong>


                      <span
                        className={
                          `factor-rag ${
                            String(
                              selectedAsset
                                .rag_signal
                                ?.status
                              || "AMBER"
                            )
                            .toLowerCase()
                          }`
                        }
                      >
                        {
                          selectedAsset
                            .rag_signal
                            ?.status
                          ?? "AMBER"
                        }
                      </span>

                    </div>

                  </div>

                </section>

              )
            }


            <section className="factor-panel">

              <div className="factor-panel-header">

                <div>

                  <h2>
                    Factor Construction
                  </h2>

                  <p>
                    Weights used in the
                    current composite score.
                  </p>

                </div>

                <ShieldCheck
                  size={18}
                />

              </div>


              <div className="factor-weight-grid">


                <div>

                  <span>
                    Momentum
                  </span>

                  <strong>
                    {
                      percentage(
                        factorWeights
                          .momentum,
                        0
                      )
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Low Volatility
                  </span>

                  <strong>
                    {
                      percentage(
                        factorWeights
                          .low_volatility,
                        0
                      )
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Low Idiosyncratic Risk
                  </span>

                  <strong>
                    {
                      percentage(
                        factorWeights
                          .low_idiosyncratic_risk,
                        0
                      )
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Sentiment Alpha
                  </span>

                  <strong>
                    {
                      percentage(
                        factorWeights
                          .sentiment_alpha,
                        0
                      )
                    }
                  </strong>

                </div>

              </div>

            </section>


            <div className="factor-methodology">

              <span>
                Benchmark:
                {" "}
                {
                  result.benchmark
                }
              </span>

              <span>
                Window:
                {" "}
                {
                  result
                    .market_data
                    ?.start_date
                }
                {" → "}
                {
                  result
                    .market_data
                    ?.end_date
                }
              </span>

              <span>
                {
                  result
                    .market_data
                    ?.observations
                }
                {" "}price observations
              </span>

              <span>
                Composite score is
                cross-sectional, not
                realised investment alpha
              </span>

            </div>

          </>

        )}

      </main>

    </div>
  );
}


export default FactorModels;
