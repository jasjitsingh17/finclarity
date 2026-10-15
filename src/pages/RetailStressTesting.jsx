import { API_BASE_URL } from "../lib/apiBase";
import {
  Activity,
  AlertTriangle,
  History,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  TrendingDown,
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
import "./RetailStressTesting.css";


const API = API_BASE_URL;

const CACHE_KEY =
  "finclarity_retail_stress_v2";


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
    `${number >= 0 ? "+" : ""}${
      (
        number * 100
      ).toFixed(
        digits
      )
    }%`
  );
}


function money(
  value,
  currency = "GBP",
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


  try {

    return new Intl.NumberFormat(
      "en-GB",
      {
        style:
          "currency",

        currency,

        maximumFractionDigits:
          0,
      }
    ).format(
      number
    );

  } catch {

    return (
      `${currency} ${
        number.toFixed(0)
      }`
    );

  }
}


function signedMoney(
  value,
  currency,
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


  const formatted =
    money(
      Math.abs(
        number
      ),
      currency
    );


  return (
    number >= 0
      ? `+${formatted}`
      : `-${formatted}`
  );
}


function scenarioImpactMoney(
  portfolioValue,
  returnValue,
) {

  const value =
    Number(
      portfolioValue
    );

  const shock =
    Number(
      returnValue
    );


  if (
    !Number.isFinite(
      value
    )
    || !Number.isFinite(
      shock
    )
  ) {
    return null;
  }


  return (
    value
    * shock
  );
}


