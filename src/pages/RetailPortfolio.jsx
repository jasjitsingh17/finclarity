import {
  useState,
} from "react";

import {
  ArrowLeft,
  FileUp,
  Link2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  WalletCards,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  readRetailPortfolio,
  saveRetailPortfolio,
} from "../lib/retailPortfolio";

import "./RetailPortfolio.css";


const CURRENCIES = [
  "GBP",
  "USD",
  "EUR",
  "INR",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
  "HKD",
];


function blankHolding(
  currency = "GBP",
) {

  return {
    ticker: "",
    name: "",
    market: "",
    assetType: "Equity",
    quantity: 0,
    averageCost: null,
    marketValue: null,
    nativeCurrency:
      currency,
  };
}


function normaliseHeader(
  value,
) {

  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}


function parseCSVLine(
  line,
) {

  const result = [];

  let current = "";
  let quoted = false;


  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {

    const character =
      line[index];


    if (
      character === '"'
    ) {

      if (
        quoted
        && line[
          index + 1
        ] === '"'
      ) {

        current += '"';
        index += 1;

      } else {

        quoted =
          !quoted;
      }

    } else if (
      character === ","
      && !quoted
    ) {

      result.push(
        current
      );

      current = "";

    } else {

      current +=
        character;
    }
  }


  result.push(
    current
  );


  return result.map(
    (value) =>
      value.trim()
  );
}


function findColumn(
  headers,
  aliases,
) {

  return headers.findIndex(
    (header) =>
      aliases.includes(
        normaliseHeader(
          header
        )
      )
  );
}


function numberFromCSV(
  value,
) {

  const cleaned =
    String(
      value ?? ""
    )
      .replace(/,/g, "")
      .replace(/[£$€₹¥]/g, "")
      .trim();


  if (!cleaned) {
    return null;
  }


  const number =
    Number(
      cleaned
    );


  return Number.isFinite(
    number
  )
    ? number
    : null;
}


function parsePortfolioCSV(
  text,
  defaultCurrency,
) {

  const lines =
    text
      .replace(
        /\r/g,
        ""
      )
      .split("\n")
      .filter(
        (line) =>
          line.trim()
      );


  if (
    lines.length < 2
  ) {

    throw new Error(
      "The CSV must contain a header row "
      + "and at least one holding."
    );
  }


  const headers =
    parseCSVLine(
      lines[0]
    );


  const tickerIndex =
    findColumn(
      headers,
      [
        "ticker",
        "symbol",
        "security",
        "instrument",
      ],
    );


  const quantityIndex =
    findColumn(
      headers,
      [
        "quantity",
        "shares",
        "units",
        "position",
      ],
    );


  const averageCostIndex =
    findColumn(
      headers,
      [
        "averagecost",
        "avgcost",
        "averageprice",
        "avgprice",
        "costprice",
      ],
    );


  const marketValueIndex =
    findColumn(
      headers,
      [
        "marketvalue",
        "currentvalue",
        "positionvalue",
        "value",
      ],
    );


  const currencyIndex =
    findColumn(
      headers,
      [
        "currency",
        "nativecurrency",
        "ccy",
      ],
    );


  const nameIndex =
    findColumn(
      headers,
      [
        "name",
        "company",
        "securityname",
        "instrumentname",
      ],
    );


  const marketIndex =
    findColumn(
      headers,
      [
        "market",
        "exchange",
        "country",
      ],
    );


  const typeIndex =
    findColumn(
      headers,
      [
        "assettype",
        "type",
        "securitytype",
      ],
    );


  if (
    tickerIndex < 0
  ) {

    throw new Error(
      "The CSV needs a Ticker or Symbol column."
    );
  }


  if (
    quantityIndex < 0
  ) {

    throw new Error(
      "The CSV needs a Quantity, Shares "
      + "or Units column."
    );
  }


  if (
    averageCostIndex < 0
    && marketValueIndex < 0
  ) {

    throw new Error(
      "Include either Average Cost "
      + "or Market Value in the CSV."
    );
  }


  const holdings = [];


  for (
    const line
    of lines.slice(1)
  ) {

    const values =
      parseCSVLine(
        line
      );


    const ticker =
      String(
        values[
          tickerIndex
        ]
        ?? ""
      )
        .trim()
        .toUpperCase();


    if (!ticker) {
      continue;
    }


    const quantity =
      numberFromCSV(
        values[
          quantityIndex
        ]
      );


    if (
      quantity === null
      || quantity <= 0
    ) {

      throw new Error(
        `${ticker}: quantity must be greater than zero.`
      );
    }


    const averageCost =
      averageCostIndex >= 0
        ? numberFromCSV(
            values[
              averageCostIndex
            ]
          )
        : null;


    const marketValue =
      marketValueIndex >= 0
        ? numberFromCSV(
            values[
              marketValueIndex
            ]
          )
        : null;


    holdings.push(
      {
        ticker,

        name:
          nameIndex >= 0
            ? (
                values[
                  nameIndex
                ]
                ?? ""
              ).trim()
            : "",

        market:
          marketIndex >= 0
            ? (
                values[
                  marketIndex
                ]
                ?? ""
              ).trim()
            : "",

        assetType:
          typeIndex >= 0
            ? (
                values[
                  typeIndex
                ]
                ?? "Equity"
              ).trim()
            : "Equity",

        quantity,

        averageCost,

        marketValue,

        nativeCurrency:
          (
            currencyIndex >= 0
              ? (
                  values[
                    currencyIndex
                  ]
                  ?? defaultCurrency
                )
              : defaultCurrency
          )
            .trim()
            .toUpperCase(),
      }
    );
  }


  if (!holdings.length) {

    throw new Error(
      "No valid holdings were found in the CSV."
    );
  }


  return holdings;
}


