import {
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

  const number =
    Number(
      quote?.price
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return "—";
  }


  /*
   * London Stock Exchange Yahoo prices
   * are commonly expressed in pence.
   */



  const prefixes = {
    USD: "$",
    GBP: "£",
    EUR: "€",
    INR: "₹",
    JPY: "¥",
    HKD: "HK$",
    CHF: "CHF ",
    CAD: "C$",
    AUD: "A$",
  };


  const prefix =
    prefixes[
      quote?.currency
    ]
    ?? `${
      quote?.currency
      || ""
    } `;


  return (
    prefix
    + number.toLocaleString(
      "en-GB",
      {
        minimumFractionDigits:
          number >= 1000
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      }
    )
  );
}


function formatChange(
  value,
) {

  const number =
    Number(value);


  if (
    !Number.isFinite(
      number
    )
  ) {

    return "—";
  }


  return (
    `${number >= 0 ? "+" : ""}`
    + `${number.toFixed(2)}%`
  );
}


function QuoteItems({
  quotes,
  hidden = false,
}) {

  return (
    <div
      className="landing-market-tape-group"
      aria-hidden={
        hidden
          ? "true"
          : undefined
      }
    >

      {
        quotes.map(
          (quote) => {

            const positive =
              Number(
                quote.change_percent
              ) >= 0;


            return (

              <div
                className="landing-market-tape-item"
                key={
                  `${
                    hidden
                      ? "copy-"
                      : ""
                  }${quote.ticker}`
                }
              >

                <span className="landing-market-flag">
                  {quote.flag}
                </span>


                <strong>
                  {quote.ticker}
                </strong>


                <span className="landing-market-price">
                  {
                    formatPrice(
                      quote
                    )
                  }
                </span>


                <span
                  className={
                    `landing-market-change ${
                      positive
                        ? "positive"
                        : "negative"
                    }`
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
                    formatChange(
                      quote.change_percent
                    )
                  }

                </span>

              </div>

            );
          }
        )
      }

    </div>
  );
}


function GlobalMarketTape() {

  const {
    data,
    loading,
    error,
  } = useGlobalMarkets();


  const quotes =
    data?.global_leaders
    ?? [];


  return (
    <section className="landing-market-tape-shell">

      <div className="landing-market-tape-label">

        <Globe2 size={16} />

        <div>

          <strong>
            GLOBAL EQUITIES
          </strong>

          <span>
            LIVE / NEAR-REAL-TIME
          </span>

        </div>

      </div>


      <div className="landing-market-tape-window">

        {
          quotes.length
            ? (

              <div className="landing-market-tape-track">

                <QuoteItems
                  quotes={quotes}
                />

                <QuoteItems
                  quotes={quotes}
                  hidden
                />

              </div>

            )
            : (

              <div className="landing-market-tape-placeholder">

                {
                  loading
                    ? "Loading global market data..."
                    : (
                      error
                      || "Market data unavailable."
                    )
                }

              </div>

            )
        }

      </div>


      <div className="landing-market-status">

        <i
          className={
            data?.status
            === "live"
              ? "live"
              : "partial"
          }
        />

        {
          data?.status
          === "live"
            ? "LIVE"
            : data
              ? "PARTIAL"
              : "DATA"
        }

      </div>

    </section>
  );
}


export default GlobalMarketTape;
