import { API_BASE_URL } from "../lib/apiBase";
import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  Globe2,
  Layers3,
  MapPinned,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import RetailSidebar
  from "../components/RetailSidebar";

import useRetailPortfolio
  from "../hooks/useRetailPortfolio";

import {
  readRetailMarketSnapshot,
} from "../lib/retailMarketSnapshot";

import "./RetailDashboardLive.css";
import "./RetailExposureIntelligence.css";


const API = API_BASE_URL;

const CACHE_KEY =
  "finclarity_retail_exposure_v1";


function readCache(
  signature,
) {

  if (
    !signature
    || typeof window
    === "undefined"
  ) {
    return null;
  }


  try {

    const raw =
      window.localStorage
        .getItem(
          CACHE_KEY
        );


    if (!raw) {
      return null;
    }


    const record =
      JSON.parse(
        raw
      );


    if (
      record?.version !== 1
      || record?.signature !== signature
      || !record?.result
    ) {
      return null;
    }


    return record;

  } catch {

    return null;

  }
}


function writeCache(
  signature,
  result,
) {

  const record = {
    version:
      1,

    signature,

    generatedAt:
      new Date()
        .toISOString(),

    result,
  };


  window.localStorage.setItem(
    CACHE_KEY,
    JSON.stringify(
      record
    )
  );


  return record;
}


function percent(
  value,
  digits = 1,
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
    `${(
      number * 100
    ).toFixed(
      digits
    )}%`
  );
}


function concentrationClass(
  level,
) {

  const clean =
    String(
      level
      ?? ""
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );


  if (
    [
      "very-high",
      "high",
      "moderate",
      "lower",
    ].includes(
      clean
    )
  ) {
    return clean;
  }


  return "unavailable";
}


function ExposureBars({
  title,
  description,
  icon: Icon,
  items,
  accent = "cyan",
}) {

  return (
    <article className="retail-exposure-panel">

      <header>

        <div>

          <Icon size={18} />

          <div>

            <h2>
              {title}
            </h2>

            <p>
              {description}
            </p>

          </div>

        </div>

      </header>


      <div className="retail-exposure-bars">

        {
          items.map(
            (
              item,
              index,
            ) => (

              <div
                className="retail-exposure-row"
                key={
                  `${item.name}-${index}`
                }
              >

                <div>

                  <strong>
                    {
                      item.name
                    }
                  </strong>

                  <span>
                    {
                      percent(
                        item.weight
                      )
                    }
                  </span>

                </div>


                <div className="retail-exposure-track">

                  <div
                    className={
                      `retail-exposure-fill ${accent} ${
                        item.name
                        === "Unavailable"
                          ? "unavailable"
                          : ""
                      }`
                    }
                    style={{
                      width:
                        `${Math.max(
                          2,
                          Number(
                            item.weight
                          )
                          * 100
                        )}%`,
                    }}
                  />

                </div>

              </div>

            )
          )
        }

      </div>

    </article>
  );
}


