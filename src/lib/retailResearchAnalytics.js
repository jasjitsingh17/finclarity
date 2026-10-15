export function numeric(
  ...values
) {

  for (const value of values) {

    if (
      value === null
      || value === undefined
      || value === ""
    ) {
      continue;
    }

    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}


export function deepValueByKeys(
  input,
  keys,
  seen = new Set(),
) {

  if (
    !input
    || typeof input !== "object"
  ) {
    return undefined;
  }


  if (seen.has(input)) {
    return undefined;
  }


  seen.add(input);


  for (const key of keys) {

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          input,
          key,
        )
    ) {
      return input[key];
    }
  }


  for (
    const value
    of Object.values(input)
  ) {

    const result =
      deepValueByKeys(
        value,
        keys,
        seen,
      );

    if (
      result !== undefined
    ) {
      return result;
    }
  }


  return undefined;
}


export function extractRetailRisk(
  raw,
) {

  if (!raw) {
    return {
      volatility: null,
      drawdown: null,
      var95: null,
      cvar95: null,
      sharpe: null,
      sortino: null,
      beta: null,
    };
  }


  const source =
    deepValueByKeys(
      raw,
      [
        "current_portfolio",
        "portfolio_metrics",
        "risk_summary",
      ],
    )
    ?? raw;


  return {
    volatility:
      numeric(
        deepValueByKeys(
          source,
          [
            "annualised_volatility",
            "annualized_volatility",
            "portfolio_volatility",
            "volatility",
          ],
        ),
      ),

    drawdown:
      numeric(
        deepValueByKeys(
          source,
          [
            "maximum_drawdown",
            "max_drawdown",
          ],
        ),
      ),

    var95:
      numeric(
        deepValueByKeys(
          source,
          [
            "var_95",
            "historical_var_95",
            "value_at_risk_95",
            "var95",
          ],
        ),
      ),

    cvar95:
      numeric(
        deepValueByKeys(
          source,
          [
            "cvar_95",
            "historical_cvar_95",
            "expected_shortfall_95",
            "cvar95",
          ],
        ),
      ),

    sharpe:
      numeric(
        deepValueByKeys(
          source,
          [
            "sharpe_ratio",
            "sharpe",
          ],
        ),
      ),

    sortino:
      numeric(
        deepValueByKeys(
          source,
          [
            "sortino_ratio",
            "sortino",
          ],
        ),
      ),

    beta:
      numeric(
        deepValueByKeys(
          raw,
          [
            "benchmark_beta",
            "beta",
          ],
        ),
      ),
  };
}


function normaliseTickerSentiment(
  ticker,
  item,
) {

  return {
    ticker,

    score:
      numeric(
        item?.sentiment_score,
        item?.score,
      ),

    confidence:
      numeric(
        item?.confidence,
        item?.model_confidence,
      ),

    label:
      item?.regime
      ?? item?.dominant_label
      ?? item?.label
      ?? item?.signal
      ?? "Unavailable",

    rag:
      item?.rag
      ?? item?.rag_status
      ?? null,

    articleCount:
      numeric(
        item?.article_count,
        item?.headline_count,
      ),
  };
}


export function extractRetailSentiment(
  raw,
) {

  if (!raw) {
    return {
      portfolio: {
        score: null,
        confidence: null,
        label: "Unavailable",
      },

      byTicker: {},
    };
  }


  const portfolioSource =
    deepValueByKeys(
      raw,
      [
        "portfolio_sentiment",
        "portfolio_summary",
      ],
    )
    ?? raw.portfolio
    ?? raw.summary
    ?? raw;


  const portfolio = {
    score:
      numeric(
        deepValueByKeys(
          portfolioSource,
          [
            "sentiment_score",
            "score",
          ],
        ),
      ),

    confidence:
      numeric(
        deepValueByKeys(
          portfolioSource,
          [
            "confidence",
            "model_confidence",
          ],
        ),
      ),

    label:
      deepValueByKeys(
        portfolioSource,
        [
          "regime",
          "dominant_label",
          "label",
          "signal",
        ],
      )
      ?? "Unavailable",
  };


  const candidate =
    deepValueByKeys(
      raw,
      [
        "ticker_sentiment",
        "ticker_results",
        "ticker_analysis",
        "ticker_breakdown",
      ],
    )
    ?? {};


  const byTicker = {};


  if (Array.isArray(candidate)) {

    for (const item of candidate) {

      const ticker =
        String(
          item?.ticker
          ?? item?.symbol
          ?? ""
        )
          .trim()
          .toUpperCase();


      if (ticker) {
        byTicker[ticker] =
          normaliseTickerSentiment(
            ticker,
            item,
          );
      }
    }

  } else if (
    candidate
    && typeof candidate === "object"
  ) {

    for (
      const [
        ticker,
        item,
      ]
      of Object.entries(candidate)
    ) {

      const clean =
        String(ticker)
          .trim()
          .toUpperCase();


      if (clean) {
        byTicker[clean] =
          normaliseTickerSentiment(
            clean,
            item,
          );
      }
    }
  }


  return {
    portfolio,
    byTicker,
  };
}


