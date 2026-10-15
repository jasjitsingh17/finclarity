export const
INSTITUTIONAL_MODEL_SETTINGS_KEY =
  "finclarity_institutional_model_settings";


export const
DEFAULT_INSTITUTIONAL_MODEL_SETTINGS = {

  market: {
    years: 3,
    riskFreeRate: 0.04,
    minWeight: 0,
    maxWeight: 1,
    frontierPoints: 50,
  },

  blackLitterman: {
    riskAversion: 2.5,
    tau: 0.05,
    viewScale: 0.06,
  },

  sentiment: {
    articlesPerTicker: 5,
    lookbackHours: 72,
  },

  backtesting: {
    trainingDays: 252,
    rebalanceDays: 21,
    transactionCostBps: 10,
  },

  factors: {
    momentum: 0.35,
    lowVolatility: 0.20,
    lowIdiosyncraticRisk: 0.15,
    sentiment: 0.30,
  },
};


export function
readInstitutionalModelSettings() {

  try {

    const raw =
      window.localStorage.getItem(
        INSTITUTIONAL_MODEL_SETTINGS_KEY
      );


    if (!raw) {

      return structuredClone(
        DEFAULT_INSTITUTIONAL_MODEL_SETTINGS
      );
    }


    const parsed =
      JSON.parse(raw);


    return {

      market: {
        ...DEFAULT_INSTITUTIONAL_MODEL_SETTINGS.market,
        ...(parsed.market || {}),
      },

      blackLitterman: {
        ...DEFAULT_INSTITUTIONAL_MODEL_SETTINGS.blackLitterman,
        ...(parsed.blackLitterman || {}),
      },

      sentiment: {
        ...DEFAULT_INSTITUTIONAL_MODEL_SETTINGS.sentiment,
        ...(parsed.sentiment || {}),
      },

      backtesting: {
        ...DEFAULT_INSTITUTIONAL_MODEL_SETTINGS.backtesting,
        ...(parsed.backtesting || {}),
      },

      factors: {
        ...DEFAULT_INSTITUTIONAL_MODEL_SETTINGS.factors,
        ...(parsed.factors || {}),
      },
    };

  } catch {

    return structuredClone(
      DEFAULT_INSTITUTIONAL_MODEL_SETTINGS
    );
  }
}


export function
saveInstitutionalModelSettings(
  settings,
) {

  window.localStorage.setItem(
    INSTITUTIONAL_MODEL_SETTINGS_KEY,
    JSON.stringify(settings),
  );


  window.dispatchEvent(
    new CustomEvent(
      "finclarity:institutional-model-settings",
      {
        detail: settings,
      }
    )
  );


  return settings;
}


export function
resetInstitutionalModelSettings() {

  const defaults =
    structuredClone(
      DEFAULT_INSTITUTIONAL_MODEL_SETTINGS
    );


  saveInstitutionalModelSettings(
    defaults
  );


  return defaults;
}
