import {
  ArrowRight,
  FileSpreadsheet,
  Link2,
  Plus,
  Save,
  Trash2,
  Upload,
  WalletCards,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import RetailSidebar
  from "../components/RetailSidebar";

import "./RetailDashboardLive.css";
import "./RetailPortfolioManager.css";


const HOLDINGS_KEY =
  "finclarity_holdings";

const PREFERENCES_KEY =
  "finclarity_preferences";

const META_KEY =
  "finclarity_retail_portfolio_meta";


function makeId() {

  if (
    typeof crypto !== "undefined"
    && crypto.randomUUID
  ) {

    return crypto.randomUUID();
  }


  return (
    `${Date.now()}-${Math.random()}`
  );
}


function readJson(
  key,
  fallback,
) {

  try {

    const value =
      localStorage.getItem(
        key
      );


    return value
      ? JSON.parse(value)
      : fallback;

  } catch {

    return fallback;
  }
}


function inferCurrency(
  ticker,
) {

  const value =
    String(
      ticker
      ?? ""
    )
      .trim()
      .toUpperCase();


  if (
    value.endsWith(".L")
  ) {
    return "GBP";
  }


  if (
    value.endsWith(".NS")
    || value.endsWith(".BO")
  ) {
    return "INR";
  }


  if (
    value.endsWith(".DE")
    || value.endsWith(".PA")
  ) {
    return "EUR";
  }


  if (
    value.endsWith(".T")
  ) {
    return "JPY";
  }


  if (
    value.endsWith(".HK")
  ) {
    return "HKD";
  }


  return "USD";
}


function inferMarket(
  ticker,
) {

  const value =
    String(
      ticker
      ?? ""
    )
      .trim()
      .toUpperCase();


  if (value.endsWith(".L")) {
    return "UK";
  }

  if (
    value.endsWith(".NS")
    || value.endsWith(".BO")
  ) {
    return "India";
  }

  if (value.endsWith(".DE")) {
    return "Germany";
  }

  if (value.endsWith(".PA")) {
    return "France";
  }

  if (value.endsWith(".T")) {
    return "Japan";
  }

  if (value.endsWith(".HK")) {
    return "Hong Kong";
  }


  return "US";
}


function cleanHolding(
  item,
) {

  const ticker =
    String(
      item.ticker
      ?? item.symbol
      ?? ""
    )
      .trim()
      .toUpperCase();


  return {
    id:
      item.id
      ?? makeId(),

    ticker,

    name:
      String(
        item.name
        ?? item.company
        ?? ticker
      ).trim(),

    quantity:
      Number(
        item.quantity
        ?? item.shares
        ?? item.units
        ?? 0
      ),

    averageCost:
      Number(
        item.averageCost
        ?? item.avgCost
        ?? item.average_cost
        ?? item.cost
        ?? 0
      ),

    currency:
      String(
        item.currency
        ?? inferCurrency(
          ticker
        )
      )
        .trim()
        .toUpperCase(),

    market:
      item.market
      ?? inferMarket(
        ticker
      ),

    assetType:
      item.assetType
      ?? "Equity",
  };
}


function normaliseHeader(
  value,
) {

  return String(
    value
    ?? ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );
}


function parseCsv(
  text,
) {

  const lines =
    String(text)
      .split(
        /\r?\n/
      )
      .map(
        (line) =>
          line.trim()
      )
      .filter(Boolean);


  if (
    lines.length < 2
  ) {

    throw new Error(
      "The CSV does not contain any holdings."
    );
  }


  const splitLine =
    (line) =>
      line
        .split(",")
        .map(
          (cell) =>
            cell
              .trim()
              .replace(
                /^"(.*)"$/,
                "$1"
              )
        );


  const headers =
    splitLine(
      lines[0]
    )
      .map(
        normaliseHeader
      );


  const indexOf =
    (...names) =>
      headers.findIndex(
        (header) =>
          names.includes(
            header
          )
      );


  const tickerIndex =
    indexOf(
      "ticker",
      "symbol",
      "security",
    );


  if (
    tickerIndex < 0
  ) {

    throw new Error(
      "CSV must contain a Ticker or Symbol column."
    );
  }


  const nameIndex =
    indexOf(
      "name",
      "company",
      "securityname",
    );

  const quantityIndex =
    indexOf(
      "quantity",
      "shares",
      "units",
    );

  const costIndex =
    indexOf(
      "avgcost",
      "averagecost",
      "averageprice",
      "cost",
      "costbasis",
    );

  const currencyIndex =
    indexOf(
      "currency",
      "ccy",
    );


  return lines
    .slice(1)
    .map(
      (line) => {

        const cells =
          splitLine(
            line
          );


        const ticker =
          cells[
            tickerIndex
          ]
          ?? "";


        return cleanHolding({
          ticker,

          name:
            nameIndex >= 0
              ? cells[
                  nameIndex
                ]
              : ticker,

          quantity:
            quantityIndex >= 0
              ? cells[
                  quantityIndex
                ]
              : 0,

          averageCost:
            costIndex >= 0
              ? cells[
                  costIndex
                ]
              : 0,

          currency:
            currencyIndex >= 0
              ? cells[
                  currencyIndex
                ]
              : inferCurrency(
                  ticker
                ),
        });
      }
    )
    .filter(
      (holding) =>
        holding.ticker
    );
}


function RetailPortfolioManager() {

  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();


  const existingHoldings =
    useMemo(
      () => {

        const value =
          readJson(
            HOLDINGS_KEY,
            []
          );


        return Array.isArray(
          value
        )
          ? value.map(
              cleanHolding
            )
          : [];
      },
      []
    );


  const existingPreferences =
    useMemo(
      () =>
        readJson(
          PREFERENCES_KEY,
          {}
        ),
      []
    );


  const existingMeta =
    useMemo(
      () =>
        readJson(
          META_KEY,
          {}
        ),
      []
    );


  const onboarding =
    searchParams.get(
      "onboarding"
    ) === "1"
    || existingHoldings.length === 0;


  const [
    mode,
    setMode,
  ] =
    useState(
      onboarding
        ? "choose"
        : "manual"
    );


  const [
    holdings,
    setHoldings,
  ] =
    useState(
      existingHoldings
    );


  const [
    portfolioName,
    setPortfolioName,
  ] =
    useState(
      existingMeta.name
      ?? "My Portfolio"
    );


  const [
    displayCurrency,
    setDisplayCurrency,
  ] =
    useState(
      existingPreferences
        .displayCurrency
      ?? existingPreferences
        .currency
      ?? "GBP"
    );


  const [
    source,
    setSource,
  ] =
    useState(
      existingMeta.source
      ?? (
        existingHoldings.length
          ? "manual"
          : null
      )
    );


  const [
    message,
    setMessage,
  ] =
    useState(
      ""
    );


  const updateHolding =
    (
      id,
      field,
      value,
    ) => {

      setHoldings(
        (current) =>
          current.map(
            (holding) =>
              holding.id === id
                ? {
                    ...holding,
                    [field]:
                      field === "quantity"
                      || field === "averageCost"
                        ? Number(value)
                        : value,
                  }
                : holding
          )
      );
    };


  const addHolding =
    () => {

      setHoldings(
        (current) => [
          ...current,
          cleanHolding({
            id:
              makeId(),
            ticker: "",
            name: "",
            quantity: 0,
            averageCost: 0,
            currency: "USD",
          }),
        ]
      );
    };


  const removeHolding =
    (id) => {

      setHoldings(
        (current) =>
          current.filter(
            (holding) =>
              holding.id !== id
          )
      );
    };


  const savePortfolio =
    () => {

      const valid =
        holdings
          .map(
            cleanHolding
          )
          .filter(
            (holding) =>
              holding.ticker
              && Number.isFinite(
                holding.quantity
              )
              && holding.quantity > 0
          );


      if (
        !valid.length
      ) {

        setMessage(
          "Add at least one holding with a ticker and quantity above zero."
        );

        return;
      }


      localStorage.setItem(
        HOLDINGS_KEY,
        JSON.stringify(
          valid
        )
      );


      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({
          ...existingPreferences,
          displayCurrency,
          currency:
            displayCurrency,
        })
      );


      localStorage.setItem(
        META_KEY,
        JSON.stringify({
          name:
            portfolioName.trim()
            || "My Portfolio",

          source:
            source
            ?? "manual",

          updatedAt:
            new Date()
              .toISOString(),
        })
      );


      setMessage(
        ""
      );


      navigate(
        "/retail"
      );
    };


  const handleCsv =
    async (
      event,
    ) => {

      const file =
        event
          .target
          .files?.[0];


      if (!file) {
        return;
      }


      try {

        const text =
          await file.text();


        const parsed =
          parseCsv(
            text
          );


        if (
          !parsed.length
        ) {

          throw new Error(
            "No valid holdings were found."
          );
        }


        setHoldings(
          parsed
        );

        setSource(
          "csv"
        );

        setMode(
          "manual"
        );

        setMessage(
          `${parsed.length} holdings imported. Review them, then save the portfolio.`
        );

      } catch (
        error
      ) {

        setMessage(
          error.message
          ?? "Could not import this CSV."
        );
      }
    };


  return (
    <div className="retail-live-dashboard retail-portfolio-manager">

      <RetailSidebar
        active="portfolio"
      />


      <main className="retail-live-main">

        <div className="retail-portfolio-content">

          <header className="retail-portfolio-header">

            <div>

              <span>
                {
                  onboarding
                    ? "GET STARTED"
                    : "YOUR INVESTMENTS"
                }
              </span>

              <h1>
                {
                  onboarding
                    ? "Start with your portfolio."
                    : "My Portfolio"
                }
              </h1>

              <p>
                {
                  onboarding
                    ? "Choose how you want to bring your investments into FinClarity."
                    : "Manage the portfolio used across your Retail analytics."
                }
              </p>

            </div>


            {
              holdings.length > 0
              && mode !== "choose"
              && (

                <button
                  className="retail-portfolio-save"
                  type="button"
                  onClick={
                    savePortfolio
                  }
                >
                  <Save size={16} />
                  Save Portfolio
                </button>

              )
            }

          </header>


          {
            mode === "choose"
            && (

              <section className="retail-source-choice">

                <button
                  type="button"
                  onClick={
                    () => {
                      setMode(
                        "manual"
                      );

                      setSource(
                        "manual"
                      );
                    }
                  }
                >

                  <WalletCards size={25} />

                  <strong>
                    Enter manually
                  </strong>

                  <span>
                    Add the shares and funds you currently own.
                  </span>

                  <em>
                    Start entering
                    <ArrowRight size={14} />
                  </em>

                </button>


                <label>

                  <FileSpreadsheet size={25} />

                  <strong>
                    Import portfolio
                  </strong>

                  <span>
                    Upload a CSV exported from your broker or portfolio tracker.
                  </span>

                  <em>
                    Choose CSV
                    <Upload size={14} />
                  </em>

                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={
                      handleCsv
                    }
                  />

                </label>


                <button
                  type="button"
                  onClick={
                    () =>
                      setMode(
                        "link"
                      )
                  }
                >

                  <Link2 size={25} />

                  <strong>
                    Link portfolio
                  </strong>

                  <span>
                    Connect through a supported broker or portfolio provider.
                  </span>

                  <em>
                    View providers
                    <ArrowRight size={14} />
                  </em>

                </button>

              </section>

            )
          }


          {
            mode !== "choose"
            && (

              <section className="retail-portfolio-settings">

                <label>

                  <span>
                    Portfolio Name
                  </span>

                  <input
                    value={
                      portfolioName
                    }
                    onChange={
                      (event) =>
                        setPortfolioName(
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
                      displayCurrency
                    }
                    onChange={
                      (event) =>
                        setDisplayCurrency(
                          event.target.value
                        )
                    }
                  >
                    {
                      [
                        "GBP",
                        "USD",
                        "EUR",
                        "INR",
                        "JPY",
                        "CHF",
                        "CAD",
                        "AUD",
                      ].map(
                        (currency) => (
                          <option
                            key={
                              currency
                            }
                            value={
                              currency
                            }
                          >
                            {currency}
                          </option>
                        )
                      )
                    }
                  </select>

                </label>


                <div>

                  <span>
                    Active Source
                  </span>

                  <strong>
                    {
                      source === "csv"
                        ? "CSV Import"
                        : source === "linked"
                          ? "Linked Provider"
                          : "Manual"
                    }
                  </strong>

                </div>

              </section>

            )
          }


          {
            mode === "manual"
            && (

              <>

                <div className="retail-portfolio-mode-tabs">

                  <button
                    className="active"
                    type="button"
                    onClick={
                      () => {
                        setMode(
                          "manual"
                        );

                        setSource(
                          "manual"
                        );
                      }
                    }
                  >
                    <WalletCards size={15} />
                    Manual Entry
                  </button>


                  <label>

                    <Upload size={15} />
                    Import CSV

                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={
                        handleCsv
                      }
                    />

                  </label>


                  <button
                    type="button"
                    onClick={
                      () =>
                        setMode(
                          "link"
                        )
                    }
                  >
                    <Link2 size={15} />
                    Link Portfolio
                  </button>

                </div>


                <section className="retail-holdings-editor">

                  <header>

                    <div>

                      <h2>
                        Holdings
                      </h2>

                      <p>
                        These investments power your dashboard, risk and sentiment analysis.
                      </p>

                    </div>

                    <span>
                      {
                        holdings.length
                      }
                      {" "}
                      holdings
                    </span>

                  </header>


                  <div className="retail-editor-row header">

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
                      (holding) => (

                        <div
                          className="retail-editor-row"
                          key={
                            holding.id
                          }
                        >

                          <input
                            value={
                              holding.ticker
                            }
                            placeholder="AAPL"
                            onChange={
                              (event) =>
                                updateHolding(
                                  holding.id,
                                  "ticker",
                                  event
                                    .target
                                    .value
                                    .toUpperCase()
                                )
                            }
                          />


                          <input
                            value={
                              holding.name
                            }
                            placeholder="Apple"
                            onChange={
                              (event) =>
                                updateHolding(
                                  holding.id,
                                  "name",
                                  event
                                    .target
                                    .value
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
                                  holding.id,
                                  "quantity",
                                  event
                                    .target
                                    .value
                                )
                            }
                          />


                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={
                              holding.averageCost
                            }
                            onChange={
                              (event) =>
                                updateHolding(
                                  holding.id,
                                  "averageCost",
                                  event
                                    .target
                                    .value
                                )
                            }
                          />


                          <select
                            value={
                              holding.currency
                            }
                            onChange={
                              (event) =>
                                updateHolding(
                                  holding.id,
                                  "currency",
                                  event
                                    .target
                                    .value
                                )
                            }
                          >
                            {
                              [
                                "GBP",
                                "USD",
                                "EUR",
                                "INR",
                                "JPY",
                                "HKD",
                                "CHF",
                                "CAD",
                                "AUD",
                              ].map(
                                (currency) => (
                                  <option
                                    key={
                                      currency
                                    }
                                    value={
                                      currency
                                    }
                                  >
                                    {currency}
                                  </option>
                                )
                              )
                            }
                          </select>


                          <button
                            type="button"
                            aria-label={
                              `Remove ${holding.ticker || "holding"}`
                            }
                            onClick={
                              () =>
                                removeHolding(
                                  holding.id
                                )
                            }
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>

                      )
                    )
                  }


                  <button
                    className="retail-add-holding"
                    type="button"
                    onClick={
                      addHolding
                    }
                  >
                    <Plus size={15} />
                    Add Holding
                  </button>

                </section>

              </>

            )
          }


          {
            mode === "link"
            && (

              <section className="retail-link-workspace">

                <div>

                  <Link2 size={24} />

                  <h2>
                    Link Portfolio
                  </h2>

                  <p>
                    FinClarity will use secure provider authentication rather than asking for brokerage passwords.
                  </p>

                </div>


                <div className="retail-provider-grid">

                  {
                    [
                      [
                        "Interactive Brokers",
                        "Broker / custodian API",
                      ],
                      [
                        "Trading 212",
                        "Broker integration",
                      ],
                      [
                        "Portfolio Provider",
                        "OAuth / API connection",
                      ],
                    ].map(
                      (
                        [
                          name,
                          description,
                        ]
                      ) => (

                        <article
                          key={name}
                        >

                          <Link2 size={18} />

                          <strong>
                            {name}
                          </strong>

                          <span>
                            {description}
                          </span>

                          <button
                            type="button"
                            disabled
                          >
                            Provider setup required
                          </button>

                        </article>

                      )
                    )
                  }

                </div>


                <div className="retail-link-note">

                  Genuine broker linking requires provider-specific OAuth/API credentials and secure server-side token storage. FinClarity will not ask users to type brokerage passwords directly into the website.

                </div>


                <button
                  className="retail-back-to-method"
                  type="button"
                  onClick={
                    () =>
                      setMode(
                        holdings.length
                          ? "manual"
                          : "choose"
                      )
                  }
                >
                  Back
                </button>

              </section>

            )
          }


          {
            message
            && (

              <div className="retail-portfolio-message">
                {message}
              </div>

            )
          }

        </div>

      </main>

    </div>
  );
}


export default RetailPortfolioManager;