function clamp(
  value,
  minimum,
  maximum,
) {

  return Math.min(
    Math.max(
      value,
      minimum,
    ),
    maximum,
  );
}


export function scoreRisk(
  risk,
) {

  const values = [];


  if (
    risk.volatility !== null
  ) {

    const vol =
      risk.volatility;

    let score;

    if (vol <= 0.15) {
      score = 92;

    } else if (vol <= 0.25) {
      score =
        92
        - (
          (vol - 0.15)
          / 0.10
        )
        * 20;

    } else if (vol <= 0.35) {
      score =
        72
        - (
          (vol - 0.25)
          / 0.10
        )
        * 22;

    } else {
      score = 35;
    }


    values.push(
      clamp(
        score,
        30,
        95,
      ),
    );
  }


  if (
    risk.drawdown !== null
  ) {

    const magnitude =
      Math.abs(
        risk.drawdown
      );


    if (magnitude <= 0.15) {
      values.push(92);

    } else if (magnitude <= 0.25) {
      values.push(75);

    } else if (magnitude <= 0.35) {
      values.push(55);

    } else {
      values.push(35);
    }
  }


  if (!values.length) {
    return null;
  }


  return Math.round(
    values.reduce(
      (total, value) =>
        total + value,
      0,
    )
    / values.length,
  );
}


export function scoreConcentration(
  market,
) {

  const holdings =
    market?.holdings
    ?? [];


  /*
   * Concentration must describe the complete
   * current portfolio, not only the subset for
   * which valuation / FX conversion succeeded.
   */
  if (
    !holdings.length
    || market?.fx_complete !== true
  ) {
    return null;
  }


  const weights =
    holdings
      .map(
        (holding) => {

          if (
            holding?.status !== "live"
            || holding?.weight === null
            || holding?.weight === undefined
          ) {
            return null;
          }


          const value =
            Number(
              holding.weight
            );


          return (
            Number.isFinite(
              value
            )
            && value >= 0
          )
            ? value
            : null;
        }
      )
      .filter(
        (value) =>
          value !== null
      );


  if (
    weights.length
    !== holdings.length
  ) {
    return null;
  }


  const totalWeight =
    weights.reduce(
      (
        total,
        weight,
      ) =>
        total + weight,
      0
    );


  if (
    !Number.isFinite(
      totalWeight
    )
    || totalWeight <= 0
  ) {
    return null;
  }


  const normalisedWeights =
    weights.map(
      (weight) =>
        weight
        / totalWeight
    );


  const largest =
    Math.max(
      ...normalisedWeights
    );


  const hhi =
    normalisedWeights.reduce(
      (
        total,
        weight,
      ) =>
        total
        + weight * weight,
      0
    );


  const score =
    100
    - Math.max(
        0,
        largest - 0.25
      )
      * 115
    - Math.max(
        0,
        hhi - 0.25
      )
      * 70;


  return Math.round(
    clamp(
      score,
      30,
      95,
    )
  );
}


export function scoreSentiment(
  sentiment,
) {

  const rawScore =
    sentiment
      ?.portfolio
      ?.score;

  const rawConfidence =
    sentiment
      ?.portfolio
      ?.confidence;


  if (
    rawScore === null
    || rawScore === undefined
    || rawConfidence === null
    || rawConfidence === undefined
  ) {
    return null;
  }


  const score =
    Number(
      rawScore
    );

  const confidence =
    Number(
      rawConfidence
    );


  if (
    !Number.isFinite(
      score
    )
    || !Number.isFinite(
      confidence
    )
  ) {
    return null;
  }


  /*
   * Low-confidence sentiment remains useful
   * context, but it must not influence the
   * portfolio-health score.
   */
  if (
    confidence < 0.55
  ) {
    return null;
  }


  if (
    Math.abs(
      score
    ) < 0.15
  ) {
    return 60;
  }


  return Math.round(
    clamp(
      65
      + (
          score
          * 35
          * confidence
        ),
      35,
      90,
    )
  );
}