function RetailPortfolio() {

  const navigate =
    useNavigate();


  const existing =
    readRetailPortfolio();


  const [
    tab,
    setTab,
  ] = useState(
    "manual"
  );


  const [
    name,
    setName,
  ] = useState(
    existing.name
    || "My Portfolio"
  );


  const [
    baseCurrency,
    setBaseCurrency,
  ] = useState(
    existing.baseCurrency
    || "GBP"
  );


  const [
    holdings,
    setHoldings,
  ] = useState(
    existing.holdings?.length
      ? existing.holdings
      : [
          blankHolding(
            existing.baseCurrency
            || "GBP"
          ),
        ]
  );


  const [
    source,
    setSource,
  ] = useState(
    existing.source
    || "manual"
  );


  const [
    error,
    setError,
  ] = useState("");


  const [
    importMessage,
    setImportMessage,
  ] = useState("");


  function updateHolding(
    index,
    field,
    value,
  ) {

    setHoldings(
      (current) =>
        current.map(
          (
            holding,
            holdingIndex,
          ) =>
            holdingIndex
              === index
              ? {
                  ...holding,
                  [field]:
                    value,
                }
              : holding
        )
    );

    setError("");
  }


  function addHolding() {

    setHoldings(
      (current) => [
        ...current,

        blankHolding(
          baseCurrency
        ),
      ]
    );
  }


  function removeHolding(
    index,
  ) {

    setHoldings(
      (current) =>
        current.filter(
          (
            _holding,
            holdingIndex,
          ) =>
            holdingIndex
              !== index
        )
    );
  }


  function savePortfolio() {

    try {

      const validHoldings =
        holdings.filter(
          (holding) =>
            String(
              holding.ticker
              || ""
            ).trim()
        );


      if (
        validHoldings.length === 0
      ) {

        throw new Error(
          "Add at least one holding before saving."
        );
      }


      for (
        const holding
        of validHoldings
      ) {

        const quantity =
          Number(
            holding.quantity
          );


        if (
          !Number.isFinite(
            quantity
          )
          || quantity <= 0
        ) {

          throw new Error(
            `${holding.ticker}: quantity must be greater than zero.`
          );
        }
      }


      saveRetailPortfolio(
        {
          name,
          baseCurrency,
          holdings:
            validHoldings,

          source,

          linkedProvider:
            existing.linkedProvider
            ?? null,
        }
      );


      navigate(
        "/retail"
      );

    } catch (
      saveError
    ) {

      setError(
        saveError.message
      );
    }
  }


  function handleCSV(
    event,
  ) {

    const file =
      event.target
        .files?.[0];


    if (!file) {
      return;
    }


    setError("");
    setImportMessage("");


    const reader =
      new FileReader();


    reader.onload =
      () => {

        try {

          const imported =
            parsePortfolioCSV(
              String(
                reader.result
                ?? ""
              ),
              baseCurrency,
            );


          setHoldings(
            imported
          );

          setSource(
            "import"
          );

          setImportMessage(
            `${imported.length} holding${
              imported.length === 1
                ? ""
                : "s"
            } imported successfully.`
          );

        } catch (
          importError
        ) {

          setError(
            importError.message
          );
        }
      };


    reader.onerror =
      () => {

        setError(
          "The CSV could not be read."
        );
      };


    reader.readAsText(
      file
    );
  }


  return (
    <div className="retail-portfolio-page">

      <aside className="retail-portfolio-sidebar">

        <Link
          to="/"
          className="retail-portfolio-logo"
        >

          <div>
            <WalletCards
              size={22}
            />
          </div>

          <span>

            <strong>
              finclarity.
            </strong>

            <small>
              PERSONAL INVESTING
            </small>

          </span>

        </Link>


        <nav>

          <Link
            to="/retail"
          >
            Dashboard
          </Link>

          <Link
            to="/retail/portfolio"
            className="active"
          >
            My Portfolio
          </Link>

        </nav>


        <div className="retail-portfolio-sidebar-bottom">

          <ShieldCheck
            size={16}
          />

          <span>
            Portfolio data is stored
            locally in this prototype.
          </span>

        </div>

      </aside>


      <main className="retail-portfolio-main">

        <header className="retail-portfolio-header">

          <div>

            <Link
              to="/retail"
              className="retail-portfolio-back"
            >
              <ArrowLeft
                size={14}
              />

              Dashboard
            </Link>


            <span className="retail-portfolio-eyebrow">
              YOUR INVESTMENTS
            </span>


            <h1>
              My Portfolio
            </h1>


            <p>
              Add your investments manually,
              import a portfolio export or
              connect a supported provider.
            </p>

          </div>


          <button
            type="button"
            className="retail-save-button"
            onClick={savePortfolio}
          >
            <Save size={16} />
            Save Portfolio
          </button>

        </header>


        <section className="retail-portfolio-details">

          <label>

            <span>
              Portfolio Name
            </span>

            <input
              value={name}
              onChange={
                (event) =>
                  setName(
                    event.target.value
                  )
              }
            />

          </label>


          <label>

            <span>
              Display Currency
            </span>

            <select
              value={
                baseCurrency
              }
              onChange={
                (event) => {

                  const nextCurrency =
                    event.target.value;

                  setBaseCurrency(
                    nextCurrency
                  );
                }
              }
            >

              {
                CURRENCIES.map(
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

          </label>


          <div className="retail-source-card">

            <span>
              Active Source
            </span>

            <strong>
              {
                source === "import"
                  ? "CSV Import"
                  : source === "linked"
                    ? "Linked Portfolio"
                    : "Manual Entry"
              }
            </strong>

          </div>

        </section>


        <div className="retail-portfolio-tabs">

          <button
            type="button"
            className={
              tab === "manual"
                ? "active"
                : ""
            }
            onClick={
              () =>
                setTab(
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
              tab === "import"
                ? "active"
                : ""
            }
            onClick={
              () =>
                setTab(
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
              tab === "link"
                ? "active"
                : ""
            }
            onClick={
              () =>
                setTab(
                  "link"
                )
            }
          >
            <Link2 size={16} />
            Link Portfolio
          </button>

        </div>


        {
          error
          && (

            <div className="retail-portfolio-error">
              {error}
            </div>

          )
        }


        {
          tab === "manual"
          && (

            <section className="retail-portfolio-panel">

              <div className="retail-panel-heading">

                <div>

                  <h2>
                    Holdings
                  </h2>

                  <p>
                    Add the investments you
                    currently hold.
                  </p>

                </div>


                <span>
                  {
                    holdings.filter(
                      (holding) =>
                        holding.ticker
                    ).length
                  }
                  {" holdings"}
                </span>

              </div>


              <div className="retail-holdings-table">

                <div className="retail-holding-row header">

                  <span>
                    Ticker
                  </span>

                  <span>
                    Name
                  </span>

                  <span>
                    Quantity
                  </span>

                  <span>
                    Avg. Cost
                  </span>

                  <span>
                    Currency
                  </span>

                  <span />

                </div>


                {
                  holdings.map(
                    (
                      holding,
                      index,
                    ) => (

                      <div
                        className="retail-holding-row"
                        key={
                          `${index}-${holding.ticker}`
                        }
                      >

                        <input
                          placeholder="AAPL"
                          value={
                            holding.ticker
                          }
                          onChange={
                            (event) =>
                              updateHolding(
                                index,
                                "ticker",
                                event.target.value
                                  .toUpperCase(),
                              )
                          }
                        />


                        <input
                          placeholder="Optional"
                          value={
                            holding.name
                          }
                          onChange={
                            (event) =>
                              updateHolding(
                                index,
                                "name",
                                event.target.value,
                              )
                          }
                        />


                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={
                            holding.quantity
                          }
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
                          min="0"
                          step="any"
                          placeholder="Optional"
                          value={
                            holding.averageCost
                            ?? ""
                          }
                          onChange={
                            (event) =>
                              updateHolding(
                                index,
                                "averageCost",
                                event.target.value,
                              )
                          }
                        />


                        <select
                          value={
                            holding.nativeCurrency
                            || baseCurrency
                          }
                          onChange={
                            (event) =>
                              updateHolding(
                                index,
                                "nativeCurrency",
                                event.target.value,
                              )
                          }
                        >

                          {
                            CURRENCIES.map(
                              (currency) => (

                                <option
                                  value={currency}
                                  key={currency}
                                >
                                  {currency}
                                </option>

                              )
                            )
                          }

                        </select>


                        <button
                          type="button"
                          className="retail-remove-holding"
                          onClick={
                            () =>
                              removeHolding(
                                index
                              )
                          }
                          aria-label="Remove holding"
                        >
                          <Trash2
                            size={15}
                          />
                        </button>

                      </div>

                    )
                  )
                }

              </div>


              <button
                type="button"
                className="retail-add-holding"
                onClick={addHolding}
              >
                <Plus size={15} />
                Add Holding
              </button>

            </section>

          )
        }


        {
          tab === "import"
          && (

            <section className="retail-portfolio-panel">

              <div className="retail-panel-heading">

                <div>

                  <h2>
                    Import Portfolio
                  </h2>

                  <p>
                    Upload a CSV exported
                    from your broker or
                    portfolio tracker.
                  </p>

                </div>

                <FileUp size={18} />

              </div>


              <label className="retail-import-dropzone">

                <UploadCloud
                  size={31}
                />

                <strong>
                  Select CSV portfolio
                </strong>

                <span>
                  Supports Ticker/Symbol,
                  Quantity/Shares, Average Cost,
                  Market Value and Currency.
                </span>


                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={
                    handleCSV
                  }
                />

              </label>


              {
                importMessage
                && (

                  <div className="retail-import-success">
                    {importMessage}
                  </div>

                )
              }


              {
                source === "import"
                && holdings.length > 0
                && (

                  <div className="retail-import-preview">

                    <strong>
                      Import Preview
                    </strong>

                    {
                      holdings
                        .slice(
                          0,
                          8
                        )
                        .map(
                          (holding) => (

                            <div
                              key={
                                holding.ticker
                              }
                            >

                              <span>
                                {
                                  holding.ticker
                                }
                              </span>

                              <span>
                                {
                                  holding.quantity
                                }
                                {" units"}
                              </span>

                              <span>
                                {
                                  holding.nativeCurrency
                                }
                              </span>

                            </div>

                          )
                        )
                    }

                  </div>

                )
              }


              <div className="retail-import-note">

                <ShieldCheck
                  size={16}
                />

                <p>
                  The import parser does not
                  silently invent missing holdings
                  or prices. Invalid rows are
                  rejected so you can correct the
                  source file.
                </p>

              </div>

            </section>

          )
        }


        {
          tab === "link"
          && (

            <section className="retail-portfolio-panel">

              <div className="retail-panel-heading">

                <div>

                  <h2>
                    Link Portfolio
                  </h2>

                  <p>
                    Connect an external portfolio
                    through secure provider
                    authentication.
                  </p>

                </div>

                <Link2 size={18} />

              </div>


              <div className="retail-link-grid">

                <article>

                  <Link2
                    size={22}
                  />

                  <h3>
                    Broker / Custodian
                  </h3>

                  <p>
                    Read-only positions and
                    balances through a supported
                    broker API.
                  </p>

                  <button
                    type="button"
                    disabled
                  >
                    Provider integration next
                  </button>

                </article>


                <article>

                  <WalletCards
                    size={22}
                  />

                  <h3>
                    Portfolio Platform
                  </h3>

                  <p>
                    Connect a supported investment
                    platform through OAuth or
                    secure API access.
                  </p>

                  <button
                    type="button"
                    disabled
                  >
                    Provider integration next
                  </button>

                </article>


                <article>

                  <UploadCloud
                    size={22}
                  />

                  <h3>
                    Scheduled Feed
                  </h3>

                  <p>
                    Periodically synchronise a
                    portfolio from an authenticated
                    data feed.
                  </p>

                  <button
                    type="button"
                    disabled
                  >
                    Provider integration next
                  </button>

                </article>

              </div>


              <div className="retail-link-security">

                <ShieldCheck
                  size={17}
                />

                <div>

                  <strong>
                    Secure connection design
                  </strong>

                  <p>
                    FinClarity will never ask a
                    user to type brokerage
                    passwords directly into this
                    page. Genuine account linking
                    will use provider authentication
                    and server-side tokens.
                  </p>

                </div>

              </div>

            </section>

          )
        }


        <div className="retail-portfolio-footer">

          <span>
            Active portfolio:
            {" "}
            <strong>
              {name}
            </strong>
          </span>

          <span>
            Holdings:
            {" "}
            {
              holdings.filter(
                (holding) =>
                  holding.ticker
              ).length
            }
          </span>

          <span>
            Base currency:
            {" "}
            {baseCurrency}
          </span>

        </div>

      </main>

    </div>
  );
}


export default
RetailPortfolio;
