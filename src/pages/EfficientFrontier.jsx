import { API_BASE_URL } from "../lib/apiBase";
import useInstitutionalModelSettings from "../hooks/useInstitutionalModelSettings";
import useInstitutionalModelResult from "../hooks/useInstitutionalModelResult";
import InstitutionalModelStatus from "../components/InstitutionalModelStatus";
import {
  useMemo,
  useState,
} from "react";

import {
  CircleDot,
  LineChart,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import InstitutionalSidebar
  from "../components/InstitutionalSidebar";

import useInstitutionalPortfolio
  from "../hooks/useInstitutionalPortfolio";

import {
  buildPortfolioRequest,
} from "../lib/institutionalModelRequests";

import "./EfficientFrontier.css";


import "../design/FinClarityInstitutionalGlobalTypeScale.css";



const baseRequest = {
  years: 3,
  risk_free_rate: 0.04,
  min_weight: 0,
  max_weight: 1,
  frontier_points: 50,
};


const EMPTY_PORTFOLIO = {};


function percent(
  value,
  digits = 2,
) {

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${(
    number * 100
  ).toFixed(digits)}%`;
}


function metric(
  value,
  digits = 2,
) {

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(digits);
}


function getReturn(
  item,
) {

  return Number(
    item?.expected_return
    ?? item?.return
    ?? item?.portfolio_return
  );
}


function getVolatility(
  item,
) {

  return Number(
    item?.volatility
    ?? item?.risk
    ?? item?.portfolio_volatility
  );
}


function getSharpe(
  item,
  riskFreeRate = baseRequest.risk_free_rate,
) {

  const direct =
    Number(
      item?.sharpe_ratio
      ?? item?.sharpe
    );


  if (
    Number.isFinite(
      direct
    )
  ) {

    return direct;
  }


  const expectedReturn =
    getReturn(
      item
    );


  const volatility =
    getVolatility(
      item
    );


  if (
    Number.isFinite(
      expectedReturn
    )
    && Number.isFinite(
      volatility
    )
    && volatility > 0
  ) {

    return (
      (
        expectedReturn
        - riskFreeRate
      )
      / volatility
    );
  }


  return Number.NaN;
}


function getWeights(
  section,
  tickers,
) {

  const candidate =
    section?.weights
    ?? section?.portfolio_weights
    ?? section?.allocation;


  if (
    candidate
    && !Array.isArray(candidate)
    && typeof candidate === "object"
  ) {

    return candidate;
  }


  if (
    Array.isArray(candidate)
  ) {

    return Object.fromEntries(
      tickers.map(
        (ticker, index) => [
          ticker,
          Number(
            candidate[index] || 0
          ),
        ]
      )
    );
  }


  return {};
}


function EfficientFrontier() {

  const modelSettings =
    useInstitutionalModelSettings();



  const activePortfolio =
    useInstitutionalPortfolio();


  const {
    result,
    saveResult,
    cacheStatus,
    cacheMetadata,
  } = useInstitutionalModelResult(
    "efficient-frontier"
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

      const response =
        await fetch(
          `${API_BASE_URL}/api/portfolio/analyse`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              buildPortfolioRequest(
                baseRequest
              )
            ),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail
          || "Efficient frontier analysis failed."
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


  const frontier =
    useMemo(
      () => {

        const raw =
          result?.efficient_frontier
          ?? result?.frontier
          ?? [];


        return raw
          .map(
            (point) => ({
              ...point,

              _return:
                getReturn(
                  point
                ),

              _volatility:
                getVolatility(
                  point
                ),
            })
          )
          .filter(
            (point) =>
              Number.isFinite(
                point._return
              )
              && Number.isFinite(
                point._volatility
              )
          )
          .sort(
            (left, right) =>
              left._volatility
              - right._volatility
          );

      },
      [result]
    );


  const current =
    result?.current_portfolio
    ?? result?.current
    ?? EMPTY_PORTFOLIO;


  const maximumSharpe =
    result?.maximum_sharpe
    ?? result?.max_sharpe
    ?? EMPTY_PORTFOLIO;


  const minimumVariance =
    result?.minimum_variance
    ?? result?.min_variance
    ?? EMPTY_PORTFOLIO;


  const tickers =
    result?.tickers
    ?? activePortfolio
      .holdings
      ?.map(
        (holding) =>
          holding.ticker
      )
    ?? [];


  /*
   * The optimiser may return the complete
   * minimum-variance opportunity set,
   * including portfolios below the global
   * minimum-variance return.
   *
   * Those points form the inefficient lower
   * branch and should not be displayed as
   * part of the Efficient Frontier.
   */
  const efficientFrontier =
    useMemo(
      () => {

        const minimumVarianceReturn =
          getReturn(
            minimumVariance
          );


        const candidates =
          frontier
            .filter(
              (point) =>
                !Number.isFinite(
                  minimumVarianceReturn
                )
                || point._return
                  >= minimumVarianceReturn
                    - 0.00000001
            )
            .sort(
              (left, right) =>
                left._return
                - right._return
            );


        /*
         * Numerical optimisers can occasionally
         * return tiny non-monotonic artefacts.
         * Keep only the economically efficient
         * sequence where risk does not decrease
         * as target return rises.
         */

        const clean = [];

        let lastRisk =
          -Infinity;


        for (
          const point
          of candidates
        ) {

          if (
            point._volatility
            >= lastRisk
              - 0.000001
          ) {

            clean.push(
              point
            );

            lastRisk =
              Math.max(
                lastRisk,
                point._volatility
              );
          }
        }


        return clean;

      },
      [
        frontier,
        minimumVariance,
      ]
    );


  const maxSharpeWeights =
    getWeights(
      maximumSharpe,
      tickers,
    );


  const chart = useMemo(
    () => {

      const currentPoint = {
        risk:
          getVolatility(
            current
          ),

        return:
          getReturn(
            current
          ),
      };


      const maxPoint = {
        risk:
          getVolatility(
            maximumSharpe
          ),

        return:
          getReturn(
            maximumSharpe
          ),
      };


      const minPoint = {
        risk:
          getVolatility(
            minimumVariance
          ),

        return:
          getReturn(
            minimumVariance
          ),
      };


      const allPoints = [
        ...efficientFrontier.map(
          (point) => ({
            risk:
              point._volatility,

            return:
              point._return,
          })
        ),

        currentPoint,
        maxPoint,
        minPoint,
      ].filter(
        (point) =>
          Number.isFinite(
            point.risk
          )
          && Number.isFinite(
            point.return
          )
      );


      if (!allPoints.length) {

        return {
          path: "",
          cmlPath: "",
          current: null,
          maximumSharpe: null,
          minimumVariance: null,
        };
      }


      const width = 820;
      const height = 360;

      const padLeft = 58;
      const padRight = 24;
      const padTop = 25;
      const padBottom = 42;


      const risks =
        allPoints.map(
          (point) =>
            point.risk
        );


      const returns =
        allPoints.map(
          (point) =>
            point.return
        );


      const riskMinimum =
        Math.min(
          0,
          ...risks
        );


      const riskMaximum =
        Math.max(
          ...risks
        )
        * 1.08;


      const returnMinimum =
        Math.min(
          modelSettings.market.riskFreeRate,
          ...returns
        )
        * 0.92;


      const returnMaximum =
        Math.max(
          ...returns
        )
        * 1.08;


      const xScale =
        (risk) =>
          padLeft
          + (
              (
                risk
                - riskMinimum
              )
              / Math.max(
                  riskMaximum
                  - riskMinimum,
                  0.0001
                )
            )
            * (
                width
                - padLeft
                - padRight
              );


      const yScale =
        (portfolioReturn) =>
          padTop
          + (
              1
              - (
                  (
                    portfolioReturn
                    - returnMinimum
                  )
                  / Math.max(
                      returnMaximum
                      - returnMinimum,
                      0.0001
                    )
                )
            )
            * (
                height
                - padTop
                - padBottom
              );


      const path =
        efficientFrontier
          .map(
            (point, index) => {

              const x =
                xScale(
                  point._volatility
                );


              const y =
                yScale(
                  point._return
                );


              return (
                `${index === 0 ? "M" : "L"}`
                + `${x.toFixed(2)},`
                + `${y.toFixed(2)}`
              );
            }
          )
          .join(" ");


      const transform =
        (point) => {

          if (
            !Number.isFinite(
              point.risk
            )
            || !Number.isFinite(
              point.return
            )
          ) {
            return null;
          }


          return {
            x:
              xScale(
                point.risk
              ),

            y:
              yScale(
                point.return
              ),
          };
        };


      const maxMarker =
        transform(
          maxPoint
        );


      let cmlPath = "";


      if (
        maxMarker
        && maxPoint.risk > 0
      ) {

        cmlPath = (
          `M${xScale(0).toFixed(2)},`
          + `${yScale(
              baseRequest
                .risk_free_rate
            ).toFixed(2)} `
          + `L${maxMarker.x.toFixed(2)},`
          + `${maxMarker.y.toFixed(2)}`
        );
      }


      return {
        width,
        height,
        padLeft,
        padRight,
        padTop,
        padBottom,
        path,
        cmlPath,

        current:
          transform(
            currentPoint
          ),

        maximumSharpe:
          maxMarker,

        minimumVariance:
          transform(
            minPoint
          ),

        riskMaximum,
        returnMinimum,
        returnMaximum,
      };

    },
    [
      current,
      efficientFrontier,
      maximumSharpe,
      minimumVariance,
      modelSettings.market.riskFreeRate,
    ]
  );


  return (
    <div className="frontier-page">

      <InstitutionalSidebar />


      <main className="frontier-main fc-inst-standard-page">

        <header className="frontier-header">

          <div>

            <p className="frontier-eyebrow">
              MEAN-VARIANCE OPTIMISATION
            </p>

            <h1>
              Efficient Frontier
            </h1>

            <p>
              Risk-return opportunity set
              derived from the active
              institutional portfolio universe.
            </p>

          </div>


          <button
            type="button"
            className="frontier-run-button"
            onClick={runModel}
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "frontier-spin"
                  : ""
              }
            />

            {
              loading
                ? "Optimising..."
                : "Run Frontier Model"
            }

          </button>

        </header>

        <InstitutionalModelStatus
          status={cacheStatus}
          metadata={cacheMetadata}
          modelName="Efficient Frontier"
        />



        <section className="frontier-active-portfolio">

          <div>

            <span>
              ACTIVE PORTFOLIO
            </span>

            <strong>
              {
                activePortfolio.name
                || "Institutional Portfolio"
              }
            </strong>

          </div>


          <div>

            <span>
              Universe
            </span>

            <strong>
              {
                activePortfolio
                  .holdings
                  ?.length
                ?? 0
              }
              {" assets"}
            </strong>

          </div>


          <div>

            <span>
              Benchmark
            </span>

            <strong>
              {
                activePortfolio.benchmark
                || "SPY"
              }
            </strong>

          </div>


          <div>

            <span>
              Base Currency
            </span>

            <strong>
              {
                activePortfolio.baseCurrency
                || "USD"
              }
            </strong>

          </div>

        </section>


        {
          error
          && (

            <div className="frontier-error">
              {error}
            </div>

          )
        }


        {
          !result
          ? (

            <section className="frontier-empty">

              <LineChart size={38} />

              <h2>
                Awaiting frontier analysis
              </h2>

              <p>
                Run the model to estimate
                the efficient set using the
                active institutional portfolio,
                historical expected returns
                and covariance.
              </p>

            </section>

          )
          : (

            <>

              <section className="frontier-summary-grid">

                <div className="frontier-summary-card">

                  <span>
                    Current Portfolio
                  </span>

                  <strong>
                    {
                      metric(
                        getSharpe(
                          current,
                          modelSettings.market
                            .riskFreeRate
                        )
                      )
                    }
                  </strong>

                  <small>
                    Sharpe ratio
                  </small>

                </div>


                <div className="frontier-summary-card">

                  <span>
                    Maximum Sharpe
                  </span>

                  <strong>
                    {
                      metric(
                        getSharpe(
                          maximumSharpe,
                          modelSettings.market
                            .riskFreeRate
                        )
                      )
                    }
                  </strong>

                  <small>
                    Tangency portfolio
                  </small>

                </div>


                <div className="frontier-summary-card">

                  <span>
                    Minimum Variance
                  </span>

                  <strong>
                    {
                      percent(
                        getVolatility(
                          minimumVariance
                        )
                      )
                    }
                  </strong>

                  <small>
                    Lowest model volatility
                  </small>

                </div>


                <div className="frontier-summary-card">

                  <span>
                    Frontier Portfolios
                  </span>

                  <strong>
                    {
                      efficientFrontier.length
                    }
                  </strong>

                  <small>
                    Optimised points
                  </small>

                </div>

              </section>


              <section className="frontier-panel">

                <div className="frontier-panel-heading">

                  <div>

                    <h2>
                      Efficient Frontier
                    </h2>

                    <p>
                      Expected return versus
                      annualised volatility.
                    </p>

                  </div>

                  <TrendingUp size={18} />

                </div>


                {
                  chart.path
                  ? (

                    <div className="frontier-chart-wrap">

                      <svg
                        className="frontier-chart"
                        viewBox={
                          `0 0 ${
                            chart.width
                          } ${
                            chart.height
                          }`
                        }
                        role="img"
                        aria-label="Efficient frontier chart"
                      >

                        <line
                          x1={
                            chart.padLeft
                          }
                          y1={
                            chart.height
                            - chart.padBottom
                          }
                          x2={
                            chart.width
                            - chart.padRight
                          }
                          y2={
                            chart.height
                            - chart.padBottom
                          }
                          className="frontier-axis"
                        />


                        <line
                          x1={
                            chart.padLeft
                          }
                          y1={
                            chart.padTop
                          }
                          x2={
                            chart.padLeft
                          }
                          y2={
                            chart.height
                            - chart.padBottom
                          }
                          className="frontier-axis"
                        />


                        <path
                          d={
                            chart.path
                          }
                          className="frontier-curve"
                        />


                        {
                          chart.cmlPath
                          && (

                            <path
                              d={
                                chart.cmlPath
                              }
                              className="frontier-cml"
                            />

                          )
                        }


                        {
                          chart.current
                          && (

                            <circle
                              cx={
                                chart.current.x
                              }
                              cy={
                                chart.current.y
                              }
                              r="6"
                              className="frontier-marker current"
                            />

                          )
                        }


                        {
                          chart.maximumSharpe
                          && (

                            <circle
                              cx={
                                chart
                                  .maximumSharpe
                                  .x
                              }
                              cy={
                                chart
                                  .maximumSharpe
                                  .y
                              }
                              r="7"
                              className="frontier-marker sharpe"
                            />

                          )
                        }


                        {
                          chart.minimumVariance
                          && (

                            <circle
                              cx={
                                chart
                                  .minimumVariance
                                  .x
                              }
                              cy={
                                chart
                                  .minimumVariance
                                  .y
                              }
                              r="6"
                              className="frontier-marker minimum"
                            />

                          )
                        }

                      </svg>


                      <div className="frontier-chart-legend">

                        <span>
                          <i className="curve" />
                          Efficient Frontier
                        </span>

                        <span>
                          <i className="current" />
                          Current Portfolio
                        </span>

                        <span>
                          <i className="sharpe" />
                          Maximum Sharpe
                        </span>

                        <span>
                          <i className="minimum" />
                          Minimum Variance
                        </span>

                        <span>
                          <i className="cml" />
                          Capital Market Line
                        </span>

                      </div>

                    </div>

                  )
                  : (

                    <div className="frontier-no-chart">
                      Frontier points were not
                      returned by the model.
                    </div>

                  )
                }

              </section>


              <section className="frontier-two-column">

                <div className="frontier-panel">

                  <div className="frontier-panel-heading">

                    <div>

                      <h2>
                        Portfolio Comparison
                      </h2>

                      <p>
                        Current versus model-derived
                        portfolio alternatives.
                      </p>

                    </div>

                    <CircleDot size={18} />

                  </div>


                  <div className="frontier-table">

                    <div className="frontier-table-row header">

                      <span>
                        Portfolio
                      </span>

                      <span>
                        Return
                      </span>

                      <span>
                        Volatility
                      </span>

                      <span>
                        Sharpe
                      </span>

                    </div>


                    {
                      [
                        [
                          "Current",
                          current,
                        ],

                        [
                          "Maximum Sharpe",
                          maximumSharpe,
                        ],

                        [
                          "Minimum Variance",
                          minimumVariance,
                        ],
                      ].map(
                        (
                          [
                            label,
                            section,
                          ]
                        ) => (

                          <div
                            className="frontier-table-row"
                            key={label}
                          >

                            <strong>
                              {label}
                            </strong>

                            <span>
                              {
                                percent(
                                  getReturn(
                                    section
                                  )
                                )
                              }
                            </span>

                            <span>
                              {
                                percent(
                                  getVolatility(
                                    section
                                  )
                                )
                              }
                            </span>

                            <span>
                              {
                                metric(
                                  getSharpe(
                                    section
                                  )
                                )
                              }
                            </span>

                          </div>

                        )
                      )
                    }

                  </div>

                </div>


                <div className="frontier-panel">

                  <div className="frontier-panel-heading">

                    <div>

                      <h2>
                        Maximum-Sharpe Allocation
                      </h2>

                      <p>
                        Model tangency-portfolio
                        weights.
                      </p>

                    </div>

                    <TrendingUp size={18} />

                  </div>


                  <div className="frontier-allocation-list">

                    {
                      tickers.map(
                        (ticker) => {

                          const weight =
                            Number(
                              maxSharpeWeights[
                                ticker
                              ]
                              || 0
                            );


                          return (

                            <div
                              className="frontier-allocation-item"
                              key={ticker}
                            >

                              <div>

                                <strong>
                                  {ticker}
                                </strong>

                                <span>
                                  {
                                    percent(
                                      weight,
                                      1
                                    )
                                  }
                                </span>

                              </div>


                              <div className="frontier-allocation-track">

                                <div
                                  style={{
                                    width:
                                      `${Math.min(
                                        Math.max(
                                          weight * 100,
                                          0
                                        ),
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

                </div>

              </section>


              <section className="frontier-disclosure">

                <ShieldCheck size={18} />

                <div>

                  <strong>
                    Model interpretation
                  </strong>

                  <p>
                    The efficient frontier is
                    estimated from historical
                    returns and covariance.
                    Maximum-Sharpe and
                    minimum-variance portfolios
                    are research outputs rather
                    than guaranteed forecasts
                    or investment recommendations.
                  </p>

                </div>

              </section>


              <div className="frontier-methodology">

                <span>
                  Lookback:
                  {" "}
                  {
                    modelSettings.market.years
                  }
                  {" years"}
                </span>

                <span>
                  Risk-free:
                  {" "}
                  {
                    percent(
                      modelSettings.market
                        .riskFreeRate
                    )
                  }
                </span>

                <span>
                  Long only
                </span>

                <span>
                  Weight bounds:
                  {" "}
                  {
                    (
                      modelSettings.market
                        .minWeight
                      * 100
                    ).toFixed(0)
                  }
                  –
                  {
                    (
                      modelSettings.market
                        .maxWeight
                      * 100
                    ).toFixed(0)
                  }
                  %
                </span>

                <span>
                  Active universe:
                  {" "}
                  {
                    tickers.join(
                      " / "
                    )
                  }
                </span>

              </div>

            </>

          )
        }

      </main>

    </div>
  );
}


export default EfficientFrontier;
