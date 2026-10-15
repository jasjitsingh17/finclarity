import {
  HeartPulse,
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
  buildRetailFlags,
  buildRetailHealth,
  componentLabel,
} from "../lib/retailResearchAnalytics";

import "./RetailDashboardLive.css";
import "./RetailResearchPages.css";


import RetailAnalysisNotice from "../components/RetailAnalysisNotice";
function effectiveWeightText(
  value,
) {

  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {
    return "0.0%";
  }


  return (
    `${(
      number * 100
    ).toFixed(1)}%`
  );
}


function RetailHealth() {

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


  const health =
    buildRetailHealth(
      market,
      rawRisk,
      rawSentiment,
    );


  const flags =
    buildRetailFlags(
      market,
      rawRisk,
      rawSentiment,
    );


  const healthUnavailableMessage =
    !current
      ? (
          "Run Analyse Portfolio from the Dashboard "
          + "to create a current portfolio analysis."
        )
      : market?.fx_complete === false
        ? (
            "FinClarity withholds Portfolio Health when "
            + "any holding cannot be valued in the selected "
            + "base currency, because concentration would "
            + "otherwise describe only the available subset."
          )
        : (
            "FinClarity does not create a health score until "
            + "complete concentration data and the underlying "
            + "portfolio risk analysis are available."
          );


  return (
    <div className="retail-live-dashboard retail-research-page">

      <RetailSidebar
        active="health"
      />


      <main className="retail-live-main">

        <div className="retail-research-content">

          <header className="retail-research-header">

            <div>

              <span>
                PORTFOLIO DIAGNOSTICS
              </span>

              <h1>
                Portfolio Health
              </h1>

              <p>
                Understand the factors contributing to your current FinClarity portfolio-health score.
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
            || !health
              ? (

                <section className="retail-research-empty">

                  <ShieldCheck size={31} />

                  <h2>
                    Portfolio Health is waiting for analysis
                  </h2>

                  <p>
                    {healthUnavailableMessage}
                  </p>

                  <Link to="/retail">
                    Analyse Portfolio
                  </Link>

                </section>

              )
              : (

                <>

                  <section className="retail-health-hero">

                    <div
                      className="retail-health-hero-ring"
                      style={{
                        background:
                          `conic-gradient(
                            #55d5bd ${
                              health.overall
                              * 3.6
                            }deg,
                            #173147 0deg
                          )`,
                      }}
                    >

                      <div>

                        <strong>
                          {health.overall}
                        </strong>

                        <span>
                          /100
                        </span>

                        <small>
                          {health.label}
                        </small>

                      </div>

                    </div>


                    <div>

                      <span className="retail-research-overline">
                        YOUR CURRENT SCORE
                      </span>

                      <h2>
                        {health.label}
                      </h2>

                      <p>
                        Portfolio Health is an educational diagnostic combining historical downside risk, portfolio concentration and confidence-aware news sentiment. It is not a return forecast or investment recommendation.
                      </p>

                    </div>

                  </section>


                  <section className="retail-health-component-grid">

                    {
                      [
                        [
                          "Downside Risk",
                          health
                            .components
                            .risk,
                          effectiveWeightText(
                            health
                              ?.effectiveWeights
                              ?.risk
                          ),
                        ],

                        [
                          "Concentration",
                          health
                            .components
                            .concentration,
                          effectiveWeightText(
                            health
                              ?.effectiveWeights
                              ?.concentration
                          ),
                        ],

                        [
                          "Sentiment Context",
                          health
                            .components
                            .sentiment,
                          effectiveWeightText(
                            health
                              ?.effectiveWeights
                              ?.sentiment
                          ),
                        ],
                      ].map(
                        (
                          [
                            title,
                            value,
                            weight,
                          ]
                        ) => (

                          <article
                            key={title}
                          >

                            <span>
                              {title}
                            </span>

                            <strong>
                              {
                                value
                                ?? "—"
                              }
                            </strong>

                            <small>
                              {
                                (
                                  title
                                  === "Sentiment Context"
                                  && health
                                    ?.exclusions
                                    ?.sentiment
                                    === "low_confidence"
                                )
                                  ? "Low confidence — excluded"
                                  : componentLabel(
                                      value
                                    )
                              }
                              {" • "}
                              {weight}
                              {" effective weight"}
                            </small>


                            {
                              value !== null
                              && value !== undefined
                              && (

                                <div>

                                  <span
                                    style={{
                                      width:
                                        `${value}%`,
                                    }}
                                  />

                                </div>

                              )
                            }

                          </article>

                        )
                      )
                    }

                  </section>


                  <section className="retail-research-panel">

                    <div className="retail-research-panel-heading">

                      <div>

                        <h2>
                          Why FinClarity scored it this way
                        </h2>

                        <p>
                          Material observations from your current portfolio and latest saved analysis.
                        </p>

                      </div>

                      <HeartPulse size={18} />

                    </div>


                    <div className="retail-health-flag-grid">

                      {
                        flags.map(
                          (
                            flag,
                            index,
                          ) => (

                            <article
                              className={
                                flag.type
                              }
                              key={
                                `${flag.title}-${index}`
                              }
                            >

                              <i />

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

                            </article>

                          )
                        )
                      }

                    </div>

                  </section>


                  <section className="retail-methodology-note">

                    <ShieldCheck size={17} />

                    <div>

                      <strong>
                        Transparent methodology
                      </strong>

                      <p>
                        Portfolio Health starts with nominal weights of 45% Downside Risk, 40% Concentration and 15% Sentiment Context. Only decision-useful components enter the calculation, so effective weights are renormalised across included components. Low-confidence or unavailable sentiment has 0% influence. Current score-input coverage is {effectiveWeightText(health.scoreCoverage)}.
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


export default RetailHealth;
