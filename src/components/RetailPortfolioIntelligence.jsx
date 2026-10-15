import {
  ArrowRight,
  ExternalLink,
  Newspaper,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import useRetailPortfolio
  from "../hooks/useRetailPortfolio";

import {
  readRetailAnalysisCache,
} from "../lib/retailAnalysisCache";

import "./RetailPortfolioIntelligence.css";


function articleStrength(
  article,
) {

  const relevance =
    Number(
      article
        ?.relevance_score
      ?? 0
    );

  const source =
    Number(
      article
        ?.source_weight
      ?? 0
    );

  const recency =
    Number(
      article
        ?.recency_weight
      ?? 0
    );

  const confidence =
    Number(
      article
        ?.sentiment
        ?.model_confidence
      ?? 0
    );

  const score =
    Math.abs(
      Number(
        article
          ?.sentiment
          ?.sentiment_score
        ?? 0
      )
    );


  return (
    relevance
    * source
    * recency
    * (
      0.6
      + 0.4
      * confidence
    )
    * (
      0.75
      + Math.min(
          score,
          1
        )
    )
  );
}


function tone(
  article,
) {

  const score =
    Number(
      article
        ?.sentiment
        ?.sentiment_score
    );

  const confidence =
    Number(
      article
        ?.sentiment
        ?.model_confidence
    );


  if (
    !Number.isFinite(score)
    || !Number.isFinite(confidence)
    || confidence < 0.55
  ) {
    return "neutral";
  }


  if (
    score >= 0.15
  ) {
    return "positive";
  }


  if (
    score <= -0.15
  ) {
    return "negative";
  }


  return "neutral";
}


function toneLabel(
  article,
) {

  const value =
    tone(
      article
    );


  if (
    value === "positive"
  ) {
    return "Positive";
  }


  if (
    value === "negative"
  ) {
    return "Negative";
  }


  return "Mixed";
}


function ageText(
  hours,
) {

  const value =
    Number(hours);


  if (
    !Number.isFinite(
      value
    )
  ) {
    return "Recent";
  }


  if (
    value < 1
  ) {
    return "<1h";
  }


  if (
    value < 24
  ) {
    return (
      `${Math.round(value)}h`
    );
  }


  return (
    `${Math.round(
      value / 24
    )}d`
  );
}


function RetailPortfolioIntelligence() {

  const portfolio =
    useRetailPortfolio();


  const cache =
    readRetailAnalysisCache(
      portfolio
    );


  if (
    cache?.status
    !== "current"
  ) {
    return null;
  }


  const sentiment =
    cache
      ?.result
      ?.sentiment;


  const articlesByTicker =
    sentiment
      ?.articles_by_ticker
    ?? {};


  const grouped =
    new Map();


  for (
    const [
      ticker,
      articles,
    ]
    of Object.entries(
      articlesByTicker
    )
  ) {

    for (
      const article
      of articles
    ) {

      const key =
        String(
          article.title
          ?? ""
        )
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            " "
          )
          .trim();


      if (!key) {
        continue;
      }


      const strength =
        articleStrength(
          article
        );


      const existing =
        grouped.get(
          key
        );


      if (
        !existing
      ) {

        grouped.set(
          key,
          {
            ...article,
            portfolioTickers:
              [ticker],
            strength,
          }
        );

        continue;
      }


      if (
        !existing
          .portfolioTickers
          .includes(
            ticker
          )
      ) {

        existing
          .portfolioTickers
          .push(
            ticker
          );
      }


      if (
        strength
        > existing.strength
      ) {

        grouped.set(
          key,
          {
            ...article,
            portfolioTickers:
              existing
                .portfolioTickers,
            strength,
          }
        );
      }
    }
  }


  const items =
    [
      ...grouped.values(),
    ]
      .sort(
        (
          left,
          right,
        ) =>
          right.strength
          - left.strength
      )
      .slice(
        0,
        4
      );


  if (
    !items.length
  ) {
    return null;
  }


  return (
    <section className="retail-portfolio-intelligence">

      <header>

        <div>

          <span>
            PORTFOLIO INTELLIGENCE
          </span>

          <h2>
            What is moving your holdings
          </h2>

          <p>
            Material recent developments ranked by relevance, source quality, recency and sentiment confidence.
          </p>

        </div>


        <Link
          to="/retail/sentiment"
        >
          View all intelligence
          <ArrowRight size={14} />
        </Link>

      </header>


      <div className="retail-intelligence-grid">

        {
          items.map(
            (
              article,
              index,
            ) => (

              <article
                key={
                  `${
                    article.title
                  }-${index}`
                }
                className={
                  tone(
                    article
                  )
                }
              >

                <div className="retail-intelligence-card-top">

                  <span className="retail-intelligence-tickers">

                    {
                      article
                        .portfolioTickers
                        .join(
                          " • "
                        )
                    }

                  </span>


                  <span
                    className={
                      `retail-intelligence-tone ${
                        tone(
                          article
                        )
                      }`
                    }
                  >
                    {
                      toneLabel(
                        article
                      )
                    }
                  </span>

                </div>


                <h3>
                  {
                    article.title
                  }
                </h3>


                <footer>

                  <span>
                    {
                      article.source
                      ?? "News"
                    }
                  </span>

                  <span>
                    {
                      ageText(
                        article
                          .age_hours
                      )
                    }
                  </span>

                  <span>
                    {
                      article.source_type
                      === "social"
                        ? "Social"
                        : "News"
                    }
                  </span>


                  {
                    article.link
                    && (

                      <a
                        href={
                          article.link
                        }
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open source"
                      >
                        <ExternalLink
                          size={13}
                        />
                      </a>

                    )
                  }

                </footer>

              </article>

            )
          )
        }

      </div>


      <div className="retail-intelligence-method">

        <Newspaper size={14} />

        News sentiment is research context, not a prediction of future returns.

      </div>

    </section>
  );
}


export default RetailPortfolioIntelligence;
