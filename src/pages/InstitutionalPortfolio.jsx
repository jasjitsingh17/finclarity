import { API_BASE_URL } from "../lib/apiBase";
import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  WalletCards,
} from "lucide-react";

import InstitutionalSidebar
  from "../components/InstitutionalSidebar";

import {
  readInstitutionalPortfolio,
  saveInstitutionalPortfolio,
} from "../lib/institutionalPortfolio";

import "./InstitutionalPortfolio.css";


import "../design/FinClarityInstitutionalGlobalTypeScale.css";



const currencies = [
  "USD",
  "GBP",
  "EUR",
  "INR",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
];


function numberValue(
  value,
) {

  if (
    value === ""
    || value === null
    || value === undefined
  ) {

    return null;
  }


  const cleaned =
    String(value)
      .replace(
        /[^0-9.-]/g,
        ""
      );


  const result =
    Number(cleaned);


  return Number.isFinite(result)
    ? result
    : null;
}


function parseCsvLine(
  line,
) {

  const values = [];

  let current = "";
  let quoted = false;


  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {

    const character =
      line[index];

    const next =
      line[index + 1];


    if (
      character === '"'
      && quoted
      && next === '"'
    ) {

      current += '"';

      index += 1;

      continue;
    }


    if (
      character === '"'
    ) {

      quoted = !quoted;

      continue;
    }


    if (
      character === ","
      && !quoted
    ) {

      values.push(
        current.trim()
      );

      current = "";

      continue;
    }


    current += character;
  }


  values.push(
    current.trim()
  );


  return values;
}


function cleanHeader(
  value,
) {

  return String(value)
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
}


function findColumn(
  headers,
  aliases,
) {

  return headers.findIndex(
    (header) =>
      aliases.includes(
        header
      )
  );
}


