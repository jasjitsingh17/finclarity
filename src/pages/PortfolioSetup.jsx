import { useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Globe2,
  LineChart,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  WalletCards,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";


// ========================================
// MARKET OPTIONS
// ========================================

const marketOptions = [
  {
    id: "US",
    name: "United States",
    description: "NYSE, NASDAQ, S&P 500",
  },
  {
    id: "UK",
    name: "United Kingdom",
    description: "LSE, FTSE 100, FTSE 250",
  },
  {
    id: "IN",
    name: "India",
    description: "NSE, BSE, NIFTY 50",
  },
  {
    id: "EU",
    name: "Europe",
    description: "Major European exchanges",
  },
  {
    id: "JP",
    name: "Japan",
    description: "Tokyo Stock Exchange",
  },
  {
    id: "GLOBAL",
    name: "Global",
    description: "ETFs and international assets",
  },
];


// ========================================
// CURRENCY OPTIONS
// ========================================

const currencyOptions = [
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
  },
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
  },
  {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
  },
  {
    code: "CHF",
    symbol: "CHF",
    name: "Swiss Franc",
  },
  {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
  },
];


// ========================================
// EMPTY HOLDING
// ========================================

const emptyHolding = {
  ticker: "",
  name: "",
  market: "US",
  assetType: "Stock",
  quantity: "",
  averageCost: "",
  nativeCurrency: "USD",
};


// ========================================
// PORTFOLIO SETUP PAGE
// ========================================

