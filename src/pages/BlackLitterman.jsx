import { API_BASE_URL } from "../lib/apiBase";
import useInstitutionalModelResult from "../hooks/useInstitutionalModelResult";
import InstitutionalModelStatus from "../components/InstitutionalModelStatus";
import { useState } from "react";
import {
  BrainCircuit,
  ChartNoAxesCombined,
  CircleGauge,
  RefreshCw,
  Scale,
  ShieldCheck,
} from "lucide-react";

import "./BlackLitterman.css";


import InstitutionalSidebar from "../components/InstitutionalSidebar";

import {
  buildBlackLittermanRequest,
} from "../lib/institutionalModelRequests";

import "../design/FinClarityInstitutionalGlobalTypeScale.css";



const blackLittermanRequest = {

  tickers: [
    "AAPL",
    "MSFT",
    "NVDA",
  ],

  reference_weights: [
    0.3333,
    0.3333,
    0.3334,
  ],

  years: 3,

  risk_free_rate: 0.04,

  risk_aversion: 2.5,

  tau: 0.05,

  view_scale: 0.06,

  min_weight: 0,

  max_weight: 1,

  frontier_points: 20,

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


function signedPercentage(
  value,
  digits = 2,
) {

  const numeric =
    Number(value || 0);

  const percent =
    numeric * 100;

  return (
    `${percent >= 0 ? "+" : ""}` +
    `${percent.toFixed(digits)}%`
  );
}


function BlackLitterman() {

  const {
    result,
    saveResult,
    cacheStatus,
    cacheMetadata,
  } = useInstitutionalModelResult(
    "black-litterman"
  );


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  async function runModel() {

    setLoading(true);

    setError("");


    try {

      const response = await fetch(
        `${API_BASE_URL}/api/black-litterman/analyse`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(buildBlackLittermanRequest(blackLittermanRequest)),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail
          || "Black-Litterman analysis failed."
        );
      }


      saveResult(
        data
      );


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


  const priorReturns =
    result?.prior
      ?.expected_returns
    ?? {};


  const viewReturns =
    result?.sentiment_views
      ?.view_returns
    ?? {};


  const posteriorReturns =
    result?.posterior
      ?.expected_returns
    ?? {};


  const referenceWeights =
    result?.prior
      ?.reference_weights
    ?? {};


  const posteriorWeights =
    result?.maximum_sharpe
      ?.weights
    ?? {};


  const viewDetails =
    result?.sentiment_views
      ?.views
    ?? [];


  const viewMap =
    Object.fromEntries(
      viewDetails.map(
        (view) => [
          view.ticker,
          view,
        ]
      )
    );


  return (

    <div className="bl-page">

      <InstitutionalSidebar />


      <main className="bl-main fc-inst-standard-page">

        <header className="bl-header">

          <div>

            <p className="bl-eyebrow">
              PORTFOLIO CONSTRUCTION
            </p>

            <h1>
              Black–Litterman
            </h1>

            <p>
              Blend equilibrium returns
              with confidence-weighted
              sentiment views.
            </p>

          </div>


          <button
            className="bl-run-button"
            onClick={runModel}
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "bl-spin"
                  : ""
              }
            />

            {
              loading
                ? "Running Model..."
                : error
                  ? "Retry Black–Litterman"
                  : "Run Black–Litterman"
            }

          </button>

        </header>

        <InstitutionalModelStatus
          status={cacheStatus}
          metadata={cacheMetadata}
          modelName="Black-Litterman"
        />



        {error && (

          <div className="bl-error">
            {error}
          </div>

        )}


        {!result && (

          <section className="bl-empty">

            {
              loading
                ? (
                    <RefreshCw
                      size={36}
                      className="bl-spin"
                    />
                  )

                : (
                    <Scale size={36} />
                  )
            }


            <h2>
              {
                loading
                  ? "Constructing posterior returns"
                  : "Awaiting Black–Litterman analysis"
              }
            </h2>


            <p>
              FinClarity will combine
              reference-portfolio implied
              equilibrium returns with
              FinBERT sentiment views and
              confidence-derived uncertainty.
            </p>

          </section>

        )}


        {result && (

          <>

            <section className="bl-summary-grid">


              <div className="bl-summary-card">

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
                  FinBERT sentiment regime
                </small>

              </div>


              <div className="bl-summary-card">

                <span>
                  Posterior Return
                </span>

                <strong>
                  {
                    percentage(
                      result
                        .maximum_sharpe
                        ?.expected_return
                    )
                  }
                </strong>

                <small>
                  BL max-Sharpe portfolio
                </small>

              </div>


              <div className="bl-summary-card">

                <span>
                  Posterior Volatility
                </span>

                <strong>
                  {
                    percentage(
                      result
                        .maximum_sharpe
                        ?.volatility
                    )
                  }
                </strong>

                <small>
                  Annualised volatility
                </small>

              </div>


              <div className="bl-summary-card">

                <span>
                  Posterior Sharpe
                </span>

                <strong>
                  {
                    Number(
                      result
                        .maximum_sharpe
                        ?.sharpe_ratio
                      || 0
                    ).toFixed(2)
                  }
                </strong>

                <small>
                  Risk-adjusted output
                </small>

              </div>

            </section>


            <section className="bl-panel">

              <div className="bl-panel-header">

                <div>

                  <h2>
                    Return Transformation
                  </h2>

                  <p>
                    How sentiment changes
                    the equilibrium expected
                    return for each asset.
                  </p>

                </div>

                <ChartNoAxesCombined
                  size={18}
                />

              </div>


              <div className="bl-table">

                <div className="bl-table-row header">

                  <span>
                    Ticker
                  </span>

                  <span>
                    Prior
                  </span>

                  <span>
                    Sentiment View
                  </span>

                  <span>
                    Posterior
                  </span>

                  <span>
                    Posterior Shift
                  </span>

                  <span>
                    View Confidence
                  </span>

                </div>


                {
                  result.tickers.map(
                    (ticker) => {

                      const prior =
                        Number(
                          priorReturns[
                            ticker
                          ] || 0
                        );


                      const view =
                        Number(
                          viewReturns[
                            ticker
                          ] || 0
                        );


                      const posterior =
                        Number(
                          posteriorReturns[
                            ticker
                          ] || 0
                        );


                      const shift =
                        posterior
                        - prior;


                      const confidence =
                        Number(
                          viewMap[
                            ticker
                          ]
                            ?.effective_confidence
                          || 0
                        );


                      return (

                        <div
                          className="bl-table-row"
                          key={ticker}
                        >

                          <strong>
                            {ticker}
                          </strong>


                          <span>
                            {
                              percentage(
                                prior
                              )
                            }
                          </span>


                          <span>
                            {
                              percentage(
                                view
                              )
                            }
                          </span>


                          <span className="bl-posterior-value">
                            {
                              percentage(
                                posterior
                              )
                            }
                          </span>


                          <span
                            className={
                              shift >= 0
                                ? "bl-positive"
                                : "bl-negative"
                            }
                          >
                            {
                              signedPercentage(
                                shift
                              )
                            }
                          </span>


                          <span>
                            {
                              percentage(
                                confidence,
                                1
                              )
                            }
                          </span>

                        </div>

                      );
                    }
                  )
                }

              </div>

            </section>


            <section className="bl-two-column">


              <div className="bl-panel">

                <div className="bl-panel-header">

                  <div>

                    <h2>
                      Sentiment Views
                    </h2>

                    <p>
                      FinBERT-derived views
                      and confidence scaling.
                    </p>

                  </div>

                  <BrainCircuit
                    size={18}
                  />

                </div>


                <div className="bl-view-list">

                  {
                    viewDetails.map(
                      (view) => (

                        <div
                          className="bl-view-item"
                          key={
                            view.ticker
                          }
                        >

                          <div className="bl-view-top">

                            <strong>
                              {
                                view.ticker
                              }
                            </strong>


                            <span
                              className={
                                Number(
                                  view
                                    .sentiment_score
                                ) >= 0
                                  ? "bl-positive"
                                  : "bl-negative"
                              }
                            >
                              {
                                Number(
                                  view
                                    .sentiment_score
                                ) >= 0
                                  ? "+"
                                  : ""
                              }

                              {
                                Number(
                                  view
                                    .sentiment_score
                                )
                                .toFixed(3)
                              }
                            </span>

                          </div>


                          <div className="bl-view-data">

                            <span>
                              Headlines
                              <strong>
                                {
                                  view
                                    .article_count
                                }
                              </strong>
                            </span>


                            <span>
                              Confidence
                              <strong>
                                {
                                  percentage(
                                    view
                                      .raw_confidence,
                                    1
                                  )
                                }
                              </strong>
                            </span>


                            <span>
                              Effective
                              <strong>
                                {
                                  percentage(
                                    view
                                      .effective_confidence,
                                    1
                                  )
                                }
                              </strong>
                            </span>

                          </div>


                          <div className="bl-view-tilt">

                            Sentiment tilt:

                            <strong
                              className={
                                Number(
                                  view
                                    .sentiment_tilt
                                ) >= 0
                                  ? "bl-positive"
                                  : "bl-negative"
                              }
                            >

                              {
                                signedPercentage(
                                  view
                                    .sentiment_tilt
                                )
                              }

                            </strong>

                          </div>

                        </div>

                      )
                    )
                  }

                </div>

              </div>


              <div className="bl-panel">

                <div className="bl-panel-header">

                  <div>

                    <h2>
                      Portfolio Allocation
                    </h2>

                    <p>
                      Reference portfolio
                      compared with the
                      posterior max-Sharpe
                      allocation.
                    </p>

                  </div>

                  <CircleGauge
                    size={18}
                  />

                </div>


                <div className="bl-weight-list">

                  {
                    result.tickers.map(
                      (ticker) => {

                        const reference =
                          Number(
                            referenceWeights[
                              ticker
                            ] || 0
                          );


                        const posterior =
                          Number(
                            posteriorWeights[
                              ticker
                            ] || 0
                          );


                        return (

                          <div
                            className="bl-weight-item"
                            key={ticker}
                          >

                            <div className="bl-weight-heading">

                              <strong>
                                {ticker}
                              </strong>

                              <span>
                                {
                                  percentage(
                                    reference,
                                    1
                                  )
                                }
                                {" → "}
                                {
                                  percentage(
                                    posterior,
                                    1
                                  )
                                }
                              </span>

                            </div>


                            <div className="bl-weight-track">

                              <div
                                className="bl-weight-reference"
                                style={{
                                  width:
                                    `${Math.min(
                                      reference
                                      * 100,
                                      100
                                    )}%`,
                                }}
                              />

                            </div>


                            <div className="bl-weight-track posterior">

                              <div
                                className="bl-weight-posterior"
                                style={{
                                  width:
                                    `${Math.min(
                                      posterior
                                      * 100,
                                      100
                                    )}%`,
                                }}
                              />

                            </div>

                          </div>

                        );
                      }
                    )
                  }

                </div>


                <div className="bl-weight-legend">

                  <span>
                    <i className="reference" />
                    Reference
                  </span>

                  <span>
                    <i className="posterior" />
                    BL Posterior
                  </span>

                </div>

              </div>

            </section>


            <section className="bl-panel">

              <div className="bl-panel-header">

                <div>

                  <h2>
                    Model Parameters
                  </h2>

                  <p>
                    Current Black–Litterman
                    configuration.
                  </p>

                </div>

                <ShieldCheck
                  size={18}
                />

              </div>


              <div className="bl-parameter-grid">

                <div>
                  <span>
                    Prior
                  </span>

                  <strong>
                    Reference Portfolio
                  </strong>
                </div>


                <div>
                  <span>
                    Risk Aversion
                  </span>

                  <strong>
                    {
                      result
                        .prior
                        ?.risk_aversion
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Tau
                  </span>

                  <strong>
                    {
                      result
                        .prior
                        ?.tau
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    View Scale
                  </span>

                  <strong>
                    {
                      result
                        .sentiment_views
                        ?.view_scale
                    }
                  </strong>
                </div>

              </div>

            </section>


            <div className="bl-methodology">

              <span>
                Prior:
                {" "}
                reference-portfolio
                implied equilibrium
              </span>

              <span>
                Views:
                {" "}
                FinBERT sentiment
              </span>

              <span>
                Ω:
                {" "}
                confidence + coverage
              </span>

              <span>
                Optimisation:
                {" "}
                posterior max-Sharpe
              </span>

            </div>

          </>

        )}

      </main>

    </div>
  );
}


export default BlackLitterman;
