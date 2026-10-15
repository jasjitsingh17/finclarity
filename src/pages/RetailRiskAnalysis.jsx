import {
  Activity,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

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
  extractRetailRisk,
  percentage,
} from "../lib/retailResearchAnalytics";

import "./RetailDashboardLive.css";
import "./RetailResearchPages.css";


import RetailAnalysisNotice from "../components/RetailAnalysisNotice";
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


function RetailRiskAnalysis() {

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


  const risk =
    extractRetailRisk(
      current
        ?.result
        ?.risk
    );


  const market =
    current
      ?.result
      ?.market
    ?? null;


  const riskResult =
    current
      ?.result
      ?.risk
    ?? null;


  const baseCurrency =
    String(
      riskResult?.base_currency
      ?? portfolio?.baseCurrency
      ?? "USD"
    )
      .trim()
      .toUpperCase();


  const available =
    risk.volatility !== null
    || risk.drawdown !== null
    || risk.var95 !== null;


  const holdings =
    (
      market?.holdings
      ?? []
    )
      .slice()
      .sort(
        (left, right) =>
          Number(
            right.annualised_volatility
            ?? 0
          )
          - Number(
              left.annualised_volatility
              ?? 0
            )
      );


  const riskLabel =
    risk.volatility === null
      ? "Unavailable"
      : risk.volatility > 0.35
        ? "High"
        : risk.volatility > 0.25
          ? "Elevated"
          : "Moderate";


  return (
    <div className="retail-live-dashboard retail-research-page">

      <RetailSidebar
        active="risk"
      />


      <main className="retail-live-main">

        <div className="retail-research-content">

          <header className="retail-research-header">

            <div>

              <span>
                DOWNSIDE & VOLATILITY
              </span>

              <h1>
                Risk Analysis
              </h1>

              <p>
                Understand how your portfolio has behaved historically when markets moved against it. Historical holding and benchmark returns are translated into {baseCurrency} before risk is calculated.
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
            || !available
              ? (

                <section className="retail-research-empty">

                  <Activity size={31} />

                  <h2>
                    Risk analysis required
                  </h2>

                  <p>
                    Run Analyse Portfolio from the Dashboard to calculate historical portfolio risk.
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
                        Risk Level
                      </span>

                      <strong>
                        {riskLabel}
                      </strong>

                      <small>
                        Based primarily on historical volatility
                      </small>

                    </article>


                    <article>

                      <span>
                        Annualised Volatility
                      </span>

                      <strong>
                        {
                          percentage(
                            risk.volatility
                          )
                        }
                      </strong>

                      <small>
                        Historical scale of portfolio movement
                      </small>

                    </article>


                    <article>

                      <span>
                        Maximum Drawdown
                      </span>

                      <strong>
                        {
                          percentage(
                            risk.drawdown
                          )
                        }
                      </strong>

                      <small>
                        Worst peak-to-trough decline
                      </small>

                    </article>


                    <article>

                      <span>
                        1-Day VaR 95%
                      </span>

                      <strong>
                        {
                          percentage(
                            risk.var95,
                            2
                          )
                        }
                      </strong>

                      <small>
                        Historical one-day loss threshold
                      </small>

                    </article>

                  </section>


                  <section className="retail-research-two-column">

                    <article className="retail-research-panel">

                      <div className="retail-research-panel-heading">

                        <div>

                          <h2>
                            Risk Snapshot
                          </h2>

                          <p>
                            Additional portfolio risk measures.
                          </p>

                        </div>

                        <ShieldCheck size={18} />

                      </div>


                      <div className="retail-detail-grid">

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

                          <small>
                            Return relative to volatility
                          </small>

                        </div>


                        <div>

                          <span>
                            Sortino Ratio
                          </span>

                          <strong>
                            {
                              ratio(
                                risk.sortino
                              )
                            }
                          </strong>

                          <small>
                            Return relative to downside volatility
                          </small>

                        </div>


                        <div>

                          <span>
                            CVaR 95%
                          </span>

                          <strong>
                            {
                              percentage(
                                risk.cvar95,
                                2
                              )
                            }
                          </strong>

                          <small>
                            Average loss beyond VaR
                          </small>

                        </div>


                        <div>

                          <span>
                            Benchmark Beta
                          </span>

                          <strong>
                            {
                              ratio(
                                risk.beta
                              )
                            }
                          </strong>

                          <small>
                            Benchmark sensitivity when available
                          </small>

                        </div>

                      </div>

                    </article>


                    <article className="retail-research-panel">

                      <div className="retail-research-panel-heading">

                        <div>

                          <h2>
                            What should I notice?
                          </h2>

                          <p>
                            Plain-English interpretation.
                          </p>

                        </div>

                        <AlertTriangle size={18} />

                      </div>


                      <div className="retail-explanation-stack">

                        <div>

                          <strong>
                            Volatility
                          </strong>

                          <p>
                            {
                              risk.volatility <= 0.25
                                ? "Your portfolio is currently within FinClarity's moderate historical volatility range."
                                : risk.volatility <= 0.35
                                  ? "Your portfolio has experienced elevated historical price movement."
                                  : "Your portfolio has experienced high historical price movement."
                            }
                          </p>

                        </div>


                        <div>

                          <strong>
                            Drawdown
                          </strong>

                          <p>
                            {
                              risk.drawdown <= -0.30
                                ? "The sample contains a large peak-to-trough decline above 30%."
                                : risk.drawdown <= -0.20
                                  ? "The portfolio experienced a meaningful historical drawdown above 20%."
                                  : "Historical peak-to-trough decline remained below 20%."
                            }
                          </p>

                        </div>


                        <div>

                          <strong>
                            VaR
                          </strong>

                          <p>
                            VaR is a historical loss threshold, not the maximum amount your portfolio could lose.
                          </p>

                        </div>

                      </div>

                    </article>

                  </section>


                  <section className="retail-research-panel">

                    <div className="retail-research-panel-heading">

                      <div>

                        <h2>
                          Holdings by Volatility
                        </h2>

                        <p>
                          Historical volatility for securities in your active portfolio.
                        </p>

                      </div>

                      <BarChart3 size={18} />

                    </div>


                    <div className="retail-volatility-list">

                      {
                        holdings.map(
                          (holding) => {

                            const value =
                              Number(
                                holding
                                  .annualised_volatility
                              );


                            const width =
                              Number.isFinite(
                                value
                              )
                                ? Math.min(
                                    value
                                    / 0.60
                                    * 100,
                                    100
                                  )
                                : 0;


                            return (
                              <div
                                key={
                                  holding.ticker
                                }
                              >

                                <header>

                                  <strong>
                                    {
                                      holding.ticker
                                    }
                                  </strong>

                                  <span>
                                    {
                                      Number.isFinite(
                                        value
                                      )
                                        ? `${(
                                            value * 100
                                          ).toFixed(1)}%`
                                        : "—"
                                    }
                                  </span>

                                </header>


                                <div>

                                  <span
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


                  <section className="retail-methodology-note">

                    <Activity size={17} />

                    <div>

                      <strong>
                        Historical risk is not a forecast
                      </strong>

                      <p>
                        Volatility, VaR, CVaR and drawdown are estimated from realised market history. Future losses can differ materially.
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


export default RetailRiskAnalysis;
