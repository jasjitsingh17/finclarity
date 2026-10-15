import {
  readRetailPortfolio,
} from "./retailPortfolio";


const CACHE_KEY =
  "finclarity_retail_analysis_v1";


function stableHoldings(
  holdings,
) {

  return (
    holdings
    || []
  )
    .map(
      (holding) => ({
        ticker:
          String(
            holding.ticker
            || ""
          )
            .trim()
            .toUpperCase(),

        quantity:
          Number(
            holding.quantity
            || 0
          ),

        averageCost:
          holding.averageCost
          === null
          || holding.averageCost
          === undefined
            ? null
            : Number(
                holding.averageCost
              ),

        nativeCurrency:
          String(
            holding.nativeCurrency
            || ""
          )
            .trim()
            .toUpperCase(),
      })
    )
    .sort(
      (left, right) =>
        left.ticker.localeCompare(
          right.ticker
        )
    );
}


export function
retailPortfolioSignature(
  portfolio = null,
) {

  const current =
    portfolio
    || readRetailPortfolio();


  return JSON.stringify(
    {
      name:
        current.name
        || "My Portfolio",

      baseCurrency:
        current.baseCurrency
        || "GBP",

      holdings:
        stableHoldings(
          current.holdings
        ),
    }
  );
}


export function
readRetailAnalysisCache(
  portfolio = null,
) {

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
      !record
      || record.version !== 1
      || !record.result
    ) {

      return null;
    }


    return {
      ...record,

      status:
        record.signature
        === retailPortfolioSignature(
          portfolio
        )
          ? "current"
          : "stale",
    };

  } catch {

    return null;
  }
}


export function
saveRetailAnalysisCache(
  result,
  portfolio = null,
) {

  const current =
    portfolio
    || readRetailPortfolio();


  const record = {

    version: 1,

    signature:
      retailPortfolioSignature(
        current
      ),

    generatedAt:
      new Date()
        .toISOString(),

    portfolioName:
      current.name
      || "My Portfolio",

    result,
  };


  window.localStorage.setItem(
    CACHE_KEY,
    JSON.stringify(
      record
    ),
  );


  return {
    ...record,
    status: "current",
  };
}
