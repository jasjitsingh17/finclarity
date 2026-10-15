import { API_BASE_URL } from "../lib/apiBase";
import useInstitutionalModelResult from "../hooks/useInstitutionalModelResult";
import InstitutionalModelStatus from "../components/InstitutionalModelStatus";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Gauge,
  Network,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import "./RiskAnalytics.css";


import InstitutionalSidebar from "../components/InstitutionalSidebar";

import {
  buildRiskRequest,
} from "../lib/institutionalModelRequests";

import "../design/FinClarityInstitutionalGlobalTypeScale.css";



const riskRequest = {

  tickers: [
    "AAPL",
    "MSFT",
    "NVDA",
  ],

  weights: [
    0.3333,
    0.3333,
    0.3334,
  ],

  benchmark: "SPY",

  years: 3,

  risk_free_rate: 0.04,
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


function riskLoss(
  value,
  digits = 2,
) {
  const number =
    Math.abs(
      Number(value || 0)
      * 100
    );

  return `-${number.toFixed(digits)}%`;
}


function concentrationLabel(
  hhi,
) {

  const value =
    Number(hhi || 0);

  if (value >= 0.5) {
    return "Highly Concentrated";
  }

  if (value >= 0.35) {
    return "Concentrated";
  }

  return "Diversified";
}


function correlationTone(
  value,
) {

  const absolute =
    Math.abs(
      Number(value || 0)
    );

  if (absolute >= 0.8) {
    return "high";
  }

  if (absolute >= 0.5) {
    return "medium";
  }

  return "low";
}


function RiskAnalytics() {

  const {
    result,
    saveResult,
    cacheStatus,
    cacheMetadata,
  } = useInstitutionalModelResult(
    "risk"
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  async function runRiskAnalysis() {

    setLoading(true);
    setError("");

    try {

      const response = await fetch(
        `${API_BASE_URL}/api/risk/analyse`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(buildRiskRequest(riskRequest)),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail
          || "Risk analysis failed."
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


  const summary =
    result?.summary ?? {};

  const concentration =
    result?.concentration ?? {};

  const contributions =
    result?.risk_contributions ?? [];

  const stress =
    result?.historical_stress ?? {};

  const matrix =
    result?.correlation_matrix ?? {};

  const tickers =
    result?.tickers
    ?? riskRequest.tickers;


  return (
    <div className="risk-page">

      <InstitutionalSidebar />


      <main className="risk-main fc-inst-standard-page">

        <header className="risk-header">

          <div>

            <p className="risk-eyebrow">
              PORTFOLIO RISK DIAGNOSTICS
            </p>

            <h1>
              Risk Analytics
            </h1>

            <p>
              Portfolio loss, concentration,
              market exposure and historical
              stress diagnostics.
            </p>

          </div>


          <button
            type="button"
            className="risk-run-button"
            onClick={runRiskAnalysis}
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "risk-spin"
                  : ""
              }
            />

            {
              loading
                ? "Analysing..."
                : "Run Risk Analysis"
            }

          </button>

        </header>

        <InstitutionalModelStatus
          status={cacheStatus}
          metadata={cacheMetadata}
          modelName="Risk Analytics"
        />



        {error && (

          <div className="risk-error">
            {error}
          </div>

        )}


        {!result && (

          <section className="risk-empty">

            {
              loading
                ? (
                    <RefreshCw
                      size={38}
                      className="risk-spin"
                    />
                  )
                : (
                    <ShieldCheck
                      size={38}
                    />
                  )
            }

            <h2>
              {
                loading
                  ? "Calculating portfolio risk"
                  : "Awaiting risk analysis"
              }
            </h2>

            <p>
              FinClarity will estimate
              historical VaR and expected
              shortfall, systematic exposure,
              concentration and component
              risk using live market history.
            </p>

          </section>

        )}


        {result && (

          <>

            <section className="risk-summary-grid">

              <div className="risk-summary-card">

                <span>
                  Annualised Volatility
                </span>

                <strong>
                  {
                    percentage(
                      summary
                        .annualised_volatility
                    )
                  }
                </strong>

                <small>
                  Realised historical risk
                </small>

              </div>


              <div className="risk-summary-card">

                <span>
                  1-Day VaR 95%
                </span>

                <strong>
                  {
                    riskLoss(
                      summary.var_95
                    )
                  }
                </strong>

                <small>
                  Historical loss threshold
                </small>

              </div>


              <div className="risk-summary-card">

                <span>
                  1-Day CVaR 95%
                </span>

                <strong>
                  {
                    riskLoss(
                      summary.cvar_95
                    )
                  }
                </strong>

                <small>
                  Average loss beyond VaR
                </small>

              </div>


              <div className="risk-summary-card">

                <span>
                  Maximum Drawdown
                </span>

                <strong>
                  {
                    riskLoss(
                      summary.max_drawdown
                    )
                  }
                </strong>

                <small>
                  Peak-to-trough decline
                </small>

              </div>

            </section>


            <section className="risk-secondary-grid">

              <div className="risk-metric-card">

                <span>
                  Sharpe Ratio
                </span>

                <strong>
                  {
                    Number(
                      summary.sharpe_ratio
                      || 0
                    ).toFixed(2)
                  }
                </strong>

              </div>


              <div className="risk-metric-card">

                <span>
                  Sortino Ratio
                </span>

                <strong>
                  {
                    Number(
                      summary.sortino_ratio
                      || 0
                    ).toFixed(2)
                  }
                </strong>

              </div>


              <div className="risk-metric-card">

                <span>
                  Beta vs {result.benchmark}
                </span>

                <strong>
                  {
                    Number(
                      summary.beta
                      || 0
                    ).toFixed(2)
                  }
                </strong>

              </div>


              <div className="risk-metric-card">

                <span>
                  Benchmark Correlation
                </span>

                <strong>
                  {
                    Number(
                      summary
                        .benchmark_correlation
                      || 0
                    ).toFixed(2)
                  }
                </strong>

              </div>


              <div className="risk-metric-card">

                <span>
                  VaR 99%
                </span>

                <strong>
                  {
                    riskLoss(
                      summary.var_99
                    )
                  }
                </strong>

              </div>


              <div className="risk-metric-card">

                <span>
                  CVaR 99%
                </span>

                <strong>
                  {
                    riskLoss(
                      summary.cvar_99
                    )
                  }
                </strong>

              </div>

            </section>


            <section className="risk-two-column">

              <div className="risk-panel">

                <div className="risk-panel-header">

                  <div>

                    <h2>
                      Concentration
                    </h2>

                    <p>
                      Portfolio diversification
                      and position concentration.
                    </p>

                  </div>

                  <AlertTriangle size={18} />

                </div>


                <div className="risk-concentration-hero">

                  <div>

                    <span>
                      Concentration State
                    </span>

                    <strong>
                      {
                        concentrationLabel(
                          concentration.hhi
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      HHI
                    </span>

                    <strong>
                      {
                        Number(
                          concentration.hhi
                          || 0
                        ).toFixed(3)
                      }
                    </strong>

                  </div>

                </div>


                <div className="risk-concentration-grid">

                  <div>

                    <span>
                      Effective Holdings
                    </span>

                    <strong>
                      {
                        Number(
                          concentration
                            .effective_holdings
                          || 0
                        ).toFixed(2)
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Largest Position
                    </span>

                    <strong>
                      {
                        concentration
                          .largest_position
                          ?.ticker
                        || "-"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Largest Weight
                    </span>

                    <strong>
                      {
                        percentage(
                          concentration
                            .largest_position
                            ?.weight
                        )
                      }
                    </strong>

                  </div>

                </div>

              </div>


              <div className="risk-panel">

                <div className="risk-panel-header">

                  <div>

                    <h2>
                      Historical Stress
                    </h2>

                    <p>
                      Worst realised portfolio
                      periods in the sample.
                    </p>

                  </div>

                  <Activity size={18} />

                </div>


                <div className="risk-stress-list">

                  <div>

                    <span>
                      Worst Day
                    </span>

                    <strong>
                      {
                        riskLoss(
                          stress
                            .worst_day
                            ?.return
                        )
                      }
                    </strong>

                    <small>
                      {
                        stress
                          .worst_day
                          ?.date
                      }
                    </small>

                  </div>


                  <div>

                    <span>
                      Worst 5-Day Period
                    </span>

                    <strong>
                      {
                        riskLoss(
                          stress
                            .worst_5_day
                            ?.return
                        )
                      }
                    </strong>

                    <small>
                      Ends
                      {" "}
                      {
                        stress
                          .worst_5_day
                          ?.end_date
                      }
                    </small>

                  </div>


                  <div>

                    <span>
                      Worst 21-Day Period
                    </span>

                    <strong>
                      {
                        riskLoss(
                          stress
                            .worst_21_day
                            ?.return
                        )
                      }
                    </strong>

                    <small>
                      Ends
                      {" "}
                      {
                        stress
                          .worst_21_day
                          ?.end_date
                      }
                    </small>

                  </div>

                </div>

              </div>

            </section>


            <section className="risk-panel">

              <div className="risk-panel-header">

                <div>

                  <h2>
                    Contribution to Portfolio Risk
                  </h2>

                  <p>
                    Component contribution to
                    total annualised portfolio
                    variance.
                  </p>

                </div>

                <Gauge size={18} />

              </div>


              <div className="risk-contribution-list">

                {
                  contributions.map(
                    (item) => {

                      const contribution =
                        Number(
                          item.risk_contribution
                          || 0
                        );

                      const width =
                        Math.min(
                          Math.abs(
                            contribution
                          )
                          * 100,
                          100
                        );

                      return (

                        <div
                          className="risk-contribution-item"
                          key={item.ticker}
                        >

                          <div className="risk-contribution-top">

                            <strong>
                              {item.ticker}
                            </strong>

                            <span>
                              Weight
                              {" "}
                              {
                                percentage(
                                  item.weight,
                                  1
                                )
                              }
                            </span>

                            <span>
                              Risk
                              {" "}
                              {
                                percentage(
                                  contribution,
                                  1
                                )
                              }
                            </span>

                          </div>


                          <div className="risk-contribution-track">

                            <div
                              style={{
                                width:
                                  `${width}%`,
                              }}
                            />

                          </div>

                        </div>

                      );
                    }
                  )
                }

              </div>

            </section>


            <section className="risk-panel">

              <div className="risk-panel-header">

                <div>

                  <h2>
                    Correlation Matrix
                  </h2>

                  <p>
                    Historical daily-return
                    correlations across the
                    portfolio universe.
                  </p>

                </div>

                <Network size={18} />

              </div>


              <div className="risk-correlation-table">

                <div
                  className="risk-correlation-row header"
                  style={{
                    gridTemplateColumns:
                      `110px repeat(${tickers.length}, 1fr)`,
                  }}
                >

                  <span>
                    Asset
                  </span>

                  {
                    tickers.map(
                      (ticker) => (
                        <strong
                          key={ticker}
                        >
                          {ticker}
                        </strong>
                      )
                    )
                  }

                </div>


                {
                  tickers.map(
                    (rowTicker) => (

                      <div
                        className="risk-correlation-row"
                        key={rowTicker}
                        style={{
                          gridTemplateColumns:
                            `110px repeat(${tickers.length}, 1fr)`,
                        }}
                      >

                        <strong>
                          {rowTicker}
                        </strong>


                        {
                          tickers.map(
                            (columnTicker) => {

                              const value =
                                Number(
                                  matrix[
                                    rowTicker
                                  ]?.[
                                    columnTicker
                                  ]
                                  || 0
                                );

                              return (

                                <span
                                  key={
                                    `${rowTicker}-${columnTicker}`
                                  }
                                  className={
                                    `risk-correlation-cell ${
                                      correlationTone(
                                        value
                                      )
                                    }`
                                  }
                                >
                                  {
                                    value.toFixed(2)
                                  }
                                </span>

                              );
                            }
                          )
                        }

                      </div>

                    )
                  )
                }

              </div>

            </section>


            <section className="risk-disclosure">

              <ShieldCheck size={18} />

              <div>

                <strong>
                  Historical risk is not a forecast
                </strong>

                <p>
                  VaR, CVaR, beta, correlations
                  and drawdowns are estimated from
                  realised market history. They
                  describe the behaviour of the
                  portfolio under the historical
                  sample and do not guarantee the
                  scale or structure of future losses.
                </p>

              </div>

            </section>


            <div className="risk-methodology">

              <span>
                Universe:
                {" "}
                {
                  result.tickers.join(
                    " / "
                  )
                }
              </span>

              <span>
                Benchmark:
                {" "}
                {result.benchmark}
              </span>

              <span>
                History:
                {" "}
                {result.years} years
              </span>

              <span>
                Risk-free:
                {" "}
                {
                  percentage(
                    result.risk_free_rate
                  )
                }
              </span>

              <span>
                VaR:
                historical
              </span>

            </div>

          </>

        )}

      </main>

    </div>
  );
}


export default RiskAnalytics;