function parsePortfolioCsv(
  text,
  fallbackCurrency,
) {

  const lines =
    text
      .split(/\r?\n/)
      .filter(
        (line) =>
          line.trim()
      );


  if (
    lines.length < 2
  ) {

    throw new Error(
      "CSV requires a header and at least one holding."
    );
  }


  const headers =
    parseCsvLine(
      lines[0]
    ).map(
      cleanHeader
    );


  const tickerIndex =
    findColumn(
      headers,
      [
        "ticker",
        "symbol",
        "security",
        "instrument",
      ]
    );


  const weightIndex =
    findColumn(
      headers,
      [
        "weight",
        "portfolio_weight",
        "weight_pct",
        "weight_percent",
        "allocation",
        "allocation_percent",
      ]
    );


  const quantityIndex =
    findColumn(
      headers,
      [
        "quantity",
        "qty",
        "shares",
        "units",
      ]
    );


  const valueIndex =
    findColumn(
      headers,
      [
        "market_value",
        "marketvalue",
        "position_value",
        "value",
      ]
    );


  const currencyIndex =
    findColumn(
      headers,
      [
        "currency",
        "ccy",
      ]
    );


  if (
    tickerIndex < 0
  ) {

    throw new Error(
      "CSV needs a Ticker or Symbol column."
    );
  }


  const holdings =
    lines
      .slice(1)
      .map(
        parseCsvLine
      )
      .map(
        (row) => {

          const ticker =
            String(
              row[tickerIndex]
              || ""
            )
              .trim()
              .toUpperCase();


          if (!ticker) {
            return null;
          }


          return {

            ticker,

            weight:
              weightIndex >= 0
                ? numberValue(
                    row[
                      weightIndex
                    ]
                  )
                : null,

            quantity:
              quantityIndex >= 0
                ? (
                    numberValue(
                      row[
                        quantityIndex
                      ]
                    )
                    ?? ""
                  )
                : "",

            marketValue:
              valueIndex >= 0
                ? (
                    numberValue(
                      row[
                        valueIndex
                      ]
                    )
                    ?? ""
                  )
                : "",

            currency:
              String(
                currencyIndex >= 0
                  ? (
                      row[
                        currencyIndex
                      ]
                      || fallbackCurrency
                    )
                  : fallbackCurrency
              )
                .trim()
                .toUpperCase(),
          };
        }
      )
      .filter(Boolean);


  if (
    holdings.length < 2
  ) {

    throw new Error(
      "At least two valid holdings are required."
    );
  }


  const uniqueTickers =
    new Set(
      holdings.map(
        (holding) =>
          holding.ticker
      )
    );


  if (
    uniqueTickers.size
    !== holdings.length
  ) {

    throw new Error(
      "Duplicate tickers were found in the CSV."
    );
  }


  const weightsAvailable =
    holdings.every(
      (holding) =>
        Number.isFinite(
          holding.weight
        )
    );


  if (!weightsAvailable) {

    const values =
      holdings.map(
        (holding) =>
          numberValue(
            holding.marketValue
          )
      );


    const usableValues =
      values.every(
        (value) =>
          Number.isFinite(value)
          && value >= 0
      );


    const totalValue =
      values.reduce(
        (
          total,
          value,
        ) =>
          total
          + (
              value || 0
            ),
        0
      );


    if (
      !usableValues
      || totalValue <= 0
    ) {

      throw new Error(
        "CSV requires either portfolio weights or usable market values."
      );
    }


    holdings.forEach(
      (
        holding,
        index,
      ) => {

        holding.weight =
          (
            values[index]
            / totalValue
          )
          * 100;
      }
    );

  } else {

    const maximumWeight =
      Math.max(
        ...holdings.map(
          (holding) =>
            Math.abs(
              holding.weight
            )
        )
      );


    if (
      maximumWeight <= 1.0001
    ) {

      holdings.forEach(
        (holding) => {

          holding.weight *= 100;
        }
      );
    }
  }


  const totalWeight =
    holdings.reduce(
      (
        total,
        holding,
      ) =>
        total
        + Number(
            holding.weight
            || 0
          ),
      0
    );


  if (
    totalWeight <= 0
  ) {

    throw new Error(
      "Imported portfolio weights are invalid."
    );
  }


  return holdings.map(
    (holding) => ({

      ...holding,

      weight:
        Number(
          (
            (
              Number(
                holding.weight
              )
              / totalWeight
            )
            * 100
          ).toFixed(4)
        ),
    })
  );
}