export function buildRetailHealth(
  market,
  rawRisk,
  rawSentiment,
) {

  if (!market) {
    return null;
  }


  const risk =
    extractRetailRisk(
      rawRisk
    );


  const sentiment =
    extractRetailSentiment(
      rawSentiment
    );


  const riskScore =
    scoreRisk(
      risk
    );

  const concentrationScore =
    scoreConcentration(
      market
    );

  const sentimentScore =
    scoreSentiment(
      sentiment
    );


  /*
   * Risk and complete concentration coverage
   * are mandatory for Portfolio Health.
   */
  if (
    riskScore === null
    || concentrationScore === null
  ) {
    return null;
  }


  const nominalWeights = {
    risk:
      0.45,

    concentration:
      0.40,

    sentiment:
      0.15,
  };


  const weighted = [
    [
      "risk",
      riskScore,
      nominalWeights.risk,
    ],

    [
      "concentration",
      concentrationScore,
      nominalWeights
        .concentration,
    ],
  ];


  if (
    sentimentScore !== null
  ) {

    weighted.push(
      [
        "sentiment",
        sentimentScore,
        nominalWeights
          .sentiment,
      ]
    );

  }


  const totalWeight =
    weighted.reduce(
      (
        total,
        item,
      ) =>
        total + item[2],
      0
    );


  const overall =
    Math.round(
      weighted.reduce(
        (
          total,
          [
            ,
            value,
            weight,
          ],
        ) =>
          total
          + value * weight,
        0
      )
      / totalWeight
    );


  const effectiveWeights = {
    risk:
      nominalWeights.risk
      / totalWeight,

    concentration:
      nominalWeights
        .concentration
      / totalWeight,

    sentiment:
      sentimentScore !== null
        ? (
            nominalWeights
              .sentiment
            / totalWeight
          )
        : 0,
  };


  const rawSentimentScore =
    sentiment
      ?.portfolio
      ?.score;

  const rawSentimentConfidence =
    sentiment
      ?.portfolio
      ?.confidence;


  let sentimentExclusion =
    null;


  if (
    sentimentScore === null
  ) {

    const scoreAvailable =
      rawSentimentScore
      !== null
      && rawSentimentScore
      !== undefined
      && Number.isFinite(
        Number(
          rawSentimentScore
        )
      );


    const confidenceAvailable =
      rawSentimentConfidence
      !== null
      && rawSentimentConfidence
      !== undefined
      && Number.isFinite(
        Number(
          rawSentimentConfidence
        )
      );


    if (
      scoreAvailable
      && confidenceAvailable
      && Number(
        rawSentimentConfidence
      ) < 0.55
    ) {

      sentimentExclusion =
        "low_confidence";

    } else {

      sentimentExclusion =
        "unavailable";

    }

  }


  const label =
    overall >= 85
      ? "Strong"
      : overall >= 75
        ? "Healthy"
        : overall >= 55
          ? "Moderate"
          : "Needs attention";


  return {
    overall,
    label,

    components: {
      risk:
        riskScore,

      concentration:
        concentrationScore,

      sentiment:
        sentimentScore,
    },

    nominalWeights,

    effectiveWeights,

    scoreCoverage:
      Number(
        totalWeight
          .toFixed(
            4
          )
      ),

    sentimentIncluded:
      sentimentScore !== null,

    exclusions: {
      sentiment:
        sentimentExclusion,
    },
  };
}


export function componentLabel(
  value,
) {

  if (
    value === null
    || value === undefined
  ) {
    return "Awaiting data";
  }


  if (value >= 85) {
    return "Strong";
  }

  if (value >= 70) {
    return "Healthy";
  }

  if (value >= 55) {
    return "Moderate";
  }

  return "Needs attention";
}