function formatDate(
  date,
) {

  if (!date) {
    return "—";
  }


  const parsed =
    new Date(
      `${date}T00:00:00`
    );


  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }


  return parsed.toLocaleDateString(
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


function scenarioTone(
  value,
) {

  const number =
    Number(value);


  if (
    number <= -0.15
  ) {
    return "severe";
  }


  if (
    number <= -0.08
  ) {
    return "high";
  }


  if (
    number < 0
  ) {
    return "moderate";
  }


  return "positive";
}


function RetailStressTesting() {

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
    );  const baseCurrency =
    String(
      portfolio
        ?.baseCurrency
      ?? "GBP"
    )
      .trim()
      .toUpperCase();





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


  const initialCache =
    readCache(
      requestSignature
    );


  const [
    historical,
    setHistorical,
  ] =
    useState(
      initialCache?.result
      ?? null
    );


  const [
    historicalError,
    setHistoricalError,
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
    customShocks,
    setCustomShocks,
  ] =
    useState(
      {}
    );


  const [
    customResult,
    setCustomResult,
  ] =
    useState(
      null
    );


  const [
    customLoading,
    setCustomLoading,
  ] =
    useState(
      false
    );


  const [
    customError,
    setCustomError,
  ] =
    useState(
      null
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


  const historicalLoading =
    Boolean(
      requestSignature
      && !historical
      && !historicalError
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
              `${API}/api/stress/analyse`,
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
              ?? "Stress analysis failed."
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


          setHistorical(
            payload
          );

          setHistoricalError(
            null
          );

          setGeneratedAt(
            record.generatedAt
          );

        } catch (error) {

          if (cancelled) {
            return;
          }


          setHistoricalError(
            error?.message
            ?? "Stress analysis failed."
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


  async function runCustomScenario() {

    if (!request) {
      return;
    }


    setCustomLoading(
      true
    );

    setCustomError(
      null
    );


    try {

      const shocks =
        Object.fromEntries(
          request
            .tickers
            .map(
              (ticker) => [

                ticker,

                (
                  Number(
                    customShocks[
                      ticker
                    ]
                    ?? 0
                  )
                  / 100
                ),

              ]
            )
        );


      const response =
        await fetch(
          `${API}/api/stress/custom`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                tickers:
                  request.tickers,

                weights:
                  request.weights,

                shocks,
              }),
          }
        );


      const payload =
        await response.json();


      if (
        !response.ok
      ) {

        throw new Error(
          payload?.detail
          ?? "Custom scenario failed."
        );

      }


      setCustomResult(
        payload
      );

    } catch (error) {

      setCustomError(
        error?.message
        ?? "Custom scenario failed."
      );

    } finally {

      setCustomLoading(
        false
      );

    }
  }


  function resetCustomScenario() {

    setCustomShocks(
      {}
    );

    setCustomResult(
      null
    );

    setCustomError(
      null
    );
  }


  if (
    !requestSignature
  ) {

    return (
      <div className="retail-live-dashboard retail-stress-page">

        <RetailSidebar
          active="stress"
        />


        <main className="retail-live-main">

          <section className="retail-stress-empty">

            <TrendingDown size={34} />

            <h1>
              Scenario & Stress Testing
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


  const portfolioValue =
    Number(
      market
        ?.total_market_value
    );


  const currency =
    portfolio
      ?.baseCurrency
    ?? "GBP";


  const worstDay =
    historical
      ?.historical_scenarios
      ?.find(
        (item) =>
          item.window_days === 1
      );


  const worstWeek =
    historical
      ?.historical_scenarios
      ?.find(
        (item) =>
          item.window_days === 5
      );


  const worstMonth =
    historical
      ?.historical_scenarios
      ?.find(
        (item) =>
          item.window_days === 21
      );


  const presets =
    historical
      ?.predefined_scenarios
    ?? [];


  return (
    <div className="retail-live-dashboard retail-stress-page">

      <RetailSidebar
        active="stress"
      />


      <main className="retail-live-main">

        <div className="retail-stress-content">

          <header className="retail-stress-header">

            <div>

              <span>
                PORTFOLIO RESILIENCE
              </span>

              <h1>
                Scenario & Stress Testing
              </h1>

              <p>
                Explore how your current portfolio would behave under historical and hypothetical shocks without pretending to predict the future. Historical replay returns are translated into {baseCurrency} before downside periods are measured; hypothetical percentage shocks remain deterministic.
              </p>

            </div>


            <button
              type="button"
              onClick={
                () => {

                  setHistorical(
                    null
                  );

                  setHistoricalError(
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
              Refresh Analysis
            </button>

          </header>


          {
            historicalError
            && (

              <div className="retail-stress-error">

                <AlertTriangle size={16} />

                <span>
                  {historicalError}
                </span>

              </div>

            )
          }


          {
            historicalLoading
            ? (

              <section className="retail-stress-loading">

                <Activity size={28} />

                <strong>
                  Replaying historical stress periods…
                </strong>

                <span>
                  Applying today's portfolio weights to historical return observations.
                </span>

              </section>

            )
            : historical
            ? (

              <>

                <section className="retail-stress-summary">

                  <article>

                    <span>
                      Portfolio Value
                    </span>

                    <strong>
                      {
                        money(
                          portfolioValue,
                          currency
                        )
                      }
                    </strong>

                    <small>
                      current live FX-adjusted value
                    </small>

                  </article>


                  <article>

                    <span>
                      Worst Historical Day
                    </span>

                    <strong className="negative">
                      {
                        percent(
                          worstDay
                            ?.portfolio_return
                        )
                      }
                    </strong>

                    <small>
                      {
                        worstDay
                          ? formatDate(
                              worstDay
                                .start_date
                            )
                          : "—"
                      }
                    </small>

                  </article>


                  <article>

                    <span>
                      Worst Historical Week
                    </span>

                    <strong className="negative">
                      {
                        percent(
                          worstWeek
                            ?.portfolio_return
                        )
                      }
                    </strong>

                    <small>
                      5 trading-day replay
                    </small>

                  </article>


                  <article>

                    <span>
                      Worst Historical Month
                    </span>

                    <strong className="negative">
                      {
                        percent(
                          worstMonth
                            ?.portfolio_return
                        )
                      }
                    </strong>

                    <small>
                      21 trading-day replay
                    </small>

                  </article>

                </section>


                <section className="retail-stress-grid">

                  <article className="retail-historical-stress">

                    <header>

                      <div>

                        <History size={18} />

                        <div>

                          <h2>
                            Historical Replay
                          </h2>

                          <p>
                            The worst observed periods within the current 3-year lookback, replayed using today's weights.
                          </p>

                        </div>

                      </div>

                      <span>
                        {
                          historical
                            .observations
                        }
                        {" observations"}
                      </span>

                    </header>


                    <div className="retail-stress-scenarios">

                      {
                        historical
                          .historical_scenarios
                          .map(
                            (scenario) => {

                              const impact =
                                scenarioImpactMoney(
                                  portfolioValue,
                                  scenario
                                    .portfolio_return
                                );


                              return (

                                <div
                                  className={
                                    `retail-stress-scenario ${
                                      scenarioTone(
                                        scenario
                                          .portfolio_return
                                      )
                                    }`
                                  }
                                  key={
                                    scenario.label
                                  }
                                >

                                  <div>

                                    <span>
                                      {
                                        scenario
                                          .label
                                      }
                                    </span>

                                    <small>
                                      {
                                        formatDate(
                                          scenario
                                            .start_date
                                        )
                                      }
                                      {
                                        scenario
                                          .start_date
                                        !== scenario
                                          .end_date
                                          ? ` → ${
                                              formatDate(
                                                scenario
                                                  .end_date
                                              )
                                            }`
                                          : ""
                                      }
                                    </small>

                                  </div>


                                  <strong>
                                    {
                                      percent(
                                        scenario
                                          .portfolio_return
                                      )
                                    }
                                  </strong>


                                  <em>
                                    {
                                      impact !== null
                                        ? signedMoney(
                                            impact,
                                            currency
                                          )
                                        : "—"
                                    }
                                  </em>

                                </div>

                              );

                            }
                          )
                      }

                    </div>


                    <div className="retail-stress-note">

                      <ShieldCheck size={15} />

                      <p>
                        Historical replay does not claim that these events will repeat. It shows how today's allocation would have behaved during the worst periods actually observed in the selected dataset.
                      </p>

                    </div>

                  </article>


                  <article className="retail-stress-presets">

                    <header>

                      <TrendingDown size={18} />

                      <div>

                        <h2>
                          Preset Shock Scenarios
                        </h2>

                        <p>
                          Transparent deterministic shocks with no forecasting assumptions.
                        </p>

                      </div>

                    </header>


                    {
                      presets.map(
                        (scenario) => {

                          const impact =
                            scenario
                              ?.result
                              ?.portfolio_impact;


                          return (

                            <div
                              className="retail-preset-card"
                              key={
                                scenario.id
                              }
                            >

                              <span>
                                {
                                  scenario.name
                                }
                              </span>

                              <strong>
                                {
                                  percent(
                                    impact
                                  )
                                }
                              </strong>

                              <em>
                                {
                                  signedMoney(
                                    scenarioImpactMoney(
                                      portfolioValue,
                                      impact
                                    ),
                                    currency
                                  )
                                }
                              </em>

                              <p>
                                {
                                  scenario
                                    .description
                                }
                              </p>

                            </div>

                          );

                        }
                      )
                    }

                  </article>

                </section>


                <section className="retail-stress-grid lower">

                  <article className="retail-stress-contributors">

                    <header>

                      <div>

                        <h2>
                          Worst-Day Holding Impact
                        </h2>

                        <p>
                          Which positions contributed most to the portfolio's worst historical day.
                        </p>

                      </div>

                    </header>


                    <div className="retail-stress-contribution-list">

                      {
                        historical
                          .worst_day_holding_moves
                          .map(
                            (item) => {

                              const magnitude =
                                Math.min(
                                  100,
                                  Math.abs(
                                    Number(
                                      item
                                        .weighted_impact
                                    )
                                  )
                                  * 1000
                                );


                              return (

                                <div
                                  className="retail-stress-contribution"
                                  key={
                                    item.ticker
                                  }
                                >

                                  <div>

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


                                  <div className="retail-stress-bar">

                                    <div
                                      style={{
                                        width:
                                          `${Math.max(
                                            3,
                                            magnitude
                                          )}%`,
                                      }}
                                    />

                                  </div>


                                  <div>

                                    <strong>
                                      {
                                        percent(
                                          item.return
                                        )
                                      }
                                    </strong>

                                    <span>
                                      {
                                        percent(
                                          item
                                            .weighted_impact
                                        )
                                      }
                                      {" impact"}
                                    </span>

                                  </div>

                                </div>

                              );

                            }
                          )
                      }

                    </div>

                  </article>


                  <article className="retail-stress-context">

                    <header>

                      <ShieldCheck size={18} />

                      <div>

                        <h2>
                          How to interpret this
                        </h2>

                        <p>
                          Stress tests are resilience diagnostics, not forecasts.
                        </p>

                      </div>

                    </header>


                    <div>

                      <strong>
                        Historical stress
                      </strong>

                      <p>
                        Uses actual historical return paths but applies your current portfolio weights, so it is a counterfactual rather than a reconstruction of what you actually held at the time.
                      </p>

                    </div>


                    <div>

                      <strong>
                        Hypothetical stress
                      </strong>

                      <p>
                        Applies exactly the shocks shown on screen. FinClarity does not infer that a 10% market decline is likely or assign it a probability.
                      </p>

                    </div>


                    <div>

                      <strong>
                        Portfolio value impact
                      </strong>

                      <p>
                        Monetary losses are estimates based on the current live FX-adjusted portfolio value and the scenario percentage impact.
                      </p>

                    </div>

                  </article>

                </section>


                <section className="retail-custom-stress">

                  <header>

                    <div>

                      <SlidersHorizontal size={19} />

                      <div>

                        <span>
                          INTERACTIVE LAB
                        </span>

                        <h2>
                          Build Your Own Scenario
                        </h2>

                        <p>
                          Set a deterministic price shock for each holding and see the weighted portfolio impact.
                        </p>

                      </div>

                    </div>


                    <button
                      type="button"
                      onClick={
                        resetCustomScenario
                      }
                    >
                      Reset
                    </button>

                  </header>


                  <div className="retail-custom-stress-layout">

                    <div className="retail-custom-sliders">

                      {
                        request
                          .tickers
                          .map(
                            (
                              ticker,
                              index,
                            ) => {

                              const shock =
                                Number(
                                  customShocks[
                                    ticker
                                  ]
                                  ?? 0
                                );


                              return (

                                <div
                                  className="retail-custom-slider-row"
                                  key={
                                    ticker
                                  }
                                >

                                  <div>

                                    <strong>
                                      {ticker}
                                    </strong>

                                    <span>
                                      {
                                        percent(
                                          request
                                            .weights[
                                              index
                                            ]
                                        )
                                      }
                                      {" portfolio weight"}
                                    </span>

                                  </div>


                                  <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    step="1"
                                    value={
                                      shock
                                    }
                                    onChange={
                                      (
                                        event
                                      ) =>
                                        setCustomShocks(
                                          (
                                            current
                                          ) => ({
                                            ...current,

                                            [
                                              ticker
                                            ]:
                                              Number(
                                                event
                                                  .target
                                                  .value
                                              ),
                                          })
                                        )
                                    }
                                  />


                                  <input
                                    type="number"
                                    min="-100"
                                    max="100"
                                    step="1"
                                    value={
                                      shock
                                    }
                                    onChange={
                                      (
                                        event
                                      ) =>
                                        setCustomShocks(
                                          (
                                            current
                                          ) => ({
                                            ...current,

                                            [
                                              ticker
                                            ]:
                                              Number(
                                                event
                                                  .target
                                                  .value
                                              ),
                                          })
                                        )
                                    }
                                  />


                                  <span className={
                                    shock < 0
                                      ? "negative"
                                      : shock > 0
                                        ? "positive"
                                        : ""
                                  }>
                                    {
                                      shock >= 0
                                        ? "+"
                                        : ""
                                    }
                                    {shock}%
                                  </span>

                                </div>

                              );

                            }
                          )
                      }


                      <button
                        type="button"
                        className="retail-run-custom"
                        onClick={
                          runCustomScenario
                        }
                        disabled={
                          customLoading
                        }
                      >
                        <Activity size={16} />

                        {
                          customLoading
                            ? "Running Scenario..."
                            : "Run Custom Scenario"
                        }
                      </button>

                    </div>


                    <div className="retail-custom-result">

                      {
                        customError
                        && (

                          <div className="retail-stress-error">

                            <AlertTriangle size={15} />

                            <span>
                              {customError}
                            </span>

                          </div>

                        )
                      }


                      {
                        customResult
                        ? (

                          <>

                            <span>
                              ESTIMATED PORTFOLIO IMPACT
                            </span>

                            <strong
                              className={
                                customResult
                                  .portfolio_impact
                                < 0
                                  ? "negative"
                                  : customResult
                                      .portfolio_impact
                                    > 0
                                    ? "positive"
                                    : ""
                              }
                            >
                              {
                                percent(
                                  customResult
                                    .portfolio_impact
                                )
                              }
                            </strong>

                            <em>
                              {
                                signedMoney(
                                  scenarioImpactMoney(
                                    portfolioValue,
                                    customResult
                                      .portfolio_impact
                                  ),
                                  currency
                                )
                              }
                            </em>

                            <div>

                              {
                                customResult
                                  .holding_impacts
                                  .map(
                                    (item) => (

                                      <p
                                        key={
                                          item.ticker
                                        }
                                      >
                                        <span>
                                          {
                                            item.ticker
                                          }
                                        </span>

                                        <span>
                                          {
                                            percent(
                                              item.shock
                                            )
                                          }
                                        </span>

                                        <strong>
                                          {
                                            percent(
                                              item
                                                .weighted_impact
                                            )
                                          }
                                        </strong>
                                      </p>

                                    )
                                  )
                              }

                            </div>

                          </>

                        )
                        : (

                          <div className="retail-custom-placeholder">

                            <SlidersHorizontal size={27} />

                            <strong>
                              Set your assumptions
                            </strong>

                            <p>
                              The result will show the exact weighted impact of your chosen shocks.
                            </p>

                          </div>

                        )
                      }

                    </div>

                  </div>

                </section>


                <section className="retail-stress-methodology">

                  <ShieldCheck size={16} />

                  <div>

                    <strong>
                      Transparent scenario methodology
                    </strong>

                    <p>
                      Historical scenarios use observed daily returns with today's weights. Custom scenarios are deterministic weighted shocks. Neither methodology estimates probability or predicts future returns.
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


export default RetailStressTesting;