function InstitutionalPortfolio() {

  const fileInputRef =
    useRef(null);


  const [
    activeTab,
    setActiveTab,
  ] = useState(
    () => {

      const requested =
        new URLSearchParams(
          window.location.search
        ).get("tab");


      return [
        "manual",
        "import",
        "link",
      ].includes(
        requested
      )
        ? requested
        : "manual";
    }
  );


  const [
    portfolio,
    setPortfolio,
  ] = useState(
    () =>
      readInstitutionalPortfolio()
  );


  const [
    result,
    setResult,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    message,
    setMessage,
  ] = useState("");



  const holdings =
    portfolio.holdings;


  const totalWeight =
    useMemo(
      () =>
        holdings.reduce(
          (
            total,
            holding,
          ) =>
            total
            + Number(
                holding.weight
                || 0
              ),
          0
        ),
      [holdings]
    );


  const weightsValid =
    Math.abs(
      totalWeight - 100
    ) < 0.02;


  function updatePortfolio(
    field,
    value,
  ) {

    setPortfolio(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setMessage("");
  }


  function updateHolding(
    index,
    field,
    value,
  ) {

    setPortfolio(
      (current) => ({

        ...current,

        source: "manual",

        provider: null,

        holdings:
          current.holdings.map(
            (
              holding,
              holdingIndex,
            ) => {

              if (
                holdingIndex
                !== index
              ) {

                return holding;
              }


              return {

                ...holding,

                [field]:
                  field === "ticker"
                    ? value
                        .toUpperCase()
                        .replace(
                          /[^A-Z0-9.-]/g,
                          ""
                        )
                    : value,
              };
            }
          ),
      })
    );
  }


  function addHolding() {

    setPortfolio(
      (current) => ({

        ...current,

        source: "manual",

        holdings: [
          ...current.holdings,

          {
            ticker: "",
            weight: 0,
            quantity: "",
            marketValue: "",
            currency:
              current.baseCurrency,
          },
        ],
      })
    );
  }


  function removeHolding(
    index,
  ) {

    if (
      holdings.length <= 2
    ) {
      return;
    }


    setPortfolio(
      (current) => ({

        ...current,

        source: "manual",

        holdings:
          current.holdings.filter(
            (
              _holding,
              holdingIndex,
            ) =>
              holdingIndex
              !== index
          ),
      })
    );
  }


  function normaliseWeights() {

    const total =
      holdings.reduce(
        (
          sum,
          holding,
        ) =>
          sum
          + Number(
              holding.weight
              || 0
            ),
        0
      );


    if (
      total <= 0
    ) {

      setError(
        "Weights must sum to more than zero."
      );

      return;
    }


    setPortfolio(
      (current) => ({

        ...current,

        holdings:
          current.holdings.map(
            (holding) => ({

              ...holding,

              weight:
                Number(
                  (
                    (
                      Number(
                        holding.weight
                        || 0
                      )
                      / total
                    )
                    * 100
                  ).toFixed(4)
                ),
            })
          ),
      })
    );


    setError("");
  }


  function validatePortfolio() {

    if (
      holdings.length < 2
    ) {

      throw new Error(
        "At least two holdings are required."
      );
    }


    const tickers =
      holdings.map(
        (holding) =>
          holding.ticker
            .trim()
            .toUpperCase()
      );


    if (
      tickers.some(
        (ticker) =>
          !ticker
      )
    ) {

      throw new Error(
        "Every holding requires a ticker."
      );
    }


    if (
      new Set(
        tickers
      ).size
      !== tickers.length
    ) {

      throw new Error(
        "Duplicate tickers are not allowed."
      );
    }


    if (
      !weightsValid
    ) {

      throw new Error(
        "Portfolio weights must total 100%."
      );
    }


    return tickers;
  }


  function savePortfolio() {

    try {

      validatePortfolio();


      const saved =
        saveInstitutionalPortfolio(
          portfolio
        );


      setPortfolio(
        saved
      );


      setError("");

      setMessage(
        "Institutional portfolio saved and set as the active portfolio."
      );

    } catch (
      validationError
    ) {

      setError(
        validationError.message
      );
    }
  }


  async function runPortfolioModel() {

    setError("");
    setMessage("");


    let tickers;


    try {

      tickers =
        validatePortfolio();

    } catch (
      validationError
    ) {

      setError(
        validationError.message
      );

      return;
    }


    setLoading(true);


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

            body: JSON.stringify({

              tickers,

              current_weights:
                holdings.map(
                  (holding) =>
                    Number(
                      holding.weight
                    )
                    / 100
                ),

              years: 3,

              risk_free_rate:
                0.04,

              min_weight:
                0,

              max_weight:
                1,

              frontier_points:
                20,
            }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok
      ) {

        throw new Error(
          data.detail
          || "Portfolio analysis failed."
        );
      }


      setResult(
        data
      );


      const saved =
        saveInstitutionalPortfolio(
          portfolio
        );


      setPortfolio(
        saved
      );


      setMessage(
        "Portfolio analysed and set as the active institutional portfolio."
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


  async function importCsv(
    file,
  ) {

    if (!file) {
      return;
    }


    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {

      setError(
        "CSV import is enabled now. Excel .xlsx support will be added next."
      );

      return;
    }


    try {

      const text =
        await file.text();


      const importedHoldings =
        parsePortfolioCsv(
          text,
          portfolio.baseCurrency,
        );


      setPortfolio(
        (current) => ({

          ...current,

          source: "csv",

          provider: null,

          lastSynced: null,

          holdings:
            importedHoldings,
        })
      );


      setResult(null);

      setError("");

      setMessage(
        `${importedHoldings.length} holdings imported from ${file.name}. Review them and click Save.`
      );


      setActiveTab(
        "manual"
      );

    } catch (
      importError
    ) {

      setError(
        importError.message
      );
    }


    if (
      fileInputRef.current
    ) {

      fileInputRef.current.value =
        "";
    }
  }


  const currentPortfolio =
    result?.current_portfolio
    ?? result?.current
    ?? {};


  return (
    <div className="institutional-portfolio-page">

      <InstitutionalSidebar />


      <main className="institutional-portfolio-main fc-institutional-page fc-institutional-portfolio fc-inst-standard-page">

        <header className="institutional-portfolio-header">

          <div>

            <p className="institutional-portfolio-eyebrow">
              PORTFOLIO CONSTRUCTION
            </p>

            <h1>
              Institutional Portfolio
            </h1>

            <p>
              Define, import or connect the
              portfolio used throughout
              FinClarity's institutional
              research platform.
            </p>

          </div>


          <div className="institutional-portfolio-actions">

            <button
              type="button"
              className="portfolio-save-button"
              onClick={savePortfolio}
            >
              <Save size={16} />
              Save Portfolio
            </button>


            <button
              type="button"
              className="portfolio-run-button"
              onClick={
                runPortfolioModel
              }
              disabled={loading}
            >

              <RefreshCw
                size={16}
                className={
                  loading
                    ? "portfolio-spin"
                    : ""
                }
              />

              {
                loading
                  ? "Analysing..."
                  : "Run Portfolio Model"
              }

            </button>

          </div>

        </header>


        {
          error
          && (

            <div className="portfolio-message error">

              <AlertTriangle size={16} />

              {error}

            </div>

          )
        }


        {
          message
          && (

            <div className="portfolio-message success">

              <CheckCircle2 size={16} />

              {message}

            </div>

          )
        }


        <section className="portfolio-meta-panel">

          <div>

            <label>
              Portfolio Name
            </label>

            <input
              value={
                portfolio.name
              }
              onChange={
                (event) =>
                  updatePortfolio(
                    "name",
                    event.target.value,
                  )
              }
            />

          </div>


          <div>

            <label>
              Benchmark
            </label>

            <input
              value={
                portfolio.benchmark
              }
              onChange={
                (event) =>
                  updatePortfolio(
                    "benchmark",
                    event.target.value
                      .toUpperCase(),
                  )
              }
            />

          </div>


          <div>

            <label>
              Base Currency
            </label>

            <select
              value={
                portfolio.baseCurrency
              }
              onChange={
                (event) =>
                  updatePortfolio(
                    "baseCurrency",
                    event.target.value,
                  )
              }
            >

              {
                currencies.map(
                  (currency) => (

                    <option
                      key={currency}
                      value={currency}
                    >
                      {currency}
                    </option>

                  )
                )
              }

            </select>

          </div>


          <div>

            <label>
              Source
            </label>

            <strong className="portfolio-source-badge">
              {
                portfolio.source
                  .toUpperCase()
              }
            </strong>

          </div>

        </section>


        <div className="portfolio-tabs">

          <button
            type="button"
            className={
              activeTab === "manual"
                ? "active"
                : ""
            }
            onClick={
              () =>
                setActiveTab(
                  "manual"
                )
            }
          >
            <WalletCards size={16} />
            Manual Entry
          </button>


          <button
            type="button"
            className={
              activeTab === "import"
                ? "active"
                : ""
            }
            onClick={
              () =>
                setActiveTab(
                  "import"
                )
            }
          >
            <FileUp size={16} />
            Import Portfolio
          </button>


          <button
            type="button"
            className={
              activeTab === "link"
                ? "active"
                : ""
            }
            onClick={
              () =>
                setActiveTab(
                  "link"
                )
            }
          >
            <Link2 size={16} />
            Link Portfolio
          </button>

        </div>


        {
          activeTab === "manual"
          && (

            <section className="portfolio-panel">

              <div className="portfolio-panel-heading">

                <div>

                  <h2>
                    Holdings
                  </h2>

                  <p>
                    Define the active
                    institutional portfolio.
                  </p>

                </div>


                <div
                  className={
                    `portfolio-total ${
                      weightsValid
                        ? "valid"
                        : "invalid"
                    }`
                  }
                >
                  {
                    totalWeight
                      .toFixed(2)
                  }
                  %
                </div>

              </div>


              <div className="portfolio-holdings">

                <div className="portfolio-holding-row header">

                  <span>Ticker</span>
                  <span>Weight</span>
                  <span>Quantity</span>
                  <span>Market Value</span>
                  <span>Currency</span>
                  <span />

                </div>


                {
                  holdings.map(
                    (
                      holding,
                      index,
                    ) => (

                      <div
                        className="portfolio-holding-row"
                        key={`${index}-${holding.ticker}`}
                      >

                        <input
                          value={
                            holding.ticker
                          }
                          onChange={
                            (event) =>
                              updateHolding(
                                index,
                                "ticker",
                                event.target.value,
                              )
                          }
                        />


                        <div className="portfolio-weight-field">

                          <input
                            type="number"
                            value={
                              holding.weight
                            }
                            onChange={
                              (event) =>
                                updateHolding(
                                  index,
                                  "weight",
                                  event.target.value,
                                )
                            }
                          />

                          <span>
                            %
                          </span>

                        </div>


                        <input
                          type="number"
                          value={
                            holding.quantity
                          }
                          placeholder="Optional"
                          onChange={
                            (event) =>
                              updateHolding(
                                index,
                                "quantity",
                                event.target.value,
                              )
                          }
                        />


                        <input
                          type="number"
                          value={
                            holding.marketValue
                          }
                          placeholder="Optional"
                          onChange={
                            (event) =>
                              updateHolding(
                                index,
                                "marketValue",
                                event.target.value,
                              )
                          }
                        />


                        <select
                          value={
                            holding.currency
                            || portfolio.baseCurrency
                          }
                          onChange={
                            (event) =>
                              updateHolding(
                                index,
                                "currency",
                                event.target.value,
                              )
                          }
                        >

                          {
                            currencies.map(
                              (currency) => (

                                <option
                                  key={currency}
                                  value={currency}
                                >
                                  {currency}
                                </option>

                              )
                            )
                          }

                        </select>


                        <button
                          type="button"
                          className="portfolio-remove-button"
                          disabled={
                            holdings.length <= 2
                          }
                          onClick={
                            () =>
                              removeHolding(
                                index
                              )
                          }
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>

                    )
                  )
                }

              </div>


              <div className="portfolio-editor-footer">

                <button
                  type="button"
                  onClick={addHolding}
                >
                  <Plus size={15} />
                  Add Holding
                </button>


                <button
                  type="button"
                  onClick={
                    normaliseWeights
                  }
                >
                  Normalise to 100%
                </button>

              </div>

            </section>

          )
        }


        {
          activeTab === "import"
          && (

            <section className="portfolio-panel">

              <div className="portfolio-panel-heading">

                <div>

                  <h2>
                    Import Portfolio
                  </h2>

                  <p>
                    Import holdings from
                    institutional portfolio
                    exports.
                  </p>

                </div>

                <FileUp size={19} />

              </div>


              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={
                  (event) =>
                    importCsv(
                      event.target
                        .files?.[0]
                    )
                }
              />


              <button
                type="button"
                className="portfolio-upload-zone"
                onClick={
                  () =>
                    fileInputRef.current
                      ?.click()
                }
              >

                <FileUp size={30} />

                <strong>
                  Select CSV portfolio
                </strong>

                <span>
                  Supports Ticker/Symbol,
                  Weight/Allocation,
                  Quantity/Shares,
                  Market Value and Currency.
                </span>

              </button>


              <div className="portfolio-import-info">

                <strong>
                  Intelligent import
                </strong>

                <span>
                  If weights are unavailable
                  but market values exist,
                  FinClarity derives weights
                  automatically.
                </span>

                <span>
                  Duplicate tickers and invalid
                  portfolios are rejected rather
                  than silently guessed.
                </span>

                <span>
                  Excel .xlsx support will be
                  added after CSV validation.
                </span>

              </div>

            </section>

          )
        }


        {
          activeTab === "link"
          && (

            <section className="portfolio-panel">

              <div className="portfolio-panel-heading">

                <div>

                  <h2>
                    Link Portfolio
                  </h2>

                  <p>
                    Connect external portfolio
                    systems to the shared
                    FinClarity portfolio layer.
                  </p>

                </div>

                <Link2 size={19} />

              </div>


              <div className="portfolio-provider-grid">

                <div className="portfolio-provider-card">

                  <Link2 size={21} />

                  <strong>
                    Broker / Custodian
                  </strong>

                  <p>
                    Secure OAuth/API
                    connection for positions
                    and balances.
                  </p>

                  <button
                    type="button"
                    disabled
                  >
                    Connection setup next
                  </button>

                </div>


                <div className="portfolio-provider-card">

                  <WalletCards size={21} />

                  <strong>
                    PMS / OMS
                  </strong>

                  <p>
                    Portfolio-management
                    and order-management
                    system integration.
                  </p>

                  <button
                    type="button"
                    disabled
                  >
                    Connection setup next
                  </button>

                </div>


                <div className="portfolio-provider-card">

                  <RefreshCw size={21} />

                  <strong>
                    Scheduled Feed
                  </strong>

                  <p>
                    Periodic authenticated
                    portfolio synchronisation.
                  </p>

                  <button
                    type="button"
                    disabled
                  >
                    Connection setup next
                  </button>

                </div>

              </div>


              <div className="portfolio-security-note">

                <AlertTriangle size={17} />

                <p>
                  FinClarity will not ask users
                  to enter brokerage passwords
                  into the browser. Genuine
                  portfolio linking will use
                  provider authentication and
                  secure server-side tokens.
                </p>

              </div>

            </section>

          )
        }


        <section className="portfolio-status-strip">

          <span>
            Active source:
            {" "}
            <strong>
              {portfolio.source}
            </strong>
          </span>

          <span>
            Holdings:
            {" "}
            <strong>
              {holdings.length}
            </strong>
          </span>

          <span>
            Benchmark:
            {" "}
            <strong>
              {portfolio.benchmark}
            </strong>
          </span>

          <span>
            Base currency:
            {" "}
            <strong>
              {portfolio.baseCurrency}
            </strong>
          </span>

        </section>


        {
          result
          && (

            <section className="portfolio-results">

              <div>

                <span>
                  Expected Return
                </span>

                <strong>
                  {
                    currentPortfolio
                      .expected_return
                      !== undefined
                      ? `${(
                          currentPortfolio
                            .expected_return
                          * 100
                        ).toFixed(2)}%`
                      : "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Volatility
                </span>

                <strong>
                  {
                    currentPortfolio
                      .volatility
                      !== undefined
                      ? `${(
                          currentPortfolio
                            .volatility
                          * 100
                        ).toFixed(2)}%`
                      : "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Sharpe Ratio
                </span>

                <strong>
                  {
                    currentPortfolio
                      .sharpe_ratio
                      !== undefined
                      ? Number(
                          currentPortfolio
                            .sharpe_ratio
                        ).toFixed(2)
                      : "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Model Status
                </span>

                <strong>
                  Analysed
                </strong>

              </div>

            </section>

          )
        }

      </main>

    </div>
  );
}


export default InstitutionalPortfolio;
