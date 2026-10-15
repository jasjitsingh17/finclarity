import { API_BASE_URL } from "../lib/apiBase";
import {
  Activity,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import "./RetailMarketTape.css";


const API_URL = `${API_BASE_URL}/api/markets/global-overview`;


function extractQuotes(
  payload,
) {

  const candidate =
    payload?.global_leaders
    ?? payload?.leaders
    ?? payload?.quotes
    ?? payload?.data
    ?? [];


  return Array.isArray(
    candidate
  )
    ? candidate
    : [];
}


function formatPrice(
  quote,
) {

  if (
    quote?.formatted_price
  ) {
    return quote.formatted_price;
  }


  if (
    quote?.display_price
  ) {
    return quote.display_price;
  }


  let value =
    Number(
      quote?.price
    );


  if (
    !Number.isFinite(
      value
    )
  ) {
    return "—";
  }


  const ticker =
    String(
      quote?.ticker
      ?? ""
    )
      .toUpperCase();


  const currency =
    String(
      quote?.currency
      ?? "USD"
    )
      .toUpperCase();


  /*
   * Yahoo/LSE commonly reports London equities
   * in GBp (pence). Convert to GBP for display.
   */
  if (
    ticker.endsWith(".L")
    && currency === "GBP"
  ) {

    value =
      value / 100;
  }


  const options = {
    minimumFractionDigits:
      currency === "JPY"
        ? 0
        : 2,

    maximumFractionDigits:
      currency === "JPY"
        ? 0
        : 2,
  };


  const number =
    value.toLocaleString(
      "en-GB",
      options,
    );


  const symbols = {
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


  return (
    `${symbols[currency] ?? `${currency} `}${number}`
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
    `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`
  );
}


function RetailMarketTape() {

  const [
    quotes,
    setQuotes,
  ] =
    useState([]);


  const [
    status,
    setStatus,
  ] =
    useState(
      "loading"
    );


  useEffect(
    () => {

      let cancelled =
        false;


      async function load() {

        try {

          const response =
            await fetch(
              API_URL
            );


          if (
            !response.ok
          ) {
            throw new Error(
              `HTTP ${response.status}`
            );
          }


          const payload =
            await response.json();


          if (
            cancelled
          ) {
            return;
          }


          const items =
            extractQuotes(
              payload
            );


          setQuotes(
            items
          );


          setStatus(
            items.length
              ? "live"
              : "unavailable"
          );

        } catch {

          if (
            !cancelled
          ) {
            setStatus(
              "unavailable"
            );
          }
        }
      }


      load();


      const interval =
        window.setInterval(
          load,
          60000,
        );


      return () => {

        cancelled = true;

        window.clearInterval(
          interval
        );
      };
    },
    []
  );


  if (
    status === "unavailable"
    && !quotes.length
  ) {

    return (
      <section className="retail-market-tape unavailable">

        <div className="retail-market-tape-label">

          <Activity size={14} />

          <strong>
            GLOBAL MARKET PULSE
          </strong>

        </div>


        <span>
          Market quotes temporarily unavailable
        </span>

      </section>
    );
  }


  /*
   * Safari can initialise the CSS transform animation
   * while this max-content track has zero width.
   *
   * Mount the animated track only after market quotes
   * exist so its initial animation geometry is correct.
   */
  if (
    !quotes.length
  ) {

    return (
      <section className="retail-market-tape">

        <div className="retail-market-tape-label">

          <span className="retail-market-live-dot" />

          <strong>
            GLOBAL MARKET PULSE
          </strong>

        </div>


        <div
          className="retail-market-tape-window"
          aria-hidden="true"
        />


        <div className="retail-market-delay">
          LOADING...
        </div>

      </section>
    );

  }


  const repeated =
    [
      ...quotes,
      ...quotes,
    ];


  return (
    <section className="retail-market-tape">

      <div className="retail-market-tape-label">

        <span className="retail-market-live-dot" />

        <strong>
          GLOBAL MARKET PULSE
        </strong>

      </div>


      <div className="retail-market-tape-window">

        <div
          className="retail-market-tape-track"
          key={
            quotes
              .map(
                (quote) =>
                  quote?.ticker
                  ?? ""
              )
              .join("|")
          }
        >

          {
            repeated.map(
              (
                quote,
                index,
              ) => {

                const change =
                  Number(
                    quote
                      ?.change_percent
                  );


                const positive =
                  Number.isFinite(
                    change
                  )
                  && change >= 0;


                return (
                  <div
                    className="retail-market-quote"
                    key={
                      `${quote?.ticker ?? "quote"}-${index}`
                    }
                    aria-hidden={
                      index
                      >= quotes.length
                    }
                  >

                    {
                      quote?.flag
                      && (

                        <span className="retail-market-flag">
                          {quote.flag}
                        </span>

                      )
                    }


                    <strong>
                      {
                        quote?.ticker
                        ?? "—"
                      }
                    </strong>


                    <span className="retail-market-price">
                      {
                        formatPrice(
                          quote
                        )
                      }
                    </span>


                    <span
                      className={
                        positive
                          ? "retail-market-change positive"
                          : "retail-market-change negative"
                      }
                    >
                      {
                        formatChange(
                          quote
                            ?.change_percent
                        )
                      }
                    </span>


                    <span className="retail-market-divider">
                      •
                    </span>

                  </div>
                );
              }
            )
          }

        </div>

      </div>


      <div className="retail-market-delay">
        LIVE / DELAYED
      </div>

    </section>
  );
}


export default RetailMarketTape;
