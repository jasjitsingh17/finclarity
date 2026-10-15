import {
  BookOpen,
  BrainCircuit,
  Gauge,
  ShieldCheck,
  Sparkles,
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
  buildRetailHealth,
  extractRetailRisk,
  extractRetailSentiment,
} from "../lib/retailResearchAnalytics";

import "./RetailDashboardLive.css";
import "./RetailResearchPages.css";


import RetailAnalysisNotice from "../components/RetailAnalysisNotice";
function RetailUnderstand() {

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


  const market =
    current
      ?.result
      ?.market
    ?? null;


  const rawRisk =
    current
      ?.result
      ?.risk
    ?? null;


  const rawSentiment =
    current
      ?.result
      ?.sentiment
    ?? null;


  const risk =
    extractRetailRisk(
      rawRisk
    );


  const sentiment =
    extractRetailSentiment(
      rawSentiment
    );


  const health =
    buildRetailHealth(
      market,
      rawRisk,
      rawSentiment,
    );


  const holdings =
    (
      market?.holdings
      ?? []
    );


  const largest =
    holdings
      .filter(
        (holding) =>
          Number.isFinite(
            Number(
              holding.weight
            )
          )
      )
      .slice()
      .sort(
        (left, right) =>
          Number(
            right.weight
          )
          - Number(
              left.weight
            )
      )[0]
      ?? null;


  const mostVolatile =
    holdings
      .filter(
        (holding) =>
          Number.isFinite(
            Number(
              holding
                .annualised_volatility
            )
          )
      )
      .slice()
      .sort(
        (left, right) =>
          Number(
            right
              .annualised_volatility
          )
          - Number(
              left
                .annualised_volatility
            )
      )[0]
      ?? null;


  return (
    <div className="retail-live-dashboard retail-research-page">

      <RetailSidebar
        active="understand"
      />


      <main className="retail-live-main">

        <div className="retail-research-content">

          <header className="retail-research-header">

            <div>

              <span>
                LEARN
              </span>

              <h1>
                Understand My Portfolio
              </h1>

              <p>
                Translate your portfolio analytics into straightforward explanations while preserving the underlying financial meaning.
              </p>

            </div>


            <Link
              to="/retail"
              className="retail-research-action"
            >
              Back to Dashboard
            </Link>

          </header>
          <RetailAnalysisNotice
            cache={cache}
          />



          {
            !current
              ? (

                <section className="retail-research-empty">

                  <BookOpen size={31} />

                  <h2>
                    Analyse your portfolio first
                  </h2>

                  <p>
                    This page explains your own portfolio rather than displaying generic investment education.
                  </p>

                  <Link to="/retail">
                    Go to Dashboard
                  </Link>

                </section>

              )
              : (

                <>

                  <section className="retail-understand-grid">

                    <article>

                      <Gauge size={20} />

                      <span>
                        Portfolio Health
                      </span>

                      <strong>
                        {
                          health
                            ? `${health.overall}/100 — ${health.label}`
                            : "Awaiting complete analysis"
                        }
                      </strong>

                      <p>
                        Portfolio Health summarises selected risk, concentration and sentiment characteristics. It is not a performance rating.
                      </p>

                    </article>


                    <article>

                      <Sparkles size={20} />

                      <span>
                        Largest Position
                      </span>

                      <strong>
                        {
                          largest
                            ? `${largest.ticker} • ${(
                                Number(
                                  largest.weight
                                )
                                * 100
                              ).toFixed(1)}%`
                            : "Unavailable"
                        }
                      </strong>

                      <p>
                        A larger single position means your portfolio is more sensitive to what happens to that particular company.
                      </p>

                    </article>


                    <article>

                      <ShieldCheck size={20} />

                      <span>
                        Most Volatile Holding
                      </span>

                      <strong>
                        {
                          mostVolatile
                            ? `${mostVolatile.ticker} • ${(
                                Number(
                                  mostVolatile
                                    .annualised_volatility
                                )
                                * 100
                              ).toFixed(1)}%`
                            : "Unavailable"
                        }
                      </strong>

                      <p>
                        Volatility describes the historical size of price movements. Higher volatility does not automatically mean a security is poor.
                      </p>

                    </article>


                    <article>

                      <BrainCircuit size={20} />

                      <span>
                        News Sentiment
                      </span>

                      <strong>
                        {
                          sentiment
                            .portfolio
                            .label
                        }
                      </strong>

                      <p>
                        {
                          sentiment
                            .portfolio
                            .confidence
                          !== null
                            ? `Model confidence is ${(
                                sentiment
                                  .portfolio
                                  .confidence
                                * 100
                              ).toFixed(1)}%.`
                            : "Sentiment confidence is unavailable."
                        }
                        {" "}
                        Low-confidence directional readings are intentionally treated cautiously.
                      </p>

                    </article>

                  </section>


                  <section className="retail-research-panel">

                    <div className="retail-research-panel-heading">

                      <div>

                        <h2>
                          Your portfolio in plain English
                        </h2>

                        <p>
                          Key observations from the latest saved analysis.
                        </p>

                      </div>

                      <BookOpen size={18} />

                    </div>


                    <div className="retail-explanation-stack">

                      <div>

                        <strong>
                          Concentration
                        </strong>

                        <p>
                          {
                            largest
                              ? `Your largest holding is ${largest.ticker} at ${(
                                  Number(
                                    largest.weight
                                  )
                                  * 100
                                ).toFixed(1)}% of your current portfolio value.`
                              : "Current portfolio weights are unavailable."
                          }
                        </p>

                      </div>


                      <div>

                        <strong>
                          Historical Risk
                        </strong>

                        <p>
                          {
                            risk.volatility
                            !== null
                              ? `Your portfolio's annualised historical volatility is ${(
                                  risk.volatility
                                  * 100
                                ).toFixed(1)}%.`
                              : "Historical volatility has not been calculated."
                          }

                          {
                            risk.drawdown
                            !== null
                              ? ` The historical maximum drawdown was ${(
                                  risk.drawdown
                                  * 100
                                ).toFixed(1)}%.`
                              : ""
                          }
                        </p>

                      </div>


                      <div>

                        <strong>
                          Diversification
                        </strong>

                        <p>
                          You currently hold
                          {" "}
                          {
                            portfolio
                              ?.holdings
                              ?.length
                            ?? 0
                          }
                          {" "}
                          securities. Position count alone does not guarantee diversification; position size and correlation also matter.
                        </p>

                      </div>


                      <div>

                        <strong>
                          Currency
                        </strong>

                        <p>
                          Portfolio values are displayed in
                          {" "}
                          {
                            portfolio
                              ?.baseCurrency
                            ?? "your selected display currency"
                          }
                          . Holdings denominated in another currency are converted using the latest available market FX quote.
                        </p>

                      </div>

                    </div>

                  </section>


                  <section className="retail-research-panel">

                    <div className="retail-research-panel-heading">

                      <div>

                        <h2>
                          Quick glossary
                        </h2>

                        <p>
                          Definitions of the main metrics used throughout FinClarity.
                        </p>

                      </div>

                      <BookOpen size={18} />

                    </div>


                    <div className="retail-glossary">

                      <article>

                        <strong>
                          Volatility
                        </strong>

                        <p>
                          How widely historical returns moved around their average.
                        </p>

                      </article>


                      <article>

                        <strong>
                          Drawdown
                        </strong>

                        <p>
                          The decline from a previous portfolio peak to a subsequent trough.
                        </p>

                      </article>


                      <article>

                        <strong>
                          VaR
                        </strong>

                        <p>
                          A historical loss threshold at a selected confidence level. It is not a maximum possible loss.
                        </p>

                      </article>


                      <article>

                        <strong>
                          Sentiment
                        </strong>

                        <p>
                          A model-based interpretation of language in recent news headlines.
                        </p>

                      </article>


                      <article>

                        <strong>
                          Sharpe Ratio
                        </strong>

                        <p>
                          Historical excess return relative to total volatility.
                        </p>

                      </article>


                      <article>

                        <strong>
                          Portfolio Weight
                        </strong>

                        <p>
                          The proportion of current portfolio value represented by one holding.
                        </p>

                      </article>

                    </div>

                  </section>


                  <section className="retail-methodology-note">

                    <BookOpen size={17} />

                    <div>

                      <strong>
                        Educational context
                      </strong>

                      <p>
                        These explanations are intended to help investors understand their portfolio analytics. They are not personal financial advice or investment recommendations.
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


export default RetailUnderstand;
