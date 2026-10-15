import {
  ArrowUpRight,
  Globe2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import useGlobalMarkets
  from "../hooks/useGlobalMarkets";

import "./GlobalMarketLanding.css";


function formatPrice(
  quote,
) {

  const price =
    Number(
      quote?.price
    );


  if (
    !Number.isFinite(
      price
    )
  ) {

    return "—";
  }




  const prefixes = {
    USD: "$",
    EUR: "€",
    INR: "₹",
    JPY: "¥",
    HKD: "HK$",
    GBP: "£",
  };


  return (
    (
      prefixes[
        quote?.currency
      ]
      ?? `${
        quote?.currency
        || ""
      } `
    )
    + price.toLocaleString(
      "en-GB",
      {
        minimumFractionDigits:
          price >= 1000
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      }
    )
  );
}


function GlobalMarketLeadersPreview() {

  const {
    data,
    loading,
    error,
  } = useGlobalMarkets();


  const markets =
    data?.markets
      ?.filter(
        (market) =>
          market.leaders
          ?.length
      )
    ?? [];


  const updated =
    data?.generated_at
      ? new Date(
          data.generated_at
        ).toLocaleTimeString(
          [],
          {
            hour:
              "2-digit",

            minute:
              "2-digit",
          }
        )
      : null;


  return (
    <section className="landing-global-leaders">

      <div className="landing-global-leaders-heading">

        <div>

          <span>
            GLOBAL MARKET PULSE
          </span>

          <h2>
            Leaders across major markets
          </h2>

          <p>
            A quick view of leading performers
            from FinClarity's curated liquid
            large-cap universe.
          </p>

        </div>


        <div className="landing-global-leaders-meta">

          <Globe2 size={16} />

          <div>

            <strong>
              {
                data
                  ? `${data.quote_count}/${data.tracked_count}`
                  : "—"
              }
            </strong>

            <span>
              global quotes
            </span>

          </div>

        </div>

      </div>


      {
        loading
        && !data
          ? (

            <div className="landing-global-leaders-loading">
              Loading global market leaders...
            </div>

          )
          : error
            && !data
              ? (

                <div className="landing-global-leaders-loading">
                  {error}
                </div>

              )
              : (

                <div className="landing-global-leaders-grid">

                  {
                    markets.map(
                      (market) => {

                        const leader =
                          market.leaders[0];


                        const positive =
                          Number(
                            leader.change_percent
                          ) >= 0;


                        return (

                          <article
                            className="landing-global-leader-card"
                            key={
                              market.market_code
                            }
                          >

                            <div className="landing-global-leader-market">

                              <span>
                                {market.flag}
                              </span>

                              <div>

                                <strong>
                                  {
                                    market.country
                                  }
                                </strong>

                                <small>
                                  {
                                    market.exchange
                                  }
                                </small>

                              </div>

                            </div>


                            <div className="landing-global-leader-stock">

                              <div>

                                <strong>
                                  {
                                    leader.ticker
                                  }
                                </strong>

                                <span>
                                  {
                                    leader.company
                                  }
                                </span>

                              </div>


                              <ArrowUpRight
                                size={15}
                              />

                            </div>


                            <div className="landing-global-leader-bottom">

                              <strong>
                                {
                                  formatPrice(
                                    leader
                                  )
                                }
                              </strong>


                              <span
                                className={
                                  positive
                                    ? "positive"
                                    : "negative"
                                }
                              >

                                {
                                  positive
                                    ? (
                                      <TrendingUp
                                        size={12}
                                      />
                                    )
                                    : (
                                      <TrendingDown
                                        size={12}
                                      />
                                    )
                                }

                                {
                                  `${
                                    positive
                                      ? "+"
                                      : ""
                                  }${
                                    Number(
                                      leader.change_percent
                                    ).toFixed(2)
                                  }%`
                                }

                              </span>

                            </div>

                          </article>

                        );
                      }
                    )
                  }

                </div>

              )
      }


      <div className="landing-global-market-note">

        <span>
          Auto-refreshes every 60 seconds.
        </span>

        <span>
          Quotes may be delayed and closed
          markets show the latest available
          trading session.
        </span>

        {
          updated
          && (

            <span>
              Last refresh: {updated}
            </span>

          )
        }

      </div>

    </section>
  );
}


export default GlobalMarketLeadersPreview;
