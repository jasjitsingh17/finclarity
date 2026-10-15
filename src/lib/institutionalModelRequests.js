import {
  getInstitutionalModelInputs,
} from "./institutionalPortfolio";

import {
  readInstitutionalModelSettings,
} from "./institutionalModelSettings";


function getSharedInputs() {

  const inputs =
    getInstitutionalModelInputs();


  if (
    !Array.isArray(
      inputs.tickers
    )
    || inputs.tickers.length < 2
  ) {

    throw new Error(
      "The active institutional portfolio requires at least two holdings."
    );
  }


  if (
    !Array.isArray(
      inputs.weights
    )
    || inputs.weights.length
      !== inputs.tickers.length
  ) {

    throw new Error(
      "The active institutional portfolio has invalid weights."
    );
  }


  return inputs;
}


function setKnownField(
  request,
  candidateKeys,
  value,
  fallbackKey = null,
) {

  const existingKey =
    candidateKeys.find(
      (key) =>
        Object.prototype
          .hasOwnProperty
          .call(
            request,
            key
          )
    );


  const key =
    existingKey
    ?? fallbackKey;


  if (!key) {
    return request;
  }


  return {
    ...request,
    [key]: value,
  };
}


function applySentimentSettings(
  request,
  settings,
) {

  let next =
    setKnownField(
      request,
      [
        "max_articles_per_ticker",
        "articles_per_ticker",
        "article_count",
        "max_articles",
      ],
      settings.sentiment
        .articlesPerTicker,
      "max_articles_per_ticker",
    );


  next =
    setKnownField(
      next,
      [
        "lookback_hours",
        "news_lookback_hours",
        "hours",
      ],
      settings.sentiment
        .lookbackHours,
      "lookback_hours",
    );


  return next;
}


function applyBacktestSettings(
  request,
  settings,
) {

  let next = {
    ...request,

    years:
      settings.market.years,

    risk_free_rate:
      settings.market
        .riskFreeRate,
  };


  next =
    setKnownField(
      next,
      [
        "training_days",
        "training_window",
        "training_window_days",
      ],
      settings.backtesting
        .trainingDays,
      "training_days",
    );


  next =
    setKnownField(
      next,
      [
        "rebalance_days",
        "rebalance_frequency",
        "rebalance_frequency_days",
      ],
      settings.backtesting
        .rebalanceDays,
      "rebalance_days",
    );


  next =
    setKnownField(
      next,
      [
        "transaction_cost_bps",
        "transaction_cost",
        "cost_bps",
      ],
      settings.backtesting
        .transactionCostBps,
      "transaction_cost_bps",
    );


  return next;
}


export function
buildPortfolioRequest(
  baseRequest = {},
) {

  const inputs =
    getSharedInputs();

  const settings =
    readInstitutionalModelSettings();


  return {

    ...baseRequest,

    tickers:
      inputs.tickers,

    current_weights:
      inputs.weights,

    years:
      settings.market.years,

    risk_free_rate:
      settings.market
        .riskFreeRate,

    min_weight:
      settings.market
        .minWeight,

    max_weight:
      settings.market
        .maxWeight,

    frontier_points:
      settings.market
        .frontierPoints,
  };
}


export function
buildSentimentRequest(
  baseRequest = {},
) {

  const inputs =
    getSharedInputs();

  const settings =
    readInstitutionalModelSettings();


  const request = {

    ...baseRequest,

    tickers:
      inputs.tickers,
  };


  return applySentimentSettings(
    request,
    settings,
  );
}


export function
buildBlackLittermanRequest(
  baseRequest = {},
) {

  const inputs =
    getSharedInputs();

  const settings =
    readInstitutionalModelSettings();


  let request = {

    ...baseRequest,

    tickers:
      inputs.tickers,

    reference_weights:
      inputs.weights,

    years:
      settings.market.years,

    risk_free_rate:
      settings.market
        .riskFreeRate,

    min_weight:
      settings.market
        .minWeight,

    max_weight:
      settings.market
        .maxWeight,

    frontier_points:
      settings.market
        .frontierPoints,

    risk_aversion:
      settings.blackLitterman
        .riskAversion,

    tau:
      settings.blackLitterman
        .tau,

    view_scale:
      settings.blackLitterman
        .viewScale,
  };


  request =
    applySentimentSettings(
      request,
      settings,
    );


  return request;
}


export function
buildFactorRequest(
  baseRequest = {},
) {

  const inputs =
    getSharedInputs();

  const settings =
    readInstitutionalModelSettings();


  let request = {

    ...baseRequest,

    tickers:
      inputs.tickers,

    benchmark:
      inputs.benchmark,

    years:
      settings.market.years,

    factor_weights: {
      momentum:
        settings.factors
          .momentum,

      low_volatility:
        settings.factors
          .lowVolatility,

      low_idiosyncratic_risk:
        settings.factors
          .lowIdiosyncraticRisk,

      sentiment_alpha:
        settings.factors
          .sentiment,
    },
  };


  request =
    applySentimentSettings(
      request,
      settings,
    );


  return request;
}


export function
buildRiskRequest(
  baseRequest = {},
) {

  const inputs =
    getSharedInputs();

  const settings =
    readInstitutionalModelSettings();


  return {

    ...baseRequest,

    tickers:
      inputs.tickers,

    weights:
      inputs.weights,

    benchmark:
      inputs.benchmark,

    years:
      settings.market.years,

    risk_free_rate:
      settings.market
        .riskFreeRate,
  };
}


export function
buildBacktestRequest(
  baseRequest = {},
) {

  const inputs =
    getSharedInputs();

  const settings =
    readInstitutionalModelSettings();


  let request = {

    ...baseRequest,

    tickers:
      inputs.tickers,

    benchmark:
      inputs.benchmark,
  };


  request =
    applyBacktestSettings(
      request,
      settings,
    );


  return request;
}
