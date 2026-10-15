export const
INSTITUTIONAL_PORTFOLIO_STORAGE_KEY =
  "finclarity_institutional_portfolio";


export const
DEFAULT_INSTITUTIONAL_PORTFOLIO = {

  version: 1,

  source: "manual",

  name: "Core Research Portfolio",

  benchmark: "SPY",

  baseCurrency: "USD",

  provider: null,

  lastUpdated: null,

  lastSynced: null,

  holdings: [
    {
      ticker: "AAPL",
      weight: 33.33,
      quantity: "",
      marketValue: "",
      currency: "USD",
    },
    {
      ticker: "MSFT",
      weight: 33.33,
      quantity: "",
      marketValue: "",
      currency: "USD",
    },
    {
      ticker: "NVDA",
      weight: 33.34,
      quantity: "",
      marketValue: "",
      currency: "USD",
    },
  ],
};


function cleanHolding(
  holding,
  fallbackCurrency,
) {

  return {

    ticker:
      String(
        holding?.ticker ?? ""
      )
        .trim()
        .toUpperCase(),

    weight:
      Number(
        holding?.weight ?? 0
      ),

    quantity:
      holding?.quantity ?? "",

    marketValue:
      holding?.marketValue ?? "",

    currency:
      String(
        holding?.currency
        ?? fallbackCurrency
        ?? "USD"
      )
        .trim()
        .toUpperCase(),
  };
}


export function
normaliseInstitutionalPortfolio(
  input,
) {

  if (Array.isArray(input)) {

    return {

      ...DEFAULT_INSTITUTIONAL_PORTFOLIO,

      holdings:
        input.map(
          (holding) =>
            cleanHolding(
              holding,
              "USD",
            )
        ),
    };
  }


  const portfolio =
    input
    && typeof input === "object"
      ? input
      : {};


  const baseCurrency =
    String(
      portfolio.baseCurrency
      ?? "USD"
    )
      .trim()
      .toUpperCase();


  const cleanedHoldings =
    Array.isArray(
      portfolio.holdings
    )
      ? portfolio.holdings
          .map(
            (holding) =>
              cleanHolding(
                holding,
                baseCurrency,
              )
          )
          .filter(
            (holding) =>
              holding.ticker
          )
      : [];


  return {

    ...DEFAULT_INSTITUTIONAL_PORTFOLIO,

    ...portfolio,

    baseCurrency,

    holdings:
      cleanedHoldings.length >= 2
        ? cleanedHoldings
        : DEFAULT_INSTITUTIONAL_PORTFOLIO
            .holdings
            .map(
              (holding) => ({
                ...holding,
              })
            ),
  };
}


export function
readInstitutionalPortfolio() {

  try {

    const raw =
      window.localStorage.getItem(
        INSTITUTIONAL_PORTFOLIO_STORAGE_KEY
      );


    if (!raw) {

      return normaliseInstitutionalPortfolio(
        DEFAULT_INSTITUTIONAL_PORTFOLIO
      );
    }


    return normaliseInstitutionalPortfolio(
      JSON.parse(raw)
    );

  } catch {

    return normaliseInstitutionalPortfolio(
      DEFAULT_INSTITUTIONAL_PORTFOLIO
    );
  }
}


export function
saveInstitutionalPortfolio(
  portfolio,
) {

  const normalised =
    normaliseInstitutionalPortfolio(
      portfolio
    );


  const saved = {

    ...normalised,

    lastUpdated:
      new Date().toISOString(),
  };


  window.localStorage.setItem(
    INSTITUTIONAL_PORTFOLIO_STORAGE_KEY,
    JSON.stringify(saved)
  );


  window.dispatchEvent(
    new CustomEvent(
      "finclarity:institutional-portfolio",
      {
        detail: saved,
      }
    )
  );


  return saved;
}


export function
getInstitutionalModelInputs() {

  const portfolio =
    readInstitutionalPortfolio();


  const holdings =
    portfolio.holdings.filter(
      (holding) =>
        holding.ticker
    );


  const rawWeights =
    holdings.map(
      (holding) =>
        Number(
          holding.weight || 0
        )
    );


  const total =
    rawWeights.reduce(
      (sum, weight) =>
        sum + weight,
      0
    );


  const weights =
    total > 0
      ? rawWeights.map(
          (weight) =>
            weight / total
        )
      : holdings.map(
          () =>
            1 / holdings.length
        );


  return {

    portfolio,

    tickers:
      holdings.map(
        (holding) =>
          holding.ticker
      ),

    weights,

    benchmark:
      portfolio.benchmark
      || "SPY",

    baseCurrency:
      portfolio.baseCurrency
      || "USD",
  };
}
