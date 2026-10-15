import { API_BASE_URL } from "../lib/apiBase";
import useInstitutionalModelResult from "../hooks/useInstitutionalModelResult";
import InstitutionalModelStatus from "../components/InstitutionalModelStatus";
import { useState } from "react";
import {
  Activity,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import "./Backtesting.css";


import InstitutionalSidebar from "../components/InstitutionalSidebar";

import {
  buildBacktestRequest,
} from "../lib/institutionalModelRequests";

import "../design/FinClarityInstitutionalGlobalTypeScale.css";



const backtestRequest = {
  tickers: [
    "AAPL",
    "MSFT",
    "NVDA",
  ],

  benchmark: "SPY",

  years: 5,

  risk_free_rate: 0.04,

  training_days: 252,

  rebalance_days: 21,

  min_weight: 0,

  max_weight: 1,

  transaction_cost_bps: 10,
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




function buildPath(
  points,
  key,
  width,
  height,
  minimum,
  maximum,
) {
  if (!points.length) {
    return "";
  }

  const paddingX = 18;
  const paddingY = 18;

  const chartWidth =
    width - paddingX * 2;

  const chartHeight =
    height - paddingY * 2;

  const range =
    maximum - minimum || 1;

  return points
    .map((point, index) => {

      const x =
        paddingX
        + (
            index
            / Math.max(
                points.length - 1,
                1
              )
          )
          * chartWidth;

      const y =
        paddingY
        + (
            1
            - (
                Number(
                  point[key]
                )
                - minimum
              )
              / range
          )
          * chartHeight;

      return (
        `${index === 0 ? "M" : "L"}`
        + `${x.toFixed(2)},`
        + `${y.toFixed(2)}`
      );
    })
    .join(" ");
}


function Backtesting() {

  const {
    result,
    saveResult,
    cacheStatus,
    cacheMetadata,
  } = useInstitutionalModelResult(
    "backtesting"
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  async function runBacktest() {

    setLoading(true);
    setError("");

    try {

      const response = await fetch(
        `${API_BASE_URL}/api/backtest/run`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(buildBacktestRequest(backtestRequest)),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail
          || "Backtest failed."
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


  const strategy =
    result?.strategy ?? {};

  const equalWeight =
    result?.equal_weight ?? {};

  const benchmark =
    result?.benchmark ?? {};

  const benchmarkTicker =
    result?.benchmark_ticker
    ?? backtestRequest.benchmark;

  const series =
    result?.cumulative_series ?? [];

  const latestWeights =
    result?.weight_history?.length
      ? result.weight_history[
          result.weight_history.length - 1
        ]
      : null;


  const chartValues =
    series.flatMap(
      (point) => [
        Number(point.strategy),
        Number(point.equal_weight),
        Number(point.benchmark),
      ]
    );


  const chartMinimum =
    chartValues.length
      ? Math.min(...chartValues)
      : 0.8;

  const chartMaximum =
    chartValues.length
      ? Math.max(...chartValues)
      : 1.2;


  const chartWidth = 760;
  const chartHeight = 270;


  const strategyPath =
    buildPath(
      series,
      "strategy",
      chartWidth,
      chartHeight,
      chartMinimum,
      chartMaximum,
    );


  const equalWeightPath =
    buildPath(
      series,
      "equal_weight",
      chartWidth,
      chartHeight,
      chartMinimum,
      chartMaximum,
    );


  const benchmarkPath =
    buildPath(
      series,
      "benchmark",
      chartWidth,
      chartHeight,
      chartMinimum,
      chartMaximum,
    );


  const strategyBeatBenchmark =
    Number(
      strategy.cagr || 0
    )
    >
    Number(
      benchmark.cagr || 0
    );


  return (
    <div className="backtest-page">

      <InstitutionalSidebar />


      <main className="backtest-main fc-inst-standard-page">

        <header className="backtest-header">

          <div>

            <p className="backtest-eyebrow">
              OUT-OF-SAMPLE VALIDATION
            </p>

            <h1>
              Backtesting
            </h1>

            <p>
              Walk-forward portfolio
              optimisation versus equal-weight
              and SPY benchmarks.
            </p>

          </div>


          <button
            className="backtest-run-button"
            onClick={runBacktest}
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "backtest-spin"
                  : ""
              }
            />

            {
              loading
                ? "Running Backtest..."
                : (
                  error
                    ? "Retry Backtest"
                    : "Run Backtest"
                )
            }

          </button>

        </header>

        <InstitutionalModelStatus
          status={cacheStatus}
          metadata={cacheMetadata}
          modelName="Backtesting"
        />



        {error && (

          <div className="backtest-error">
            {error}
          </div>

        )}


        {!result && (

          <section className="backtest-empty">

            {
              loading
                ? (
                    <RefreshCw
                      size={36}
                      className="backtest-spin"
                    />
                  )
                : (
                    <Activity
                      size={36}
                    />
                  )
            }

            <h2>
              {
                loading
                  ? "Running walk-forward simulation"
                  : "Awaiting backtest"
              }
            </h2>

            <p>
              The optimiser will train only
              on information available before
              each rebalance date, then evaluate
              the resulting portfolio on the
              following holding period.
            </p>

          </section>

        )}


        {result && (

          <>

            <section className="backtest-summary-grid">

              <div className="backtest-summary-card">

                <span>
                  Strategy CAGR
                </span>

                <strong>
                  {
                    percentage(
                      strategy.cagr
                    )
                  }
                </strong>

                <small>
                  Walk-forward max-Sharpe
                </small>

              </div>


              <div className="backtest-summary-card">

                <span>
                  Strategy Sharpe
                </span>

                <strong>
                  {
                    Number(
                      strategy.sharpe_ratio
                      || 0
                    ).toFixed(2)
                  }
                </strong>

                <small>
                  Net of transaction costs
                </small>

              </div>


              <div className="backtest-summary-card">

                <span>
                  Max Drawdown
                </span>

                <strong>
                  {
                    percentage(
                      strategy.max_drawdown
                    )
                  }
                </strong>

                <small>
                  Peak-to-trough loss
                </small>

              </div>


              <div className="backtest-summary-card">

                <span>
                  vs SPY
                </span>

                <strong
                  className={
                    strategyBeatBenchmark
                      ? "backtest-positive"
                      : "backtest-negative"
                  }
                >
                  {
                    strategyBeatBenchmark
                      ? "Outperformed"
                      : "Underperformed"
                  }
                </strong>

                <small>
                  CAGR comparison
                </small>

              </div>

            </section>


            <section className="backtest-panel">

              <div className="backtest-panel-header">

                <div>

                  <h2>
                    Equity Curve
                  </h2>

                  <p>
                    Growth of one unit of capital
                    during the out-of-sample period.
                  </p>

                </div>

                <TrendingUp size={18} />

              </div>


              <div className="backtest-chart-wrap">

                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="backtest-chart"
                  role="img"
                  aria-label="Backtest cumulative wealth chart"
                >

                  <line
                    x1="18"
                    y1={chartHeight - 18}
                    x2={chartWidth - 18}
                    y2={chartHeight - 18}
                    className="backtest-axis"
                  />

                  <line
                    x1="18"
                    y1="18"
                    x2="18"
                    y2={chartHeight - 18}
                    className="backtest-axis"
                  />


                  <path
                    d={strategyPath}
                    className="backtest-line strategy"
                  />


                  <path
                    d={equalWeightPath}
                    className="backtest-line equal"
                  />


                  <path
                    d={benchmarkPath}
                    className="backtest-line benchmark"
                  />

                </svg>


                <div className="backtest-chart-legend">

                  <span>
                    <i className="strategy" />
                    Max-Sharpe Strategy
                  </span>

                  <span>
                    <i className="equal" />
                    Equal Weight
                  </span>

                  <span>
                    <i className="benchmark" />
                    {benchmarkTicker}
                  </span>

                </div>

              </div>

            </section>


            <section className="backtest-panel">

              <div className="backtest-panel-header">

                <div>

                  <h2>
                    Performance Comparison
                  </h2>

                  <p>
                    Risk and return statistics
                    over the same evaluation period.
                  </p>

                </div>

                <Activity size={18} />

              </div>


              <div className="backtest-table">

                <div className="backtest-table-row header">

                  <span>
                    Portfolio
                  </span>

                  <span>
                    CAGR
                  </span>

                  <span>
                    Ann. Return
                  </span>

                  <span>
                    Volatility
                  </span>

                  <span>
                    Sharpe
                  </span>

                  <span>
                    Max Drawdown
                  </span>

                  <span>
                    Win Rate
                  </span>

                </div>


                {
                  [
                    [
                      "Max-Sharpe",
                      strategy,
                    ],

                    [
                      "Equal Weight",
                      equalWeight,
                    ],

                    [
                      benchmarkTicker,
                      benchmark,
                    ],
                  ].map(
                    (
                      [
                        label,
                        metrics,
                      ]
                    ) => (

                      <div
                        className="backtest-table-row"
                        key={label}
                      >

                        <strong>
                          {label}
                        </strong>

                        <span>
                          {
                            percentage(
                              metrics.cagr
                            )
                          }
                        </span>

                        <span>
                          {
                            percentage(
                              metrics
                                .annualised_return
                            )
                          }
                        </span>

                        <span>
                          {
                            percentage(
                              metrics
                                .annualised_volatility
                            )
                          }
                        </span>

                        <span>
                          {
                            Number(
                              metrics
                                .sharpe_ratio
                              || 0
                            ).toFixed(2)
                          }
                        </span>

                        <span>
                          {
                            percentage(
                              metrics
                                .max_drawdown
                            )
                          }
                        </span>

                        <span>
                          {
                            percentage(
                              metrics
                                .win_rate,
                              1
                            )
                          }
                        </span>

                      </div>

                    )
                  )
                }

              </div>

            </section>


            <section className="backtest-two-column">

              <div className="backtest-panel">

                <div className="backtest-panel-header">

                  <div>

                    <h2>
                      Rebalancing
                    </h2>

                    <p>
                      Trading activity and
                      implementation assumptions.
                    </p>

                  </div>

                  <RefreshCw size={18} />

                </div>


                <div className="backtest-stat-grid">

                  <div>

                    <span>
                      Rebalances
                    </span>

                    <strong>
                      {
                        result
                          .rebalance_count
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Average Turnover
                    </span>

                    <strong>
                      {
                        percentage(
                          result
                            .average_turnover,
                          1
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Transaction Cost
                    </span>

                    <strong>
                      {
                        result
                          .configuration
                          .transaction_cost_bps
                      }
                      {" "}bps
                    </strong>

                  </div>


                  <div>

                    <span>
                      Rebalance Frequency
                    </span>

                    <strong>
                      {
                        result
                          .configuration
                          .rebalance_days
                      }
                      {" "}days
                    </strong>

                  </div>

                </div>

              </div>


              <div className="backtest-panel">

                <div className="backtest-panel-header">

                  <div>

                    <h2>
                      Latest Allocation
                    </h2>

                    <p>
                      Weights from the most
                      recent historical rebalance.
                    </p>

                  </div>

                  <TrendingDown size={18} />

                </div>


                {
                  latestWeights
                  && (

                    <div className="backtest-weight-list">

                      {
                        Object.entries(
                          latestWeights.weights
                        ).map(
                          (
                            [
                              ticker,
                              weight,
                            ]
                          ) => (

                            <div
                              className="backtest-weight-item"
                              key={ticker}
                            >

                              <div>

                                <strong>
                                  {ticker}
                                </strong>

                                <span>
                                  {
                                    percentage(
                                      weight,
                                      1
                                    )
                                  }
                                </span>

                              </div>


                              <div className="backtest-weight-track">

                                <div
                                  style={{
                                    width:
                                      `${Math.min(
                                        Number(
                                          weight
                                        )
                                        * 100,
                                        100
                                      )}%`,
                                  }}
                                />

                              </div>

                            </div>

                          )
                        )
                      }


                      <div className="backtest-rebalance-meta">

                        <span>
                          {
                            latestWeights.date
                          }
                        </span>

                        <span>
                          {
                            latestWeights.status
                          }
                        </span>

                      </div>

                    </div>

                  )
                }

              </div>

            </section>


            <section className="backtest-disclosure">

              <ShieldCheck size={18} />

              <div>

                <strong>
                  Point-in-time discipline
                </strong>

                <p>
                  Sentiment is intentionally
                  excluded from this backtest.
                  FinClarity currently retrieves
                  recent news rather than a
                  historical point-in-time news
                  archive, so including today's
                  FinBERT scores in historical
                  periods would introduce
                  look-ahead bias.
                </p>

              </div>

            </section>


            <div className="backtest-methodology">

              <span>
                {
                  result.start_date
                }
                {" → "}
                {
                  result.end_date
                }
              </span>

              <span>
                Training:
                {" "}
                {
                  result
                    .configuration
                    .training_days
                }
                {" "}days
              </span>

              <span>
                Rebalance:
                {" "}
                {
                  result
                    .configuration
                    .rebalance_days
                }
                {" "}days
              </span>

              <span>
                Benchmark:
                {" "}
                {
                  benchmarkTicker
                }
              </span>

              <span>
                Look-ahead:
                {" "}
                none
              </span>

            </div>

          </>

        )}

      </main>

    </div>
  );
}


export default Backtesting;
