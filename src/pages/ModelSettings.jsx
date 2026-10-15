import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  BrainCircuit,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

import InstitutionalSidebar
  from "../components/InstitutionalSidebar";

import {
  readInstitutionalModelSettings,
  resetInstitutionalModelSettings,
  saveInstitutionalModelSettings,
} from "../lib/institutionalModelSettings";

import "./ModelSettings.css";


import "../design/FinClarityInstitutionalGlobalTypeScale.css";
function percentInputValue(
  decimalValue,
) {

  const number =
    Number(
      decimalValue
    );


  if (!Number.isFinite(number)) {
    return 0;
  }


  return Number(
    (
      number
      * 100
    ).toFixed(4)
  );
}


function ModelSettings() {

  const [
    settings,
    setSettings,
  ] = useState(
    () =>
      readInstitutionalModelSettings()
  );


  const [
    message,
    setMessage,
  ] = useState("");


  function updateSection(
    section,
    field,
    value,
  ) {

    setSettings(
      (current) => ({

        ...current,

        [section]: {

          ...current[section],

          [field]:
            Number(value),
        },
      })
    );

    setMessage("");
  }


  function saveSettings() {

    saveInstitutionalModelSettings(
      settings
    );

    setMessage(
      "Institutional model settings saved."
    );
  }


  function resetSettings() {

    const defaults =
      resetInstitutionalModelSettings();

    setSettings(
      defaults
    );

    setMessage(
      "Model settings reset to FinClarity defaults."
    );
  }


  const factorTotal =
    useMemo(
      () =>
        Object.values(
          settings.factors
        ).reduce(
          (
            total,
            value,
          ) =>
            total
            + Number(
                value || 0
              ),
          0
        ),
      [settings.factors]
    );


  const factorsValid =
    Math.abs(
      factorTotal - 1
    ) < 0.0001;


  return (
    <div className="settings-page">

      <InstitutionalSidebar />


      <main className="settings-main fc-inst-standard-page">

        <header className="settings-header">

          <div>

            <p className="settings-eyebrow">
              SYSTEM CONFIGURATION
            </p>

            <h1>
              Model Settings
            </h1>

            <p>
              Configure the assumptions used
              across FinClarity's institutional
              research models.
            </p>

          </div>


          <div className="settings-header-actions">

            <button
              type="button"
              className="settings-reset-button"
              onClick={resetSettings}
            >
              <RotateCcw size={15} />
              Reset Defaults
            </button>


            <button
              type="button"
              className="settings-save-button"
              onClick={saveSettings}
            >
              <Save size={15} />
              Save Settings
            </button>

          </div>

        </header>


        {
          message
          && (

            <div className="settings-message">
              {message}
            </div>

          )
        }


        <section className="settings-panel">

          <div className="settings-panel-heading">

            <div>

              <h2>
                Portfolio Optimisation
              </h2>

              <p>
                Shared assumptions for
                mean-variance analysis.
              </p>

            </div>

            <TrendingUp size={18} />

          </div>


          <div className="settings-grid">

            <label>

              <span>
                Historical Lookback
              </span>

              <div className="settings-input-suffix">

                <input
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={
                    settings.market.years
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "market",
                        "years",
                        event.target.value,
                      )
                  }
                />

                <small>
                  years
                </small>

              </div>

            </label>


            <label>

              <span>
                Risk-Free Rate
              </span>

              <div className="settings-input-suffix">

                <input
                  type="number"
                  min="0"
                  max="25"
                  step="0.1"
                  value={
                    percentInputValue(
                      settings.market
                        .riskFreeRate
                    )
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "market",
                        "riskFreeRate",
                        Number(
                          event.target.value
                        )
                        / 100,
                      )
                  }
                />

                <small>
                  %
                </small>

              </div>

            </label>


            <label>

              <span>
                Minimum Asset Weight
              </span>

              <div className="settings-input-suffix">

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={
                    percentInputValue(
                      settings.market
                        .minWeight
                    )
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "market",
                        "minWeight",
                        Number(
                          event.target.value
                        )
                        / 100,
                      )
                  }
                />

                <small>
                  %
                </small>

              </div>

            </label>


            <label>

              <span>
                Maximum Asset Weight
              </span>

              <div className="settings-input-suffix">

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={
                    percentInputValue(
                      settings.market
                        .maxWeight
                    )
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "market",
                        "maxWeight",
                        Number(
                          event.target.value
                        )
                        / 100,
                      )
                  }
                />

                <small>
                  %
                </small>

              </div>

            </label>


            <label>

              <span>
                Efficient Frontier Points
              </span>

              <input
                type="number"
                min="10"
                max="100"
                step="5"
                value={
                  settings.market
                    .frontierPoints
                }
                onChange={
                  (event) =>
                    updateSection(
                      "market",
                      "frontierPoints",
                      event.target.value,
                    )
                }
              />

            </label>

          </div>

        </section>


        <section className="settings-two-column">

          <div className="settings-panel">

            <div className="settings-panel-heading">

              <div>

                <h2>
                  Black-Litterman
                </h2>

                <p>
                  Prior and sentiment-view
                  parameters.
                </p>

              </div>

              <SlidersHorizontal
                size={18}
              />

            </div>


            <div className="settings-grid compact">

              <label>

                <span>
                  Risk Aversion
                </span>

                <input
                  type="number"
                  step="0.1"
                  value={
                    settings.blackLitterman
                      .riskAversion
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "blackLitterman",
                        "riskAversion",
                        event.target.value,
                      )
                  }
                />

              </label>


              <label>

                <span>
                  Tau
                </span>

                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={
                    settings.blackLitterman
                      .tau
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "blackLitterman",
                        "tau",
                        event.target.value,
                      )
                  }
                />

              </label>


              <label>

                <span>
                  Sentiment View Scale
                </span>

                <input
                  type="number"
                  step="0.01"
                  value={
                    settings.blackLitterman
                      .viewScale
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "blackLitterman",
                        "viewScale",
                        event.target.value,
                      )
                  }
                />

              </label>

            </div>

          </div>


          <div className="settings-panel">

            <div className="settings-panel-heading">

              <div>

                <h2>
                  Sentiment Intelligence
                </h2>

                <p>
                  News volume and freshness
                  assumptions.
                </p>

              </div>

              <BrainCircuit size={18} />

            </div>


            <div className="settings-grid compact">

              <label>

                <span>
                  Articles per Ticker
                </span>

                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={
                    settings.sentiment
                      .articlesPerTicker
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "sentiment",
                        "articlesPerTicker",
                        event.target.value,
                      )
                  }
                />

              </label>


              <label>

                <span>
                  News Lookback
                </span>

                <div className="settings-input-suffix">

                  <input
                    type="number"
                    min="1"
                    max="336"
                    step="1"
                    value={
                      settings.sentiment
                        .lookbackHours
                    }
                    onChange={
                      (event) =>
                        updateSection(
                          "sentiment",
                          "lookbackHours",
                          event.target.value,
                        )
                    }
                  />

                  <small>
                    hours
                  </small>

                </div>

              </label>

            </div>

          </div>

        </section>


        <section className="settings-two-column">

          <div className="settings-panel">

            <div className="settings-panel-heading">

              <div>

                <h2>
                  Backtesting
                </h2>

                <p>
                  Walk-forward implementation
                  assumptions.
                </p>

              </div>

              <RefreshCw size={18} />

            </div>


            <div className="settings-grid compact">

              <label>

                <span>
                  Training Window
                </span>

                <div className="settings-input-suffix">

                  <input
                    type="number"
                    min="63"
                    step="21"
                    value={
                      settings.backtesting
                        .trainingDays
                    }
                    onChange={
                      (event) =>
                        updateSection(
                          "backtesting",
                          "trainingDays",
                          event.target.value,
                        )
                    }
                  />

                  <small>
                    days
                  </small>

                </div>

              </label>


              <label>

                <span>
                  Rebalance Frequency
                </span>

                <div className="settings-input-suffix">

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      settings.backtesting
                        .rebalanceDays
                    }
                    onChange={
                      (event) =>
                        updateSection(
                          "backtesting",
                          "rebalanceDays",
                          event.target.value,
                        )
                    }
                  />

                  <small>
                    days
                  </small>

                </div>

              </label>


              <label>

                <span>
                  Transaction Cost
                </span>

                <div className="settings-input-suffix">

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      settings.backtesting
                        .transactionCostBps
                    }
                    onChange={
                      (event) =>
                        updateSection(
                          "backtesting",
                          "transactionCostBps",
                          event.target.value,
                        )
                    }
                  />

                  <small>
                    bps
                  </small>

                </div>

              </label>

            </div>

          </div>


          <div className="settings-panel">

            <div className="settings-panel-heading">

              <div>

                <h2>
                  Factor Model
                </h2>

                <p>
                  Composite cross-sectional
                  factor weights.
                </p>

              </div>

              <Settings2 size={18} />

            </div>


            <div className="settings-factor-status">

              <span>
                Total factor weight
              </span>

              <strong
                className={
                  factorsValid
                    ? "valid"
                    : "invalid"
                }
              >
                {
                  (
                    factorTotal
                    * 100
                  ).toFixed(1)
                }
                %
              </strong>

            </div>


            <div className="settings-grid compact">

              <label>

                <span>
                  Momentum
                </span>

                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={
                    settings.factors
                      .momentum
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "factors",
                        "momentum",
                        event.target.value,
                      )
                  }
                />

              </label>


              <label>

                <span>
                  Low Volatility
                </span>

                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={
                    settings.factors
                      .lowVolatility
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "factors",
                        "lowVolatility",
                        event.target.value,
                      )
                  }
                />

              </label>


              <label>

                <span>
                  Low Idiosyncratic Risk
                </span>

                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={
                    settings.factors
                      .lowIdiosyncraticRisk
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "factors",
                        "lowIdiosyncraticRisk",
                        event.target.value,
                      )
                  }
                />

              </label>


              <label>

                <span>
                  Sentiment Alpha
                </span>

                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={
                    settings.factors
                      .sentiment
                  }
                  onChange={
                    (event) =>
                      updateSection(
                        "factors",
                        "sentiment",
                        event.target.value,
                      )
                  }
                />

              </label>

            </div>


            {
              !factorsValid
              && (

                <div className="settings-warning">

                  <AlertTriangle
                    size={15}
                  />

                  Factor weights must total
                  1.00 before they are used
                  by the factor engine.

                </div>

              )
            }

          </div>

        </section>


        <section className="settings-disclosure">

          <AlertTriangle size={17} />

          <div>

            <strong>
              Research assumptions
            </strong>

            <p>
              These values control modelling
              assumptions rather than investment
              recommendations. More restrictive
              portfolio bounds can materially
              change optimisation results, while
              longer lookback windows trade
              responsiveness for statistical
              stability.
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}


export default ModelSettings;