export function percentage(
  value,
  digits = 1,
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {
    return "—";
  }


  return (
    `${(
      number * 100
    ).toFixed(digits)}%`
  );
}


export function buildRetailFlags(
  market,
  rawRisk,
  rawSentiment,
) {

  const flags = [];


  if (
    market?.fx_complete
    === true
  ) {

    const weights =
      (
        market?.holdings
        ?? []
      )
        .filter(
          (holding) =>
            holding?.status
            === "live"
            && holding?.weight
              !== null
            && holding?.weight
              !== undefined
        )
        .map(
          (holding) =>
            Number(
              holding.weight
            )
        )
        .filter(
          Number.isFinite
        );


    if (
      weights.length
      && weights.length
        === (
          market?.holdings
          ?? []
        ).length
    ) {

      const largest =
        Math.max(
          ...weights
        );


      if (
        largest > 0.50
      ) {

        flags.push({
          type:
            "red",

          title:
            "High position concentration",

          detail:
            "One holding represents more than half of your current portfolio value.",
        });

      } else if (
        largest > 0.35
      ) {

        flags.push({
          type:
            "amber",

          title:
            "Position concentration",

          detail:
            "Your largest holding represents more than 35% of your current portfolio value.",
        });

      } else {

        flags.push({
          type:
            "green",

          title:
            "Position sizes diversified",

          detail:
            "No individual holding currently represents more than 35% of your portfolio.",
        });

      }

    }

  }


  const risk =
    extractRetailRisk(
      rawRisk
    );


  if (
    risk.volatility !== null
  ) {

    if (
      risk.volatility > 0.35
    ) {

      flags.push({
        type: "red",
        title:
          "High historical volatility",
        detail:
          "Your portfolio has historically experienced large price movements.",
      });

    } else if (
      risk.volatility > 0.25
    ) {

      flags.push({
        type: "amber",
        title:
          "Elevated historical volatility",
        detail:
          "Your portfolio has experienced above-moderate historical price movement.",
      });

    } else {

      flags.push({
        type: "green",
        title:
          "Moderate historical volatility",
        detail:
          "Historical volatility is currently below 25% annualised.",
      });
    }
  }


  if (
    risk.drawdown !== null
  ) {

    if (
      risk.drawdown < -0.30
    ) {

      flags.push({
        type: "red",
        title:
          "Large historical drawdown",
        detail:
          "The historical sample contains a peak-to-trough decline greater than 30%.",
      });

    } else if (
      risk.drawdown < -0.20
    ) {

      flags.push({
        type: "amber",
        title:
          "Meaningful historical drawdown",
        detail:
          "The historical sample includes a peak-to-trough decline greater than 20%.",
      });

    } else {

      flags.push({
        type: "green",
        title:
          "Contained historical drawdown",
        detail:
          "Historical peak-to-trough loss remained below 20%.",
      });
    }
  }


  const sentiment =
    extractRetailSentiment(
      rawSentiment
    );


  if (
    sentiment
      .portfolio
      .score
    !== null
    &&
    sentiment
      .portfolio
      .confidence
    !== null
  ) {

    if (
      sentiment
        .portfolio
        .score
      < -0.15
      &&
      sentiment
        .portfolio
        .confidence
      >= 0.55
    ) {

      flags.push({
        type: "red",
        title:
          "Negative news sentiment",
        detail:
          "Recent portfolio news sentiment is negative with meaningful model confidence.",
      });

    } else if (
      Math.abs(
        sentiment
          .portfolio
          .score
      )
      < 0.15
      ||
      sentiment
        .portfolio
        .confidence
      < 0.55
    ) {

      flags.push({
        type: "amber",
        title:
          "Mixed or uncertain sentiment",
        detail:
          "Recent news does not currently provide a strong directional signal.",
      });

    } else {

      flags.push({
        type: "green",
        title:
          "Supportive news sentiment",
        detail:
          "Recent portfolio news sentiment is positive with meaningful confidence.",
      });
    }
  }


  if (
    market?.fx_complete
  ) {

    flags.push({
      type: "green",
      title:
        "Currency conversion complete",
      detail:
        "Current portfolio values have been converted into your selected display currency.",
    });

  } else {

    flags.push({
      type: "amber",
      title:
        "FX conversion incomplete",
      detail:
        "Some holdings could not be converted into your selected display currency.",
    });
  }


  return flags;
}