function RetailExposureIntelligence() {

  const portfolio =
    useRetailPortfolio();


  const snapshot =
    readRetailMarketSnapshot(
      portfolio
    );


  const market =
    snapshot?.market
    ?? null;


  const holdings =
    Array.isArray(
      market?.holdings
    )
      ? market.holdings
      : [];


  const analysable =
    holdings.filter(
      (holding) =>
        holding?.status
        === "live"
        && Number.isFinite(
          Number(
            holding?.weight
          )
        )
        && Number(
          holding?.weight
        ) > 0
    );


  const totalWeight =
    analysable.reduce(
      (
        total,
        holding,
      ) =>
        total
        + Number(
            holding.weight
          ),
      0
    );


  const request =
    (
      analysable.length >= 1
      && totalWeight > 0
    )
      ? {
          tickers:
            analysable.map(
              (holding) =>
                holding.ticker
            ),

          weights:
            analysable.map(
              (holding) =>
                Number(
                  holding.weight
                )
                / totalWeight
            ),
        }
      : null;


  const requestSignature =
    request
      ? JSON.stringify(
          request
        )
      : "";


  const initialCache =
    readCache(
      requestSignature
    );


  const [
    result,
    setResult,
  ] =
    useState(
      initialCache?.result
      ?? null
    );


  const [
    error,
    setError,
  ] =
    useState(
      null
    );


  const [
    refreshToken,
    setRefreshToken,
  ] =
    useState(
      0
    );


  const [
    generatedAt,
    setGeneratedAt,
  ] =
    useState(
      initialCache
        ?.generatedAt
      ?? null
    );


  const loading =
    Boolean(
      requestSignature
      && !result
      && !error
    );


  useEffect(
    () => {

      if (
        !requestSignature
      ) {
        return undefined;
      }


      if (
        refreshToken === 0
      ) {

        const cached =
          readCache(
            requestSignature
          );


        if (cached) {
          return undefined;
        }

      }


      let cancelled =
        false;


      async function run() {

        try {

          const response =
            await fetch(
              `${API}/api/exposure/analyse`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  requestSignature,
              }
            );


          const payload =
            await response.json();


          if (
            !response.ok
          ) {

            throw new Error(
              payload?.detail
              ?? "Exposure analysis failed."
            );

          }


          if (cancelled) {
            return;
          }


          const record =
            writeCache(
              requestSignature,
              payload
            );


          setResult(
            payload
          );

          setError(
            null
          );

          setGeneratedAt(
            record.generatedAt
          );

        } catch (runError) {

          if (cancelled) {
            return;
          }


          setError(
            runError?.message
            ?? "Exposure analysis failed."
          );

        }

      }


      run();


      return () => {

        cancelled =
          true;

      };

    },
    [
      requestSignature,
      refreshToken,
    ]
  );


  if (
    !requestSignature
  ) {

    return (
      <div className="retail-live-dashboard retail-exposure-page">

        <RetailSidebar
          active="exposure"
        />


        <main className="retail-live-main">

          <section className="retail-exposure-empty">

            <Layers3 size={34} />

            <h1>
              Exposure Intelligence
            </h1>

            <p>
              Run Portfolio Analysis first so FinClarity can use your current live portfolio weights.
            </p>

            <Link to="/retail">
              Go to Dashboard
            </Link>

          </section>

        </main>

      </div>
    );

  }


  const concentration =
    result?.concentration
    ?? {};


  const largestHolding =
    concentration
      ?.largest_holding;


  const largestSector =
    concentration
      ?.largest_sector;


  const largestCountry =
    concentration
      ?.largest_country;


  const largestCurrency =
    concentration
      ?.largest_currency;


  const unavailable =
    result?.unavailable_weight
    ?? {};


  const hasUnavailable =
    Object.values(
      unavailable
    ).some(
      (value) =>
        Number(value) > 0
    );


  return (
    <div className="retail-live-dashboard retail-exposure-page">

      <RetailSidebar
        active="exposure"
      />


      <main className="retail-live-main">

        <div className="retail-exposure-content">

          <header className="retail-exposure-header">

            <div>

              <span>
                PORTFOLIO EXPOSURE
              </span>

              <h1>
                Exposure Intelligence
              </h1>

              <p>
                Understand where your portfolio is concentrated across companies, sectors, industries, profile countries and trading currencies.
              </p>

            </div>


            <button
              type="button"
              onClick={
                () => {

                  setResult(
                    null
                  );

                  setError(
                    null
                  );

                  setRefreshToken(
                    (value) =>
                      value + 1
                  );

                }
              }
            >
              <RefreshCw size={15} />
              Refresh Analysis
            </button>

          </header>


          {
            error
            && (

              <div className="retail-exposure-error">

                <AlertTriangle size={16} />

                <span>
                  {error}
                </span>

              </div>

            )
          }


          {
            loading
            ? (

              <section className="retail-exposure-loading">

                <Layers3 size={28} />

                <strong>
                  Mapping portfolio exposures…
                </strong>

                <span>
                  Combining live portfolio weights with security metadata.
                </span>

              </section>

            )
            : result
            ? (

              <>

                <section className="retail-exposure-kpis">

                  <article>

                    <span>
                      Largest Holding
                    </span>

                    <strong>
                      {
                        largestHolding
                          ?.ticker
                        ?? "—"
                      }
                    </strong>

                    <small>
                      {
                        percent(
                          largestHolding
                            ?.weight
                        )
                      }
                      {" of portfolio"}
                    </small>

                  </article>


                  <article>

                    <span>
                      Top-Two Concentration
                    </span>

                    <strong>
                      {
                        percent(
                          concentration
                            ?.top_two_weight
                        )
                      }
                    </strong>

                    <small>
                      two largest positions combined
                    </small>

                  </article>


                  <article>

                    <span>
                      Largest Sector
                    </span>

                    <strong>
                      {
                        largestSector
                          ?.name
                        ?? "Unavailable"
                      }
                    </strong>

                    <small>
                      {
                        largestSector
                          ? percent(
                              largestSector
                                .weight
                            )
                          : "No classified exposure"
                      }
                    </small>

                  </article>


                  <article>

                    <span>
                      Effective Holdings
                    </span>

                    <strong>
                      {
                        Number(
                          concentration
                            ?.effective_holdings
                        ).toFixed(2)
                      }
                    </strong>

                    <small>
                      concentration-adjusted count
                    </small>

                  </article>

                </section>


                <section className="retail-exposure-signal-grid">

                  <article>

                    <span>
                      SINGLE-NAME CONCENTRATION
                    </span>

                    <strong
                      className={
                        concentrationClass(
                          concentration
                            ?.single_name_level
                        )
                      }
                    >
                      {
                        concentration
                          ?.single_name_level
                        ?? "Unavailable"
                      }
                    </strong>

                    <p>
                      {
                        largestHolding
                          ? `${largestHolding.ticker} represents ${percent(
                              largestHolding.weight
                            )} of the portfolio.`
                          : "No position-level concentration signal is available."
                      }
                    </p>

                  </article>


                  <article>

                    <span>
                      SECTOR CONCENTRATION
                    </span>

                    <strong
                      className={
                        concentrationClass(
                          concentration
                            ?.sector_level
                        )
                      }
                    >
                      {
                        concentration
                          ?.sector_level
                        ?? "Unavailable"
                      }
                    </strong>

                    <p>
                      {
                        largestSector
                          ? `${largestSector.name} represents ${percent(
                              largestSector.weight
                            )} of classified portfolio weight.`
                          : "Sector classification is unavailable."
                      }
                    </p>

                  </article>


                  <article>

                    <span>
                      LARGEST PROFILE COUNTRY
                    </span>

                    <strong>
                      {
                        largestCountry
                          ?.name
                        ?? "Unavailable"
                      }
                    </strong>

                    <p>
                      {
                        largestCountry
                          ? `${percent(
                              largestCountry.weight
                            )} of portfolio weight.`
                          : "Country metadata is unavailable."
                      }
                    </p>

                  </article>


                  <article>

                    <span>
                      DOMINANT TRADING CURRENCY
                    </span>

                    <strong>
                      {
                        largestCurrency
                          ?.name
                        ?? "Unavailable"
                      }
                    </strong>

                    <p>
                      {
                        largestCurrency
                          ? `${percent(
                              largestCurrency.weight
                            )} of portfolio weight.`
                          : "Trading currency metadata is unavailable."
                      }
                    </p>

                  </article>

                </section>


                <section className="retail-exposure-grid">

                  <ExposureBars
                    title="Sector Exposure"
                    description="Current-weighted sector classifications."
                    icon={Layers3}
                    items={
                      result
                        .sector_exposure
                    }
                    accent="cyan"
                  />


                  <ExposureBars
                    title="Industry Exposure"
                    description="More granular business classification beneath sector."
                    icon={Building2}
                    items={
                      result
                        .industry_exposure
                    }
                    accent="teal"
                  />

                </section>


                <section className="retail-exposure-grid">

                  <ExposureBars
                    title="Company-Profile Country"
                    description="Company metadata country — not revenue geography."
                    icon={MapPinned}
                    items={
                      result
                        .company_country_exposure
                    }
                    accent="blue"
                  />


                  <ExposureBars
                    title="Trading Currency Exposure"
                    description="Security trading currency — not full business FX exposure."
                    icon={CircleDollarSign}
                    items={
                      result
                        .trading_currency_exposure
                    }
                    accent="amber"
                  />

                </section>


                <section className="retail-exposure-holdings">

                  <header>

                    <div>

                      <Globe2 size={18} />

                      <div>

                        <h2>
                          Holding Classification
                        </h2>

                        <p>
                          The metadata FinClarity is using for each current position.
                        </p>

                      </div>

                    </div>

                  </header>


                  <div className="retail-exposure-table-wrap">

                    <table className="retail-exposure-table">

                      <thead>

                        <tr>

                          <th>
                            Holding
                          </th>

                          <th>
                            Weight
                          </th>

                          <th>
                            Sector
                          </th>

                          <th>
                            Industry
                          </th>

                          <th>
                            Profile Country
                          </th>

                          <th>
                            Currency
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          result
                            .holdings
                            .map(
                              (holding) => (

                                <tr
                                  key={
                                    holding
                                      .ticker
                                  }
                                >

                                  <td>

                                    <strong>
                                      {
                                        holding
                                          .ticker
                                      }
                                    </strong>

                                    <span>
                                      {
                                        holding
                                          .name
                                      }
                                    </span>

                                  </td>


                                  <td>
                                    {
                                      percent(
                                        holding
                                          .weight
                                      )
                                    }
                                  </td>


                                  <td>
                                    {
                                      holding
                                        .sector
                                    }
                                  </td>


                                  <td>
                                    {
                                      holding
                                        .industry
                                    }
                                  </td>


                                  <td>
                                    {
                                      holding
                                        .country
                                    }
                                  </td>


                                  <td>
                                    {
                                      holding
                                        .currency
                                    }
                                  </td>

                                </tr>

                              )
                            )
                        }

                      </tbody>

                    </table>

                  </div>

                </section>


                {
                  hasUnavailable
                  && (

                    <section className="retail-exposure-warning">

                      <AlertTriangle size={17} />

                      <div>

                        <strong>
                          Some metadata is unavailable
                        </strong>

                        <p>
                          FinClarity keeps missing classifications explicit instead of inferring them. Unavailable weight: sector {
                            percent(
                              unavailable
                                .sector
                            )
                          }, industry {
                            percent(
                              unavailable
                                .industry
                            )
                          }, country {
                            percent(
                              unavailable
                                .country
                            )
                          }, currency {
                            percent(
                              unavailable
                                .currency
                            )
                          }.
                        </p>

                      </div>

                    </section>

                  )
                }


                <section className="retail-exposure-methodology">

                  <ShieldCheck size={17} />

                  <div>

                    <strong>
                      Read these exposures carefully
                    </strong>

                    <p>
                      Sector and industry are provider classifications. Company-profile country is not revenue geography, and trading currency is not complete economic FX exposure. A multinational company may earn revenue across many countries and currencies even when its profile country and listed currency are concentrated in one market.
                    </p>

                  </div>


                  {
                    generatedAt
                    && (

                      <span>
                        Updated {
                          new Date(
                            generatedAt
                          )
                            .toLocaleString()
                        }
                      </span>

                    )
                  }

                </section>

              </>

            )
            : null
          }

        </div>

      </main>

    </div>
  );
}


export default RetailExposureIntelligence;
