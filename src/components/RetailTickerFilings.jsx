import { API_BASE_URL } from "../lib/apiBase";
import {
  ExternalLink,
  FileText,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import "./RetailTickerFilings.css";


function filingAge(
  ageHours,
) {

  const hours =
    Number(
      ageHours
    );


  if (
    !Number.isFinite(
      hours
    )
  ) {
    return "Recent";
  }


  const days =
    Math.floor(
      hours / 24
    );


  if (
    days < 1
  ) {
    return "Today";
  }


  if (
    days === 1
  ) {
    return "1 day ago";
  }


  if (
    days < 31
  ) {
    return `${days} days ago`;
  }


  const months =
    Math.round(
      days / 30
    );


  return (
    `${months} ${
      months === 1
        ? "month"
        : "months"
    } ago`
  );
}


function filingImportance(
  form,
) {

  switch (
    String(
      form
      ?? ""
    ).toUpperCase()
  ) {

    case "10-K":
    case "20-F":
    case "40-F":
      return {
        label:
          "Annual disclosure",

        className:
          "annual",
      };


    case "10-Q":
      return {
        label:
          "Quarterly disclosure",

        className:
          "quarterly",
      };


    case "8-K":
    case "6-K":
      return {
        label:
          "Material event",

        className:
          "event",
      };


    default:
      return {
        label:
          "Regulatory filing",

        className:
          "other",
      };

  }
}


function RetailTickerFilings({
  ticker,
}) {

  const [
    state,
    setState,
  ] =
    useState({
      loading:
        true,

      filings:
        [],

      error:
        null,
    });


  useEffect(
    () => {

      let cancelled =
        false;


      async function loadFilings() {

        try {

          const response =
            await fetch(
              `${API_BASE_URL}/api/filings/${
                encodeURIComponent(
                  ticker
                )
              }?max_items=6`
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


          if (cancelled) {
            return;
          }


          setState({
            loading:
              false,

            filings:
              payload
                ?.filings
              ?? [],

            error:
              payload
                ?.error
              ?? null,
          });

        } catch (error) {

          if (cancelled) {
            return;
          }


          setState({
            loading:
              false,

            filings:
              [],

            error:
              error
                ?.message
              ?? "Unable to retrieve filings.",
          });

        }

      }


      loadFilings();


      return () => {

        cancelled =
          true;

      };

    },
    [
      ticker,
    ]
  );


  if (
    state.loading
  ) {

    return (
      <div className="retail-filings-state">

        <FileText size={20} />

        <div>

          <strong>
            Loading official filings…
          </strong>

          <p>
            Retrieving recent regulatory disclosures for {ticker}.
          </p>

        </div>

      </div>
    );

  }


  if (
    state.error
  ) {

    return (
      <div className="retail-filings-state warning">

        <FileText size={20} />

        <div>

          <strong>
            Filing source unavailable
          </strong>

          <p>
            SEC evidence could not be retrieved right now. News sentiment remains unaffected.
          </p>

        </div>

      </div>
    );

  }


  if (
    !state.filings.length
  ) {

    return (
      <div className="retail-filings-state">

        <FileText size={20} />

        <div>

          <strong>
            No SEC filing feed for this listing
          </strong>

          <p>
            {ticker} may not be a directly US-listed security, or no supported recent SEC filings were found.
          </p>

        </div>

      </div>
    );

  }


  return (
    <div className="retail-filings-workspace">

      <div className="retail-filings-heading">

        <div>

          <span>
            OFFICIAL DISCLOSURES
          </span>

          <h3>
            Recent SEC Filings
          </h3>

          <p>
            Primary-source regulatory evidence for {ticker}.
          </p>

        </div>


        <div className="retail-filings-count">

          <strong>
            {
              state
                .filings
                .length
            }
          </strong>

          <span>
            filings
          </span>

        </div>

      </div>


      <div className="retail-filings-list">

        {
          state
            .filings
            .map(
              (
                filing,
                index,
              ) => {

                const type =
                  filingImportance(
                    filing.form
                  );


                return (

                  <article
                    className="retail-filing-card"
                    key={
                      `${
                        filing.form
                      }-${
                        filing.filed_at
                      }-${index}`
                    }
                  >

                    <div className="retail-filing-icon">

                      <FileText
                        size={17}
                      />

                    </div>


                    <div className="retail-filing-main">

                      <div className="retail-filing-meta">

                        <span
                          className={
                            `retail-filing-form ${
                              type.className
                            }`
                          }
                        >
                          {
                            filing.form
                          }
                        </span>


                        <span>
                          {
                            type.label
                          }
                        </span>


                        <span>
                          {
                            filing.filed_at
                          }
                        </span>


                        <span>
                          {
                            filingAge(
                              filing.age_hours
                            )
                          }
                        </span>


                        <span>
                          SEC EDGAR
                        </span>

                      </div>


                      <h4>
                        {
                          filing.title
                        }
                      </h4>


                      <p>
                        Official regulatory evidence. This filing is not classified as positive or negative sentiment.
                      </p>

                    </div>


                    {
                      filing.link
                      && (

                        <a
                          href={
                            filing.link
                          }
                          target="_blank"
                          rel="noreferrer"
                          aria-label={
                            `Open ${filing.form} filing`
                          }
                        >
                          <ExternalLink
                            size={17}
                          />
                        </a>

                      )
                    }

                  </article>

                );

              }
            )
        }

      </div>


      <div className="retail-filing-methodology">

        <ShieldCheck
          size={15}
        />

        <div>

          <strong>
            Primary-source evidence
          </strong>

          <p>
            SEC filings are displayed as regulatory context and are deliberately excluded from FinBERT sentiment scores.
          </p>

        </div>

      </div>

    </div>
  );
}


export default RetailTickerFilings;
