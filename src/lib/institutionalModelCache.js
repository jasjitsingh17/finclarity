import {
  readInstitutionalPortfolio,
} from "./institutionalPortfolio";

import {
  readInstitutionalModelSettings,
} from "./institutionalModelSettings";


const CACHE_PREFIX =
  "finclarity_institutional_model_result:";


function sortValue(
  value,
) {

  if (
    Array.isArray(
      value
    )
  ) {

    return value.map(
      sortValue
    );
  }


  if (
    value
    && typeof value === "object"
  ) {

    return Object.fromEntries(
      Object.keys(
        value
      )
        .sort()
        .map(
          (key) => [
            key,
            sortValue(
              value[key]
            ),
          ]
        )
    );
  }


  return value;
}


function stableStringify(
  value,
) {

  return JSON.stringify(
    sortValue(
      value
    )
  );
}


function portfolioSnapshot() {

  const portfolio =
    readInstitutionalPortfolio();


  return {

    name:
      portfolio.name
      || "Institutional Portfolio",

    benchmark:
      portfolio.benchmark
      || "SPY",

    baseCurrency:
      portfolio.baseCurrency
      || "USD",

    holdings:
      (
        portfolio.holdings
        || []
      ).map(
        (holding) => ({
          ticker:
            holding.ticker,

          weight:
            Number(
              holding.weight
              || 0
            ),
        })
      ),
  };
}


function relevantSettings(
  modelKey,
) {

  const settings =
    readInstitutionalModelSettings();


  switch (
    modelKey
  ) {

    case "risk":

      return {
        market:
          settings.market,
      };


    case "efficient-frontier":

      return {
        market:
          settings.market,
      };


    case "sentiment":

      return {
        sentiment:
          settings.sentiment,
      };


    case "black-litterman":

      return {
        market:
          settings.market,

        sentiment:
          settings.sentiment,

        blackLitterman:
          settings.blackLitterman,
      };


    case "factors":

      return {
        market:
          settings.market,

        sentiment:
          settings.sentiment,

        factors:
          settings.factors,
      };


    case "backtesting":

      return {
        market:
          settings.market,

        backtesting:
          settings.backtesting,
      };


    default:

      return settings;
  }
}


export function
getInstitutionalModelSignature(
  modelKey,
) {

  return stableStringify(
    {
      portfolio:
        portfolioSnapshot(),

      settings:
        relevantSettings(
          modelKey
        ),
    }
  );
}


function storageKey(
  modelKey,
) {

  return (
    CACHE_PREFIX
    + modelKey
  );
}


export function
readInstitutionalModelCache(
  modelKey,
) {

  try {

    const raw =
      window.localStorage
        .getItem(
          storageKey(
            modelKey
          )
        );


    if (!raw) {
      return null;
    }


    const parsed =
      JSON.parse(
        raw
      );


    if (
      !parsed
      || parsed.version !== 1
      || parsed.modelKey
        !== modelKey
      || !(
        "result"
        in parsed
      )
    ) {

      return null;
    }


    return parsed;

  } catch {

    return null;
  }
}


export function
saveInstitutionalModelCache(
  modelKey,
  result,
) {

  const portfolio =
    readInstitutionalPortfolio();


  const record = {

    version: 1,

    modelKey,

    result,

    signature:
      getInstitutionalModelSignature(
        modelKey
      ),

    generatedAt:
      new Date()
        .toISOString(),

    portfolioName:
      portfolio.name
      || "Institutional Portfolio",
  };


  window.localStorage
    .setItem(
      storageKey(
        modelKey
      ),
      JSON.stringify(
        record
      )
    );


  window.dispatchEvent(
    new CustomEvent(
      "finclarity:institutional-model-result",
      {
        detail: {
          modelKey,
        },
      }
    )
  );


  return record;
}


export function
clearInstitutionalModelCache(
  modelKey,
) {

  window.localStorage
    .removeItem(
      storageKey(
        modelKey
      )
    );


  window.dispatchEvent(
    new CustomEvent(
      "finclarity:institutional-model-result",
      {
        detail: {
          modelKey,
        },
      }
    )
  );
}