export default function PortfolioSetup() {

  const navigate = useNavigate();


  const [displayCurrency, setDisplayCurrency] =
    useState("GBP");


  const [selectedMarkets, setSelectedMarkets] =
    useState(["US", "UK"]);


  const [form, setForm] =
    useState(emptyHolding);


  const [holdings, setHoldings] =
    useState([]);


  // --------------------------------------
  // MARKET TOGGLE
  // --------------------------------------

  function toggleMarket(marketId) {

    setSelectedMarkets((current) => {

      if (current.includes(marketId)) {

        return current.filter(
          (market) =>
            market !== marketId
        );

      }

      return [
        ...current,
        marketId,
      ];

    });

  }


  // --------------------------------------
  // UPDATE FORM
  // --------------------------------------

  function updateForm(field, value) {

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  }


  // --------------------------------------
  // ADD HOLDING
  // --------------------------------------

  function addHolding(event) {

    event.preventDefault();


    if (
      !form.ticker.trim() ||
      !form.name.trim() ||
      Number(form.quantity) <= 0 ||
      Number(form.averageCost) < 0
    ) {
      return;
    }


    const newHolding = {

      id: crypto.randomUUID(),

      ticker:
        form.ticker
          .trim()
          .toUpperCase(),

      name:
        form.name.trim(),

      market:
        form.market,

      assetType:
        form.assetType,

      quantity:
        Number(form.quantity),

      averageCost:
        Number(form.averageCost),

      nativeCurrency:
        form.nativeCurrency,

    };


    setHoldings((current) => [
      ...current,
      newHolding,
    ]);


    setForm((current) => ({
      ...emptyHolding,

      market:
        current.market,

      nativeCurrency:
        current.nativeCurrency,
    }));

  }


  // --------------------------------------
  // REMOVE HOLDING
  // --------------------------------------

  function removeHolding(id) {

    setHoldings((current) =>
      current.filter(
        (holding) =>
          holding.id !== id
      )
    );

  }


  // --------------------------------------
  // TOTAL COST BASIS
  // --------------------------------------

  const totalEnteredPositions =
    useMemo(
      () => holdings.length,
      [holdings]
    );


  // --------------------------------------
  // SAVE
  // --------------------------------------

  function continueToDashboard() {

    const preferences = {
      displayCurrency,
      markets: selectedMarkets,
    };


    localStorage.setItem(
      "finclarity_preferences",
      JSON.stringify(preferences)
    );


    localStorage.setItem(
      "finclarity_holdings",
      JSON.stringify(holdings)
    );


    navigate("/retail");

  }


  return (
    <div className="portfolio-setup-page">

      {/* =================================
          TOPBAR
      ================================= */}

      <header className="setup-topbar">

        <Link
          to="/"
          className="setup-logo"
        >

          <div className="setup-logo-mark">
            <LineChart size={21} />
          </div>


          <div>
            <strong>
              finclarity.
            </strong>

            <span>
              PERSONAL INVESTING
            </span>
          </div>

        </Link>


        <Link
          to="/"
          className="setup-back"
        >
          <ArrowLeft size={15} />
          Investor selection
        </Link>

      </header>


      <main className="setup-container">

        {/* =================================
            INTRO
        ================================= */}

        <section className="setup-intro">

          <span>
            PORTFOLIO SETUP
          </span>


          <h1>
            Let's build your
            <strong>
              {" "}FinClarity portfolio.
            </strong>
          </h1>


          <p>
            Choose how you want to view
            your investments, select your
            markets and add your holdings.
          </p>

        </section>


        {/* =================================
            STEP 1 — CURRENCY
        ================================= */}

        <section className="setup-card">

          <div className="setup-card-heading">

            <div className="setup-step-number">
              01
            </div>


            <div>
              <h2>
                Choose your display currency
              </h2>

              <p>
                FinClarity will eventually convert
                your portfolio into this currency
                while preserving each asset's
                original currency.
              </p>
            </div>

          </div>


          <div className="currency-grid">

            {currencyOptions.map(
              (currency) => (

                <button
                  key={currency.code}

                  className={
                    displayCurrency ===
                    currency.code
                      ? "currency-option selected"
                      : "currency-option"
                  }

                  onClick={() =>
                    setDisplayCurrency(
                      currency.code
                    )
                  }
                >

                  <span className="currency-symbol">
                    {currency.symbol}
                  </span>


                  <div>
                    <strong>
                      {currency.code}
                    </strong>

                    <span>
                      {currency.name}
                    </span>
                  </div>


                  {displayCurrency ===
                    currency.code && (
                    <Check size={17} />
                  )}

                </button>

              )
            )}

          </div>

        </section>


        {/* =================================
            STEP 2 — MARKETS
        ================================= */}

        <section className="setup-card">

          <div className="setup-card-heading">

            <div className="setup-step-number">
              02
            </div>


            <div>
              <h2>
                Which markets do you invest in?
              </h2>

              <p>
                This will later help FinClarity
                select the correct exchanges,
                sentiment sources and benchmarks.
              </p>
            </div>

          </div>


          <div className="market-grid">

            {marketOptions.map(
              (market) => {

                const selected =
                  selectedMarkets.includes(
                    market.id
                  );


                return (
                  <button
                    key={market.id}

                    className={
                      selected
                        ? "market-option selected"
                        : "market-option"
                    }

                    onClick={() =>
                      toggleMarket(
                        market.id
                      )
                    }
                  >

                    <div className="market-icon">
                      <Globe2 size={19} />
                    </div>


                    <div>
                      <strong>
                        {market.name}
                      </strong>

                      <span>
                        {market.description}
                      </span>
                    </div>


                    <div
                      className={
                        selected
                          ? "market-check selected"
                          : "market-check"
                      }
                    >
                      {selected && (
                        <Check size={13} />
                      )}
                    </div>

                  </button>
                );

              }
            )}

          </div>

        </section>


        {/* =================================
            STEP 3 — PORTFOLIO METHOD
        ================================= */}

        <section className="setup-card">

          <div className="setup-card-heading">

            <div className="setup-step-number">
              03
            </div>


            <div>
              <h2>
                Add your investments
              </h2>

              <p>
                Start manually today.
                Portfolio imports and brokerage
                connections will plug into the
                same system later.
              </p>
            </div>

          </div>


          <div className="portfolio-method-grid">

            <div className="portfolio-method active">

              <div className="method-icon">
                <WalletCards size={22} />
              </div>

              <strong>
                Enter Manually
              </strong>

              <span>
                Add individual holdings
              </span>

              <div className="available-label">
                AVAILABLE
              </div>

            </div>


            <div className="portfolio-method">

              <div className="method-icon">
                <Upload size={22} />
              </div>

              <strong>
                Import Portfolio
              </strong>

              <span>
                CSV or spreadsheet
              </span>

              <div className="coming-label">
                NEXT PHASE
              </div>

            </div>


            <div className="portfolio-method">

              <div className="method-icon">
                <CircleDollarSign size={22} />
              </div>

              <strong>
                Link Portfolio
              </strong>

              <span>
                Connect an investment account
              </span>

              <div className="coming-label">
                PLANNED
              </div>

            </div>

          </div>

        </section>


        {/* =================================
            MANUAL HOLDING FORM
        ================================= */}

        <section className="setup-card">

          <div className="setup-card-heading">

            <div className="setup-step-number">
              04
            </div>


            <div>
              <h2>
                Enter your holdings
              </h2>

              <p>
                Add stocks, ETFs, funds
                or other supported investments.
              </p>
            </div>

          </div>


          <form
            className="holding-form"
            onSubmit={addHolding}
          >

            <div className="form-field">

              <label>
                Ticker
              </label>

              <input
                type="text"
                placeholder="e.g. AAPL"

                value={form.ticker}

                onChange={(event) =>
                  updateForm(
                    "ticker",
                    event.target.value
                  )
                }
              />

            </div>


            <div className="form-field wide">

              <label>
                Investment name
              </label>

              <input
                type="text"
                placeholder="e.g. Apple"

                value={form.name}

                onChange={(event) =>
                  updateForm(
                    "name",
                    event.target.value
                  )
                }
              />

            </div>


            <div className="form-field">

              <label>
                Market
              </label>

              <select
                value={form.market}

                onChange={(event) =>
                  updateForm(
                    "market",
                    event.target.value
                  )
                }
              >
                <option value="US">
                  United States
                </option>

                <option value="UK">
                  United Kingdom
                </option>

                <option value="IN">
                  India
                </option>

                <option value="EU">
                  Europe
                </option>

                <option value="JP">
                  Japan
                </option>

                <option value="GLOBAL">
                  Global
                </option>
              </select>

            </div>


            <div className="form-field">

              <label>
                Asset type
              </label>

              <select
                value={form.assetType}

                onChange={(event) =>
                  updateForm(
                    "assetType",
                    event.target.value
                  )
                }
              >
                <option value="Stock">
                  Stock
                </option>

                <option value="ETF">
                  ETF
                </option>

                <option value="Fund">
                  Mutual Fund
                </option>

                <option value="Bond">
                  Bond
                </option>

                <option value="Cash">
                  Cash / Deposit
                </option>
              </select>

            </div>


            <div className="form-field">

              <label>
                Quantity
              </label>

              <input
                type="number"
                min="0"
                step="any"
                placeholder="10"

                value={form.quantity}

                onChange={(event) =>
                  updateForm(
                    "quantity",
                    event.target.value
                  )
                }
              />

            </div>


            <div className="form-field">

              <label>
                Average cost
              </label>

              <input
                type="number"
                min="0"
                step="any"
                placeholder="150"

                value={form.averageCost}

                onChange={(event) =>
                  updateForm(
                    "averageCost",
                    event.target.value
                  )
                }
              />

            </div>


            <div className="form-field">

              <label>
                Asset currency
              </label>

              <select
                value={form.nativeCurrency}

                onChange={(event) =>
                  updateForm(
                    "nativeCurrency",
                    event.target.value
                  )
                }
              >

                {currencyOptions.map(
                  (currency) => (
                    <option
                      key={currency.code}
                      value={currency.code}
                    >
                      {currency.code}
                    </option>
                  )
                )}

              </select>

            </div>


            <button
              type="submit"
              className="add-holding-button"
            >
              <Plus size={17} />
              Add Holding
            </button>

          </form>

        </section>


        {/* =================================
            ADDED HOLDINGS
        ================================= */}

        <section className="setup-card">

          <div className="setup-card-heading holdings-heading">

            <div>

              <div className="setup-step-number">
                05
              </div>

            </div>


            <div>
              <h2>
                Your portfolio
              </h2>

              <p>
                {totalEnteredPositions}
                {" "}
                holding
                {totalEnteredPositions !== 1
                  ? "s"
                  : ""}
                {" "}
                added
              </p>
            </div>

          </div>


          {holdings.length === 0 ? (

            <div className="empty-portfolio">

              <WalletCards size={29} />

              <strong>
                No holdings added yet
              </strong>

              <span>
                Use the form above to add
                your first investment.
              </span>

            </div>

          ) : (

            <div className="setup-holdings-list">

              {holdings.map(
                (holding) => (

                  <div
                    key={holding.id}
                    className="setup-holding-row"
                  >

                    <div className="setup-ticker">
                      {holding.ticker[0]}
                    </div>


                    <div className="setup-holding-name">

                      <strong>
                        {holding.name}
                      </strong>

                      <span>
                        {holding.ticker}
                        {" · "}
                        {holding.assetType}
                        {" · "}
                        {holding.market}
                      </span>

                    </div>


                    <div className="setup-holding-number">

                      <span>
                        Quantity
                      </span>

                      <strong>
                        {holding.quantity}
                      </strong>

                    </div>


                    <div className="setup-holding-number">

                      <span>
                        Average Cost
                      </span>

                      <strong>
                        {holding.nativeCurrency}
                        {" "}
                        {holding.averageCost}
                      </strong>

                    </div>


                    <button
                      className="delete-holding"

                      onClick={() =>
                        removeHolding(
                          holding.id
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* =================================
            CONTINUE
        ================================= */}

        <section className="setup-complete">

          <div>

            <ShieldCheck size={20} />

            <div>
              <strong>
                Your preferences will be
                stored locally for now.
              </strong>

              <span>
                No account or cloud database
                is being used at this stage.
              </span>
            </div>

          </div>


          <button
            className="continue-dashboard"

            disabled={
              holdings.length === 0 ||
              selectedMarkets.length === 0
            }

            onClick={
              continueToDashboard
            }
          >
            Continue to Dashboard
            <ArrowRight size={18} />
          </button>

        </section>

      </main>

    </div>
  );
}