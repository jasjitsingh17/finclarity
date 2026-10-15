const SNAPSHOT_KEY =
  "finclarity_retail_market_snapshot_v1";


function stablePortfolioKey(
  portfolio,
) {

  const holdings =
    Array.isArray(
      portfolio?.holdings
    )
      ? portfolio.holdings
      : [];


  const stable =
    holdings
      .map(
        (holding) => ({
          ticker:
            String(
              holding?.ticker
              ?? ""
            )
              .trim()
              .toUpperCase(),

          quantity:
            Number(
              holding?.quantity
              ?? 0
            ),

          averageCost:
            Number(
              holding?.averageCost
              ?? holding?.average_cost
              ?? 0
            ),

          currency:
            String(
              holding?.currency
              ?? ""
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


  return JSON.stringify({
    baseCurrency:
      String(
        portfolio?.baseCurrency
        ?? "GBP"
      )
        .trim()
        .toUpperCase(),

    holdings:
      stable,
  });
}


export function writeRetailMarketSnapshot(
  portfolio,
  market,
) {

  if (
    !market
    || typeof window
    === "undefined"
  ) {
    return null;
  }


  const record = {
    version:
      1,

    portfolioKey:
      stablePortfolioKey(
        portfolio
      ),

    generatedAt:
      new Date()
        .toISOString(),

    market,
  };


  window.localStorage.setItem(
    SNAPSHOT_KEY,
    JSON.stringify(
      record
    )
  );


  return record;
}


export function readRetailMarketSnapshot(
  portfolio,
) {

  if (
    typeof window
    === "undefined"
  ) {
    return null;
  }


  try {

    const raw =
      window.localStorage
        .getItem(
          SNAPSHOT_KEY
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
      || !record.market
    ) {
      return null;
    }


    if (
      record.portfolioKey
      !== stablePortfolioKey(
        portfolio
      )
    ) {
      return null;
    }


    return record;

  } catch {

    return null;

  }
}
