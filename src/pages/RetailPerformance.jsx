import { API_BASE_URL } from "../lib/apiBase";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
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

import useRetailPortfolio
  from "../hooks/useRetailPortfolio";

import {
  readRetailMarketSnapshot,
} from "../lib/retailMarketSnapshot";

import "./RetailDashboardLive.css";
import "./RetailPerformance.css";


const API = API_BASE_URL;

const CACHE_KEY =
  "finclarity_retail_performance_v4";


const BENCHMARKS = [
  {
    value:
      "ACWI",

    label:
      "ACWI · Global Equities",
  },

  {
    value:
      "SPY",

    label:
      "SPY · S&P 500",
  },

  {
    value:
      "QQQ",

    label:
      "QQQ · Nasdaq 100",
  },
];


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
      || record?.signature !== signature
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
  signed = false,
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


  const sign =
    signed
    && number > 0
      ? "+"
      : "";


  return (
    `${sign}${
      (
        number * 100
      ).toFixed(
        digits
      )
    }%`
  );
}


function numberText(
  value,
  digits = 2,
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
    digits
  );
}


function formatDate(
  value,
) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }


  return date.toLocaleDateString(
    "en-GB",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );
}


function PerformanceChart({
  points,
  benchmark,
}) {

  const chart =
    useMemo(
      () => {

        if (
          !Array.isArray(
            points
          )
          || points.length < 2
        ) {
          return null;
        }


        const width =
          1000;

        const height =
          350;

        const padding = {
          top:
            24,

          right:
            24,

          bottom:
            38,

          left:
            58,
        };


        const portfolioValues =
          points.map(
            (point) =>
              Number(
                point.portfolio
              )
              * 10000
          );


        const benchmarkValues =
          points.map(
            (point) =>
              Number(
                point.benchmark
              )
              * 10000
          );


        const values = [
          ...portfolioValues,
          ...benchmarkValues,
        ];


        const minimum =
          Math.min(
            ...values
          );

        const maximum =
          Math.max(
            ...values
          );


        const range =
          maximum - minimum
          || 1;


        const innerWidth =
          width
          - padding.left
          - padding.right;

        const innerHeight =
          height
          - padding.top
          - padding.bottom;


        function x(
          index,
        ) {

          return (
            padding.left
            + (
                index
                / (
                    points.length
                    - 1
                  )
              )
              * innerWidth
          );
        }


        function y(
          value,
        ) {

          return (
            padding.top
            + (
                1
                - (
                    (
                      value
                      - minimum
                    )
                    / range
                  )
              )
              * innerHeight
          );
        }


        function pathFor(
          valuesToPlot,
        ) {

          return valuesToPlot
            .map(
              (
                value,
                index,
              ) =>
                `${
                  index === 0
                    ? "M"
                    : "L"
                } ${
                  x(
                    index
                  ).toFixed(2)
                } ${
                  y(
                    value
                  ).toFixed(2)
                }`
            )
            .join(
              " "
            );
        }


        const ticks =
          Array.from(
            {
              length:
                5,
            },
            (
              _,
              index,
            ) => {

              const value =
                minimum
                + (
                    (
                      maximum
                      - minimum
                    )
                    * index
                    / 4
                  );


              return {
                value,

                y:
                  y(
                    value
                  ),
              };

            }
          )
          .reverse();


        const dateIndexes = [
          0,

          Math.floor(
            (
              points.length
              - 1
            )
            / 2
          ),

          points.length
          - 1,
        ];


        return {
          width,
          height,
          padding,
          portfolioPath:
            pathFor(
              portfolioValues
            ),

          benchmarkPath:
            pathFor(
              benchmarkValues
            ),

          ticks,
          dateIndexes,

          x,
          points,

          finalPortfolio:
            portfolioValues[
              portfolioValues.length
              - 1
            ],

          finalBenchmark:
            benchmarkValues[
              benchmarkValues.length
              - 1
            ],
        };

      },
      [
        points,
      ]
    );


  if (!chart) {

    return (
      <div className="retail-performance-chart-empty">
        Chart unavailable.
      </div>
    );

  }


  return (
    <div className="retail-performance-chart-wrap">

      <svg
        className="retail-performance-chart"
        viewBox={
          `0 0 ${
            chart.width
          } ${
            chart.height
          }`
        }
        role="img"
        aria-label={
          `Hypothetical portfolio growth compared with ${benchmark}`
        }
      >

        {
          chart.ticks.map(
            (
              tick,
              index,
            ) => (

              <g
                key={
                  `tick-${index}`
                }
              >

                <line
                  x1={
                    chart
                      .padding
                      .left
                  }
                  x2={
                    chart.width
                    - chart
                        .padding
                        .right
                  }
                  y1={
                    tick.y
                  }
                  y2={
                    tick.y
                  }
                  className="retail-performance-gridline"
                />

                <text
                  x={
                    chart
                      .padding
                      .left
                    - 10
                  }
                  y={
                    tick.y + 4
                  }
                  textAnchor="end"
                  className="retail-performance-axis-text"
                >
                  £{
                    Math.round(
                      tick.value
                    )
                      .toLocaleString(
                        "en-GB"
                      )
                  }
                </text>

              </g>

            )
          )
        }


        <path
          d={
            chart.benchmarkPath
          }
          className="retail-performance-line benchmark"
        />


        <path
          d={
            chart.portfolioPath
          }
          className="retail-performance-line portfolio"
        />


        {
          chart.dateIndexes.map(
            (
              index,
            ) => (

              <text
                key={
                  `date-${index}`
                }
                x={
                  chart.x(
                    index
                  )
                }
                y={
                  chart.height
                  - 10
                }
                textAnchor={
                  index === 0
                    ? "start"
                    : index
                        === chart
                          .points
                          .length
                          - 1
                      ? "end"
                      : "middle"
                }
                className="retail-performance-axis-text"
              >
                {
                  formatDate(
                    chart
                      .points[
                        index
                      ]
                      .date
                  )
                }
              </text>

            )
          )
        }

      </svg>


      <div className="retail-performance-legend">

        <span>

          <i className="portfolio" />

          Current-weight portfolio

        </span>


        <span>

          <i className="benchmark" />

          {benchmark}

        </span>

      </div>

    </div>
  );
}


