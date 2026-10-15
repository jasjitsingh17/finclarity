import { API_BASE_URL } from "../lib/apiBase";
import {
  Building2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import "./RetailTickerCompany.css";


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
    value < 24
  ) {
    return `${Math.max(
      1,
      Math.round(value)
    )}h ago`;
  }


  const days =
    Math.round(
      value / 24
    );


  if (
    days < 31
  ) {
    return `${days}d ago`;
  }


  const months =
    Math.round(
      days / 30
    );


  return `${months}mo ago`;
}


function RetailTickerCompany({
  ticker,
}) {

  const [
    state,
    setState,
  ] =
    useState({
      loading:
        true,

      items:
        [],

      company:
        null,

      domain:
        null,

      error:
        null,
    });


  useEffect(
    () => {

      let cancelled =
        false;


      async function load() {

        try {

          const response =
            await fetch(
              `${API_BASE_URL}/api/company/${
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


          if (
            cancelled
          ) {
            return;
          }


          setState({
            loading:
              false,

            items:
              payload?.items
              ?? [],

            company:
              payload?.company
              ?? ticker,

            domain:
              payload?.domain
              ?? null,

            error:
              payload?.error
              ?? null,
          });

        } catch (error) {

          if (
            cancelled
          ) {
            return;
          }


          setState({
            loading:
              false,

            items:
              [],

            company:
              ticker,

            domain:
              null,

            error:
              error?.message
              ?? "Unable to retrieve company evidence.",
          });

        }

      }


      load();


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
      <div className="retail-company-state">

        <Building2 size={20} />

        <div>

          <strong>
            Loading company intelligence…
          </strong>

          <p>
            Searching first-party corporate updates for {ticker}.
          </p>

        </div>

      </div>
    );

  }


  if (
    state.error
  ) {

    return (
      <div className="retail-company-state warning">

        <Building2 size={20} />

        <div>

          <strong>
            Company source unavailable
          </strong>

          <p>
            First-party company evidence could not be retrieved. Independent news and regulatory evidence remain available.
          </p>

        </div>

      </div>
    );

  }


  if (
    !state.items.length
  ) {

    return (
      <div className="retail-company-state">

        <Building2 size={20} />

        <div>

          <strong>
            No material first-party updates found
          </strong>

          <p>
            FinClarity found no sufficiently investor-relevant corporate announcements for {ticker} in the current lookback window.
          </p>

        </div>

      </div>
    );

  }


  return (
    <div className="retail-company-workspace">

      <div className="retail-company-heading">

        <div>

          <span>
            FIRST-PARTY EVIDENCE
          </span>

          <h3>
            Company & Investor Relations
          </h3>

          <p>
            Investor-relevant corporate communications from {state.company}.
          </p>

        </div>


        <div className="retail-company-count">

          <strong>
            {
              state.items.length
            }
          </strong>

          <span>
            updates
          </span>

        </div>

      </div>


      <div className="retail-company-list">

        {
          state.items.map(
            (
              item,
              index,
            ) => (

              <article
                className="retail-company-card"
                key={
                  `${
                    item.title
                  }-${index}`
                }
              >

                <div className="retail-company-icon">

                  <Building2
                    size={17}
                  />

                </div>


                <div className="retail-company-main">

                  <div className="retail-company-meta">

                    <span className="retail-company-category">
                      {
                        item.category
                        ?? "Corporate Update"
                      }
                    </span>

                    <span>
                      {
                        ageText(
                          item.age_hours
                        )
                      }
                    </span>

                    <span>
                      {
                        item.company_domain
                        ?? state.domain
                        ?? "Official company source"
                      }
                    </span>

                  </div>


                  <h4>
                    {item.title}
                  </h4>


                  <p>
                    First-party company evidence. It is displayed separately from independent-news sentiment.
                  </p>

                </div>


                {
                  item.link
                  && (

                    <a
                      href={
                        item.link
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label={
                        `Open ${item.title}`
                      }
                    >
                      <ExternalLink
                        size={17}
                      />
                    </a>

                  )
                }

              </article>

            )
          )
        }

      </div>


      <div className="retail-company-methodology">

        <ShieldCheck size={15} />

        <div>

          <strong>
            First-party evidence
          </strong>

          <p>
            Corporate communications are useful context but may reflect management framing, so they are excluded from FinClarity's independent-news sentiment aggregate.
          </p>

        </div>

      </div>

    </div>
  );
}


export default RetailTickerCompany;
