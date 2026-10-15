import { API_BASE_URL } from "../lib/apiBase";
import {
  Activity,
  AlertTriangle,
  Layers,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
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
  readRetailMarketSnapshot,
} from "../lib/retailMarketSnapshot";

import "./RetailDashboardLive.css";
import "./RetailDiversification.css";


import {
  readRetailPortfolio,
} from "../lib/retailPortfolio";

const API = API_BASE_URL;

const CACHE_KEY =
  "finclarity_retail_diversification_v2";


function readCache(
  signature,
) {

  if (
    !signature
    || typeof window
    === "undefined"
  ) {
    return null;
  }


  try {

    const raw =
      window.localStorage
        .getItem(
          CACHE_KEY
        );


    if (!raw) {
      return null;
    }


    const record =
      JSON.parse(
        raw
      );


    if (
      record?.version !== 1
      || record?.signature
      !== signature
      || !record?.result
    ) {
      return null;
    }


    return record;

  } catch {

    return null;

  }
}


function writeCache(
  signature,
  result,
) {

  const record = {
    version:
      1,

    signature,

    generatedAt:
      new Date()
        .toISOString(),

    result,
  };


  window.localStorage.setItem(
    CACHE_KEY,
    JSON.stringify(
      record
    )
  );


  return record;
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
    `${(
      number * 100
    ).toFixed(
      digits
    )}%`
  );
}


function correlationText(
  value,
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


  return number.toFixed(
    2
  );
}


function correlationClass(
  value,
  diagonal = false,
) {

  if (diagonal) {
    return "diagonal";
  }


  const number =
    Number(value);


  if (
    !Number.isFinite(
      number
    )
  ) {
    return "unknown";
  }


  if (
    number >= 0.70
  ) {
    return "very-high";
  }


  if (
    number >= 0.40
  ) {
    return "high";
  }


  if (
    number >= 0.20
  ) {
    return "moderate";
  }


  if (
    number >= 0
  ) {
    return "low";
  }


  return "inverse";
}


function scoreLabel(
  score,
) {

  const value =
    Number(score);


  if (
    value >= 80
  ) {
    return "Strong";
  }


  if (
    value >= 65
  ) {
    return "Good";
  }


  if (
    value >= 50
  ) {
    return "Moderate";
  }


  return "Limited";
}


function scoreClass(
  score,
) {

  const value =
    Number(score);


  if (
    value >= 80
  ) {
    return "strong";
  }


  if (
    value >= 65
  ) {
    return "good";
  }


  if (
    value >= 50
  ) {
    return "moderate";
  }


  return "limited";
}


function pairName(
  pair,
) {

  if (!pair) {
    return "—";
  }


  return (
    `${
      pair.ticker_1
    } / ${
      pair.ticker_2
    }`
  );
}