function RetailPerformance() {

  const portfolio =
    useRetailPortfolio();


  const snapshot =
    readRetailMarketSnapshot(
      portfolio
    );


  const market =
    snapshot?.market
    ?? null;


  const holdings =
    Array.isArray(
      market?.holdings
    )
      ? market.holdings
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


  const [
    benchmark,
    setBenchmark,
  ] =
    useState(
      "ACWI"
    );


  const [
    years,
    setYears,
  ] =
    useState(
      3
    );


  const request =
    (
      analysable.length >= 1
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

          benchmark,

          years,

          base_currency:
            String(
              portfolio?.baseCurrency
              ?? "USD"
            )
              .trim()
              .toUpperCase(),
        }
      : null;


  const requestSignature =
    request
      ? JSON.stringify(
          request
        )
      : "";


  const initialCache =
    readCache(
      requestSignature
    );


  const [
    result,
    setResult,
  ] =
    useState(
      initialCache?.result
      ?? null
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


  const [
    generatedAt,
    setGeneratedAt,
  ] =
    useState(
      initialCache
        ?.generatedAt
      ?? null
    );


  const loading =
    Boolean(
      requestSignature
      && !result
      && !error
    );


  useEffect(
    () => {

      if (
        !requestSignature
      ) {
        return undefined;
      }


      const cached =
        readCache(
          requestSignature
        );


      if (
        refreshToken === 0
        && cached
      ) {
        return undefined;
      }


      let cancelled =
        false;


      async function run() {

        try {

          const response =
            await fetch(
              `${API}/api/performance/analyse`,
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
              ?? "Performance analysis failed."
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


          setResult(
            payload
          );

          setError(
            null
          );

          setGeneratedAt(
            record.generatedAt
          );

        } catch (runError) {

          if (cancelled) {
            return;
          }


          setError(
            runError?.message
            ?? "Performance analysis failed."
          );

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


  function changeBenchmark(
    event,
  ) {

    setResult(
      null
    );

    setError(
      null
    );

    setRefreshToken(
      0
    );

    setBenchmark(
      event
        .target
        .value
    );
  }


  function changeYears(
    event,
  ) {

    setResult(
      null
    );

    setError(
      null
    );

    setRefreshToken(
      0
    );

    setYears(
      Number(
        event
          .target
          .value
      )
    );
  }


  if (
    !requestSignature
  ) {

    return (
      <div className="retail-live-dashboard retail-performance-page">

        <RetailSidebar
          active="performance"
        />


        <main className="retail-live-main">

          <section className="retail-performance-empty">

            <BarChart3 size={34} />

            <h1>
              Performance & Benchmark
            </h1>

            <p>
              Run Portfolio Analysis first so FinClarity can use your current live portfolio weights.
            </p>

            <Link to="/retail">
              Go to Dashboard
            </Link>

          </section>

        </main>

      </div>
    );

  }


  const portfolioMetrics =
    result?.portfolio
    ?? {};


  const benchmarkMetrics =
    result?.benchmark_metrics
    ?? {};


  const relative =
    result?.relative
    ?? {};


  const relativeReturn =
    Number(
      relative
        ?.cumulative_return_difference
    );


  return (
    <div className="retail-live-dashboard retail-performance-page">

      <RetailSidebar
        active="performance"
      />


      <main className="retail-live-main">

        <div className="retail-performance-content">

          <header className="retail-performance-header">

            <div>

              <span>
                HISTORICAL SIMULATION
              </span>

              <h1>
                Performance & Benchmark
              </h1>

              <p>
                Compare a hypothetical history of today's portfolio allocation with a market benchmark. All holding and benchmark returns are translated into {
                  result?.base_currency
                  ?? request?.base_currency
                  ?? "USD"
                } before performance is calculated.
              </p>


              {
                result
                  ?.data_coverage
                  ?.weights_renormalised
                && (

                  <div
                    className="retail-performance-coverage-warning"
                    role="status"
                  >

                    <AlertTriangle
                      size={18}
                    />

                    <div>

                      <strong>
                        Partial portfolio data coverage
                      </strong>

                      <span>
                        {
                          percent(
                            result
                              .data_coverage
                              .weight_coverage,
                            1
                          )
                        } of the requested portfolio weight had sufficient historical data. The remaining {
                          percent(
                            result
                              .data_coverage
                              .excluded_weight,
                            1
                          )
                        } was excluded and the analysed holdings were reweighted to 100%.

                        {
                          result
                            .data_coverage
                            .excluded_tickers
                            ?.length > 0
                          && (
                            <>
                              {" Excluded: "}
                              <b>
                                {
                                  result
                                    .data_coverage
                                    .excluded_tickers
                                    .join(
                                      ", "
                                    )
                                }
                              </b>
                              .
                            </>
                          )
                        }
                      </span>

                    </div>

                  </div>

                )
              }

            </div>


            <div className="retail-performance-controls">

              <select
                value={
                  benchmark
                }
                onChange={
                  changeBenchmark
                }
                aria-label="Benchmark"
              >

                {
                  BENCHMARKS.map(
                    (item) => (

                      <option
                        value={
                          item.value
                        }
                        key={
                          item.value
                        }
                      >
                        {item.label}
                      </option>

                    )
                  )
                }

              </select>


              <select
                value={
                  years
                }
                onChange={
                  changeYears
                }
                aria-label="Lookback period"
              >
                <option value="1">
                  1 year
                </option>

                <option value="3">
                  3 years
                </option>

                <option value="5">
                  5 years
                </option>
              </select>


              <button
                type="button"
                onClick={
                  () => {

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

                  }
                }
              >
                <RefreshCw size={15} />
                Refresh
              </button>

            </div>

          </header>


          {
            error
            && (

              <div className="retail-performance-error">

                <AlertTriangle size={16} />

                <span>
                  {error}
                </span>

              </div>

            )
          }


          {
            loading
            ? (

              <section className="retail-performance-loading">

                <Activity size={28} />

                <strong>
                  Building historical simulation…
                </strong>

                <span>
                  Comparing today's portfolio weights with {benchmark}.
                </span>

              </section>

            )
            : result
            ? (

              <>

                <section className="retail-performance-kpis">

                  <article>

                    <span>
                      Simulated Portfolio Return
                    </span>

                    <strong className="positive">
                      {
                        percent(
                          portfolioMetrics
                            .cumulative_return,
                          1,
                          true
                        )
                      }
                    </strong>

                    <small>
                      {
                        formatDate(
                          result.start_date
                        )
                      }
                      {" → "}
                      {
                        formatDate(
                          result.end_date
                        )
                      }
                    </small>

                  </article>


                  <article>

                    <span>
                      {benchmark} Return
                    </span>

                    <strong>
                      {
                        percent(
                          benchmarkMetrics
                            .cumulative_return,
                          1,
                          true
                        )
                      }
                    </strong>

                    <small>
                      same historical window
                    </small>

                  </article>


                  <article>

                    <span>
                      Cumulative Outperformance
                    </span>

                    <strong
                      className={
                        relativeReturn >= 0
                          ? "positive"
                          : "negative"
                      }
                    >
                      {
                        Number.isFinite(
                          relativeReturn
                        )
                          ? `${
                              relativeReturn > 0
                                ? "+"
                                : ""
                            }${
                              (
                                relativeReturn
                                * 100
                              ).toFixed(
                                1
                              )
                            } pp`
                          : "—"
                      }
                    </strong>

                    <small>
                      percentage-point difference vs {benchmark}
                    </small>

                  </article>


                  <article>

                    <span>
                      Portfolio Beta
                    </span>

                    <strong>
                      {
                        numberText(
                          relative.beta,
                          2
                        )
                      }
                    </strong>

                    <small>
                      historical sensitivity to {benchmark}
                    </small>

                  </article>

                </section>


                <section className="retail-performance-chart-panel">

                  <header>

                    <div>

                      <TrendingUp size={18} />

                      <div>

                        <h2>
                          Growth of £10,000
                        </h2>

                        <p>
                          Hypothetical constant-weight simulation compared with {benchmark}.
                        </p>

                      </div>

                    </div>


                    <span>
                      {
                        result.observations
                      }
                      {" observations"}
                    </span>

                  </header>


                  <PerformanceChart
                    points={
                      result.chart
                    }
                    benchmark={
                      benchmark
                    }
                  />

                </section>


                <section className="retail-performance-grid">

                  <article className="retail-performance-comparison">

                    <header>

                      <BarChart3 size={18} />

                      <div>

                        <h2>
                          Portfolio vs Benchmark
                        </h2>

                        <p>
                          Risk and return characteristics over the same historical period.
                        </p>

                      </div>

                    </header>


                    <div className="retail-performance-comparison-table">

                      <div className="heading">
                        <span>
                          Metric
                        </span>

                        <span>
                          Portfolio
                        </span>

                        <span>
                          {benchmark}
                        </span>
                      </div>


                      <div>

                        <span>
                          Annualised return
                        </span>

                        <strong>
                          {
                            percent(
                              portfolioMetrics
                                .annualised_return
                            )
                          }
                        </strong>

                        <strong>
                          {
                            percent(
                              benchmarkMetrics
                                .annualised_return
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Annualised volatility
                        </span>

                        <strong>
                          {
                            percent(
                              portfolioMetrics
                                .annualised_volatility
                            )
                          }
                        </strong>

                        <strong>
                          {
                            percent(
                              benchmarkMetrics
                                .annualised_volatility
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Maximum drawdown
                        </span>

                        <strong className="negative">
                          {
                            percent(
                              portfolioMetrics
                                .max_drawdown
                            )
                          }
                        </strong>

                        <strong className="negative">
                          {
                            percent(
                              benchmarkMetrics
                                .max_drawdown
                            )
                          }
                        </strong>

                      </div>

                    </div>

                  </article>


                  <article className="retail-relative-performance">

                    <header>

                      <TrendingUp size={18} />

                      <div>

                        <h2>
                          Relative Performance
                        </h2>

                        <p>
                          How differently the simulated portfolio behaved from {benchmark}.
                        </p>

                      </div>

                    </header>


                    <div className="retail-relative-metrics">

                      <div>

                        <span>
                          Correlation
                        </span>

                        <strong>
                          {
                            numberText(
                              relative
                                .correlation,
                              2
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Tracking Error
                        </span>

                        <strong>
                          {
                            percent(
                              relative
                                .tracking_error
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Information Ratio
                        </span>

                        <strong>
                          {
                            numberText(
                              relative
                                .information_ratio,
                              2
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Daily Outperformance
                        </span>

                        <strong>
                          {
                            percent(
                              relative
                                .daily_outperformance_rate
                            )
                          }
                        </strong>

                      </div>

                    </div>


                    <div className="retail-performance-interpretation">

                      {
                        relativeReturn >= 0
                          ? <TrendingUp size={17} />
                          : <TrendingDown size={17} />
                      }

                      <p>
                        Over this historical simulation, today's portfolio weights {
                          relativeReturn >= 0
                            ? "outperformed"
                            : "underperformed"
                        } {benchmark} by {
                          Number.isFinite(
                            relativeReturn
                          )
                            ? `${
                                (
                                  Math.abs(
                                    relativeReturn
                                  )
                                  * 100
                                ).toFixed(
                                  1
                                )
                              } percentage points`
                            : "—"
                        } in cumulative return. This does not imply the same relationship will persist.
                      </p>

                    </div>

                  </article>

                </section>


                <section className="retail-performance-holdings">

                  <header>

                    <div>

                      <BarChart3 size={18} />

                      <div>

                        <h2>
                          Holding Context
                        </h2>

                        <p>
                          Historical return and volatility of the securities currently in the portfolio.
                        </p>

                      </div>

                    </div>

                  </header>


                  <div className="retail-performance-holding-list">

                    {
                      result
                        .holding_metrics
                        .map(
                          (holding) => (

                            <div
                              key={
                                holding.ticker
                              }
                            >

                              <strong>
                                {
                                  holding.ticker
                                }
                              </strong>

                              <span>
                                {
                                  percent(
                                    holding.weight
                                  )
                                }
                                {" weight"}
                              </span>

                              <span>
                                {
                                  percent(
                                    holding
                                      .historical_return,
                                    1,
                                    true
                                  )
                                }
                                {" historical return"}
                              </span>

                              <span>
                                {
                                  percent(
                                    holding
                                      .annualised_volatility
                                  )
                                }
                                {" volatility"}
                              </span>

                            </div>

                          )
                        )
                    }

                  </div>

                </section>


                <section className="retail-performance-methodology">

                  <ShieldCheck size={17} />

                  <div>

                    <strong>
                      This is a simulation, not your realised performance
                    </strong>

                    <p>
                      FinClarity applies today's portfolio weights across historical daily returns and assumes constant daily rebalancing. It does not reconstruct when you actually bought the securities, historical deposits or withdrawals, taxes, transaction costs, or past portfolio weights.
                    </p>

                  </div>


                  {
                    generatedAt
                    && (

                      <span>
                        Updated {
                          new Date(
                            generatedAt
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


export default RetailPerformance;
