export const
RETAIL_PORTFOLIO_KEY =
  "finclarity_retail_portfolio";


export const
LEGACY_RETAIL_HOLDINGS_KEY =
  "finclarity_holdings";


export const
RETAIL_PREFERENCES_KEY =
  "finclarity_preferences";


export const
DEFAULT_RETAIL_PREFERENCES = {

  displayCurrency: "GBP",

  markets: [],
};


function cleanText(
  value,
) {

  return String(
    value ?? ""
  ).trim();
}


function cleanNumber(
  value,
  fallback = null,
) {

  if (
    value === ""
    || value === null
    || value === undefined
  ) {

    return fallback;
  }


  const parsed =
    Number(
      String(value)
        .replace(/,/g, "")
        .replace(/[£$€₹¥]/g, "")
        .trim()
    );


  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}


export function
normaliseRetailHolding(
  holding,
) {

  const ticker =
    cleanText(
      holding?.ticker
      ?? holding?.symbol
    ).toUpperCase();


  const quantity =
    cleanNumber(
      holding?.quantity
      ?? holding?.shares
      ?? holding?.units,
      0,
    );


  const averageCost =
    cleanNumber(
      holding?.averageCost
      ?? holding?.average_cost
      ?? holding?.avgCost
      ?? holding?.price,
      null,
    );


  const marketValue =
    cleanNumber(
      holding?.marketValue
      ?? holding?.market_value
      ?? holding?.value,
      null,
    );


  return {

    ticker,

    name:
      cleanText(
        holding?.name
      ),

    market:
      cleanText(
        holding?.market
      ),

    assetType:
      cleanText(
        holding?.assetType
        ?? holding?.asset_type
      )
      || "Equity",

    quantity,

    averageCost,

    marketValue,

    nativeCurrency:
      (
        cleanText(
          holding?.nativeCurrency
          ?? holding?.currency
        )
        || "GBP"
      ).toUpperCase(),
  };
}


function uniqueHoldings(
  holdings,
) {

  const result = [];
  const seen = new Set();


  for (
    const rawHolding
    of holdings || []
  ) {

    const holding =
      normaliseRetailHolding(
        rawHolding
      );


    if (!holding.ticker) {
      continue;
    }


    if (
      seen.has(
        holding.ticker
      )
    ) {

      throw new Error(
        `Duplicate ticker: ${holding.ticker}. `
        + "Please keep one row per holding."
      );
    }


    seen.add(
      holding.ticker
    );

    result.push(
      holding
    );
  }


  return result;
}


export function
readRetailPreferences() {

  try {

    const raw =
      window.localStorage.getItem(
        RETAIL_PREFERENCES_KEY
      );


    if (!raw) {

      return {
        ...DEFAULT_RETAIL_PREFERENCES,
      };
    }


    return {

      ...DEFAULT_RETAIL_PREFERENCES,

      ...JSON.parse(
        raw
      ),
    };

  } catch {

    return {
      ...DEFAULT_RETAIL_PREFERENCES,
    };
  }
}


function legacyPortfolio() {

  let holdings = [];


  try {

    const raw =
      window.localStorage.getItem(
        LEGACY_RETAIL_HOLDINGS_KEY
      );


    if (raw) {

      holdings =
        JSON.parse(
          raw
        );
    }

  } catch {

    holdings = [];
  }


  const preferences =
    readRetailPreferences();


  return {

    version: 1,

    name:
      "My Portfolio",

    source:
      "manual",

    baseCurrency:
      preferences.displayCurrency
      || "GBP",

    holdings:
      uniqueHoldings(
        holdings
      ),

    linkedProvider:
      null,

    updatedAt:
      null,
  };
}


export function
readRetailPortfolio() {

  try {

    const raw =
      window.localStorage.getItem(
        RETAIL_PORTFOLIO_KEY
      );


    if (!raw) {

      return legacyPortfolio();
    }


    const parsed =
      JSON.parse(
        raw
      );


    return {

      version: 1,

      name:
        cleanText(
          parsed?.name
        )
        || "My Portfolio",

      source:
        cleanText(
          parsed?.source
        )
        || "manual",

      baseCurrency:
        (
          cleanText(
            parsed?.baseCurrency
          )
          || "GBP"
        ).toUpperCase(),

      holdings:
        uniqueHoldings(
          parsed?.holdings
          || []
        ),

      linkedProvider:
        parsed?.linkedProvider
        ?? null,

      updatedAt:
        parsed?.updatedAt
        ?? null,
    };

  } catch {

    return legacyPortfolio();
  }
}


export function
saveRetailPortfolio(
  portfolio,
) {

  const cleanPortfolio = {

    version: 1,

    name:
      cleanText(
        portfolio?.name
      )
      || "My Portfolio",

    source:
      cleanText(
        portfolio?.source
      )
      || "manual",

    baseCurrency:
      (
        cleanText(
          portfolio?.baseCurrency
        )
        || "GBP"
      ).toUpperCase(),

    holdings:
      uniqueHoldings(
        portfolio?.holdings
        || []
      ),

    linkedProvider:
      portfolio?.linkedProvider
      ?? null,

    updatedAt:
      new Date()
        .toISOString(),
  };


  window.localStorage.setItem(
    RETAIL_PORTFOLIO_KEY,
    JSON.stringify(
      cleanPortfolio
    ),
  );


  /*
   * Backward compatibility:
   * the current Retail Dashboard still reads
   * finclarity_holdings directly.
   */

  window.localStorage.setItem(
    LEGACY_RETAIL_HOLDINGS_KEY,
    JSON.stringify(
      cleanPortfolio.holdings
    ),
  );


  const preferences =
    readRetailPreferences();


  window.localStorage.setItem(
    RETAIL_PREFERENCES_KEY,
    JSON.stringify(
      {
        ...preferences,

        displayCurrency:
          cleanPortfolio
            .baseCurrency,
      }
    ),
  );


  window.dispatchEvent(
    new CustomEvent(
      "finclarity:retail-portfolio",
      {
        detail:
          cleanPortfolio,
      }
    )
  );


  return cleanPortfolio;
}