function RetailDiversification() {

  const portfolio =
    useRetailPortfolio();


  const snapshot =
    readRetailMarketSnapshot(
      portfolio
    );


  const holdings =
    Array.isArray(
      snapshot
        ?.market
        ?.holdings
    )
      ? snapshot
          .market
          .holdings
      : [];


  const analysable =
    holdings.filter(
      (holding) =>
        holding?.status
        === "live"
        && Number.isFinite(
          Number(
            holding?.weight
          )
        )
        && Number(
          holding?.weight
        ) > 0
    );


  const totalWeight =
    analysable.reduce(
      (
        total,
        holding,
      ) =>
        total
        + Number(
            holding.weight
          ),
      0
    );


  const baseCurrency =
    String(
      readRetailPortfolio()
        ?.baseCurrency
      ?? "USD"
    )
      .trim()
      .toUpperCase();


  const request =
    (
      analysable.length >= 2
      && totalWeight > 0
    )
      ? {
          tickers:
            analysable.map(
              (holding) =>
                holding.ticker
            ),

          weights:
            analysable.map(
              (holding) =>
                Number(
                  holding.weight
                )
                / totalWeight
            ),

          years:
            3,

          base_currency:
            baseCurrency,
        }
      : null;


  const requestSignature =
    request
      ? JSON.stringify(
          request
        )
      : "";


  const [
    refreshToken,
    setRefreshToken,
  ] =
    useState(0);


  const [
    state,
    setState,
  ] =
    useState(
      () => {

        const cached =
          readCache(
            requestSignature
          );


        if (cached) {

          return {
            loading:
              false,

            result:
              cached.result,

            error:
              null,

            generatedAt:
              cached.generatedAt,
          };

        }


        return {
          loading:
            false,

          result:
            null,

          error:
            null,

          generatedAt:
            null,
        };
      }
    );


  useEffect(
    () => {

      if (
        !requestSignature
      ) {

        return undefined;
      }


      if (
        refreshToken === 0
      ) {

        const cached =
          readCache(
            requestSignature
          );


        if (cached) {

          return undefined;
        }

      }


      let cancelled =
        false;


      async function run() {

        try {

          const response =
            await fetch(
              `${API}/api/diversification/analyse`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  requestSignature,
              }
            );


          const payload =
            await response.json();


          if (
            !response.ok
          ) {

            throw new Error(
              payload?.detail
              ?? "Diversification analysis failed."
            );

          }


          if (cancelled) {
            return;
          }


          const record =
            writeCache(
              requestSignature,
              payload
            );


          setState({
            loading:
              false,

            result:
              payload,

            error:
              null,

            generatedAt:
              record.generatedAt,
          });

        } catch (error) {

          if (cancelled) {
            return;
          }


          setState({
            loading:
              false,

            result:
              null,

            error:
              error?.message
              ?? "Diversification analysis failed.",

            generatedAt:
              null,
          });

        }

      }


      run();


      return () => {

        cancelled =
          true;

      };

    },
    [
      requestSignature,
      refreshToken,
    ]
  );


  if (
    !requestSignature
  ) {

    return (
      <div className="retail-live-dashboard retail-diversification-page">

        <RetailSidebar
          active="diversification"
        />


        <main className="retail-live-main">

          <div className="retail-diversification-content">

            <section className="retail-diversification-empty">

              <Layers size={32} />

              <h1>
                Diversification & Correlation
              </h1>

              <p>
                FinClarity needs at least two holdings with live market prices and current FX-adjusted portfolio weights. Historical prices are translated into {baseCurrency} before volatility and correlations are calculated.</p>

              <Link to="/retail">
                Go to Dashboard
              </Link>

              <small>
                Run Analyse Portfolio once to refresh the live allocation snapshot.
              </small>

            </section>

          </div>

        </main>

      </div>
    );

  }


  const result =
    state.result;


  const analysisLoading =
    Boolean(
      state.loading
      || (
        requestSignature
        && !state.result
        && !state.error
      )
    );


  const highest =
    result
      ?.highest_correlation_pair;


  const lowest =
    result
      ?.lowest_correlation_pair;


  const maximumVolatility =
    result?.asset_metrics?.length
      ? Math.max(
          ...result
            .asset_metrics
            .map(
              (item) =>
                Number(
                  item
                    .annualised_volatility
                )
                || 0
            )
        )
      : 0;


  const effectiveRatio =
    result
      ? (
          Number(
            result
              .effective_holdings
          )
          / Math.max(
              result.tickers.length,
              1
            )
        )
      : 0;


  return (
    <div className="retail-live-dashboard retail-diversification-page">

      <RetailSidebar
        active="diversification"
      />


      <main className="retail-live-main">

        <div className="retail-diversification-content">

          <header className="retail-diversification-header">

            <div>

              <span>
                PORTFOLIO STRUCTURE
              </span>

              <h1>
                Diversification & Correlation
              </h1>

              <p>
                See whether your holdings behave like genuinely different sources of risk or tend to move together.
              </p>

            </div>


            <button
              type="button"
              onClick={
                () => {

                  setState(
                    (current) => ({
                      ...current,

                      loading:
                        true,

                      error:
                        null,
                    })
                  );

                  setRefreshToken(
                    (value) =>
                      value + 1
                  );

                }
              }
              disabled={
                analysisLoading
              }
            >
              <RefreshCw
                size={15}
                className={
                  analysisLoading
                    ? "spinning"
                    : ""
                }
              />

              {
                analysisLoading
                  ? "Refreshing..."
                  : "Refresh Analysis"
              }
            </button>

          </header>


          {
            state.error
            && (

              <div className="retail-diversification-error">

                <AlertTriangle size={17} />

                <span>
                  {state.error}
                </span>

              </div>

            )
          }


          {
            !result
            && analysisLoading
              ? (

                <section className="retail-diversification-loading">

                  <Activity size={28} />

                  <strong>
                    Analysing portfolio structure…
                  </strong>

                  <span>
                    Calculating historical correlations and concentration using the latest live portfolio weights.
                  </span>

                </section>

              )
              : result
              ? (

                <>

                  <section className="retail-diversification-kpis">

                    <article
                      className={
                        `score-card ${
                          scoreClass(
                            result
                              .diversification_score
                          )
                        }`
                      }
                    >

                      <span>
                        Diversification Score
                      </span>

                      <strong>
                        {
                          Number(
                            result
                              .diversification_score
                          ).toFixed(0)
                        }
                        <small>
                          /100
                        </small>
                      </strong>

                      <em>
                        {
                          scoreLabel(
                            result
                              .diversification_score
                          )
                        }
                      </em>

                    </article>


                    <article>

                      <span>
                        Effective Holdings
                      </span>

                      <strong>
                        {
                          Number(
                            result
                              .effective_holdings
                          ).toFixed(2)
                        }
                      </strong>

                      <small>
                        out of {
                          result
                            .tickers
                            .length
                        } actual holdings
                      </small>

                    </article>


                    <article>

                      <span>
                        Avg. Correlation
                      </span>

                      <strong>
                        {
                          Number(
                            result
                              .weighted_average_correlation
                          ).toFixed(2)
                        }
                      </strong>

                      <small>
                        value-weighted pairwise correlation
                      </small>

                    </article>


                    <article>

                      <span>
                        Concentration Score
                      </span>

                      <strong>
                        {
                          Number(
                            result
                              .concentration_score
                          ).toFixed(0)
                        }
                        <small>
                          /100
                        </small>
                      </strong>

                      <small>
                        position-balance diagnostic
                      </small>

                    </article>

                  </section>


                  <section className="retail-diversification-grid">

                    <article className="retail-correlation-panel">

                      <header>

                        <div>

                          <h2>
                            Correlation Heatmap
                          </h2>

                          <p>
                            Historical daily-return correlation over the last {result.lookback_years} years.
                          </p>

                        </div>

                        <span>
                          {
                            result
                              .observations
                          }
                          {" observations"}
                        </span>

                      </header>


                      <div className="retail-correlation-scroll">

                        <table className="retail-correlation-table">

                          <thead>

                            <tr>

                              <th />

                              {
                                result
                                  .tickers
                                  .map(
                                    (ticker) => (

                                      <th
                                        key={
                                          ticker
                                        }
                                      >
                                        {ticker}
                                      </th>

                                    )
                                  )
                              }

                            </tr>

                          </thead>


                          <tbody>

                            {
                              result
                                .tickers
                                .map(
                                  (
                                    rowTicker
                                  ) => (

                                    <tr
                                      key={
                                        rowTicker
                                      }
                                    >

                                      <th>
                                        {
                                          rowTicker
                                        }
                                      </th>


                                      {
                                        result
                                          .tickers
                                          .map(
                                            (
                                              columnTicker
                                            ) => {

                                              const value =
                                                result
                                                  .correlation_matrix[
                                                    rowTicker
                                                  ][
                                                    columnTicker
                                                  ];


                                              return (

                                                <td
                                                  key={
                                                    `${rowTicker}-${columnTicker}`
                                                  }
                                                  className={
                                                    correlationClass(
                                                      value,
                                                      rowTicker
                                                      === columnTicker
                                                    )
                                                  }
                                                >
                                                  {
                                                    correlationText(
                                                      value
                                                    )
                                                  }
                                                </td>

                                              );

                                            }
                                          )
                                      }

                                    </tr>

                                  )
                                )
                            }

                          </tbody>

                        </table>

                      </div>


                      <div className="retail-correlation-legend">

                        <span>
                          Lower overlap
                        </span>

                        <i className="inverse" />
                        <i className="low" />
                        <i className="moderate" />
                        <i className="high" />
                        <i className="very-high" />

                        <span>
                          Higher overlap
                        </span>

                      </div>

                    </article>


                    <article className="retail-correlation-pairs">

                      <header>

                        <h2>
                          Relationship Signals
                        </h2>

                        <p>
                          The strongest and weakest historical relationships in the portfolio.
                        </p>

                      </header>


                      <div className="retail-pair-card highest">

                        <span>
                          HIGHEST CORRELATION
                        </span>

                        <strong>
                          {
                            pairName(
                              highest
                            )
                          }
                        </strong>

                        <em>
                          {
                            correlationText(
                              highest
                                ?.correlation
                            )
                          }
                        </em>

                        <p>
                          These holdings have historically moved together more closely than the other pairs in your portfolio.
                        </p>

                      </div>


                      <div className="retail-pair-card lowest">

                        <span>
                          LOWEST CORRELATION
                        </span>

                        <strong>
                          {
                            pairName(
                              lowest
                            )
                          }
                        </strong>

                        <em>
                          {
                            correlationText(
                              lowest
                                ?.correlation
                            )
                          }
                        </em>

                        <p>
                          This pair has provided the greatest historical diversification benefit within the current portfolio.
                        </p>

                      </div>

                    </article>

                  </section>


                  <section className="retail-diversification-grid lower">

                    <article className="retail-volatility-panel">

                      <header>

                        <div>

                          <h2>
                            Holding Volatility & Portfolio Weight
                          </h2>

                          <p>
                            Historical annualised volatility alongside current live portfolio weight.
                          </p>

                        </div>

                        <Activity size={18} />

                      </header>


                      <div className="retail-div-vol-list">

                        {
                          [
                            ...result
                              .asset_metrics,
                          ]
                            .sort(
                              (
                                left,
                                right,
                              ) =>
                                right.weight
                                - left.weight
                            )
                            .map(
                              (item) => {

                                const barWidth =
                                  maximumVolatility > 0
                                    ? (
                                        Number(
                                          item
                                            .annualised_volatility
                                        )
                                        / maximumVolatility
                                      )
                                      * 100
                                    : 0;


                                return (

                                  <div
                                    className="retail-div-vol-row"
                                    key={
                                      item.ticker
                                    }
                                  >

                                    <div className="retail-div-vol-label">

                                      <strong>
                                        {
                                          item.ticker
                                        }
                                      </strong>

                                      <span>
                                        {
                                          percent(
                                            item.weight
                                          )
                                        }
                                        {" weight"}
                                      </span>

                                    </div>


                                    <div className="retail-div-vol-track">

                                      <div
                                        style={{
                                          width:
                                            `${Math.max(
                                              4,
                                              barWidth
                                            )}%`,
                                        }}
                                      />

                                    </div>


                                    <strong className="retail-div-vol-value">
                                      {
                                        percent(
                                          item
                                            .annualised_volatility
                                        )
                                      }
                                    </strong>

                                  </div>

                                );

                              }
                            )
                        }

                      </div>

                    </article>


                    <article className="retail-diversification-explanation">

                      <header>

                        <ShieldCheck size={18} />

                        <div>

                          <h2>
                            What this means
                          </h2>

                          <p>
                            FinClarity translates the statistics into portfolio-level context.
                          </p>

                        </div>

                      </header>


                      <div>

                        <strong>
                          Position balance
                        </strong>

                        <p>
                          Your {
                            result.tickers.length
                          } holdings behave like approximately {
                            Number(
                              result
                                .effective_holdings
                            ).toFixed(2)
                          } equally weighted holdings after accounting for position concentration.
                        </p>

                      </div>


                      <div>

                        <strong>
                          Correlation structure
                        </strong>

                        <p>
                          The weighted average historical correlation is {
                            Number(
                              result
                                .weighted_average_correlation
                            ).toFixed(2)
                          }. Lower correlation generally means holdings have provided more independent sources of return variation.
                        </p>

                      </div>


                      <div>

                        <strong>
                          Diversification efficiency
                        </strong>

                        <p>
                          {
                            effectiveRatio >= 0.85
                              ? "Most of the portfolio's nominal holdings are contributing meaningfully to diversification."
                              : effectiveRatio >= 0.65
                                ? "Some diversification is being lost through uneven position sizes."
                                : "The portfolio contains several holdings, but concentration means it behaves like substantially fewer independent positions."
                          }
                        </p>

                      </div>


                      {
                        Number(
                          highest
                            ?.correlation
                        ) >= 0.70
                        && (

                          <div className="warning">

                            <AlertTriangle
                              size={15}
                            />

                            <p>
                              {
                                pairName(
                                  highest
                                )
                              } has a high historical correlation of {
                                correlationText(
                                  highest
                                    ?.correlation
                                )
                              }, so these positions may provide less diversification than their separate ticker names suggest.
                            </p>

                          </div>

                        )
                      }

                    </article>

                  </section>


                  <section className="retail-diversification-methodology">

                    <ShieldCheck size={17} />

                    <div>

                      <strong>
                        Transparent diagnostic methodology
                      </strong>

                      <p>
                        The score combines 45% position concentration and 55% historical cross-asset correlation. It uses current live value weights and approximately three years of historical returns. It is not a forecast, performance score or investment recommendation.
                      </p>

                    </div>

                    {
                      state.generatedAt
                      && (

                        <span>
                          Updated {
                            new Date(
                              state.generatedAt
                            )
                              .toLocaleString()
                          }
                        </span>

                      )
                    }

                  </section>

                </>

              )
              : null
          }

        </div>

      </main>

    </div>
  );
}


export default RetailDiversification;
