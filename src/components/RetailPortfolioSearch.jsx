import {
  Search,
  X,
} from "lucide-react";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "./RetailPortfolioSearch.css";


function RetailPortfolioSearch({
  holdings = [],
}) {

  const navigate =
    useNavigate();

  const inputRef =
    useRef(null);

  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(0);


  const matches =
    useMemo(
      () => {

        const clean =
          query
            .trim()
            .toLowerCase();


        if (!clean) {
          return holdings.slice(
            0,
            6
          );
        }


        return holdings
          .filter(
            (holding) => {

              const ticker =
                String(
                  holding.ticker
                  ?? ""
                )
                  .toLowerCase();

              const name =
                String(
                  holding.name
                  ?? ""
                )
                  .toLowerCase();


              return (
                ticker.includes(
                  clean
                )
                || name.includes(
                  clean
                )
              );
            }
          )
          .slice(
            0,
            6
          );
      },
      [
        holdings,
        query,
      ]
    );


  function choose(
    holding,
  ) {

    if (!holding) {
      return;
    }


    setQuery(
      holding.ticker
      ?? ""
    );

    setOpen(
      false
    );


    navigate(
      `/retail/portfolio?focus=${
        encodeURIComponent(
          holding.ticker
          ?? ""
        )
      }`
    );
  }


  function handleKeyDown(
    event,
  ) {

    if (
      event.key === "ArrowDown"
    ) {

      event.preventDefault();

      setOpen(
        true
      );

      setActiveIndex(
        (current) =>
          Math.min(
            current + 1,
            Math.max(
              matches.length - 1,
              0
            )
          )
      );

      return;
    }


    if (
      event.key === "ArrowUp"
    ) {

      event.preventDefault();

      setActiveIndex(
        (current) =>
          Math.max(
            current - 1,
            0
          )
      );

      return;
    }


    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      choose(
        matches[
          activeIndex
        ]
      );

      return;
    }


    if (
      event.key === "Escape"
    ) {

      setOpen(
        false
      );
    }
  }


  return (
    <div className="retail-portfolio-search">

      <div
        className={
          `retail-portfolio-search-box ${
            open
              ? "active"
              : ""
          }`
        }
      >

        <Search size={17} />


        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search ticker or company..."
          aria-label="Search your portfolio"
          autoComplete="off"
          onFocus={
            () => {
              setOpen(
                true
              );

              setActiveIndex(
                0
              );
            }
          }
          onChange={
            (event) => {

              setQuery(
                event.target.value
              );

              setOpen(
                true
              );

              setActiveIndex(
                0
              );
            }
          }
          onKeyDown={
            handleKeyDown
          }
        />


        {
          query
          && (

            <button
              type="button"
              aria-label="Clear search"
              onClick={
                () => {

                  setQuery(
                    ""
                  );

                  setOpen(
                    true
                  );

                  inputRef
                    .current
                    ?.focus();
                }
              }
            >
              <X size={14} />
            </button>

          )
        }

      </div>


      {
        open
        && (

          <div className="retail-portfolio-search-results">

            {
              matches.length
                ? matches.map(
                    (
                      holding,
                      index,
                    ) => (

                      <button
                        type="button"
                        key={
                          `${
                            holding.ticker
                          }-${index}`
                        }
                        className={
                          index
                          === activeIndex
                            ? "active"
                            : ""
                        }
                        onMouseDown={
                          (event) =>
                            event.preventDefault()
                        }
                        onMouseEnter={
                          () =>
                            setActiveIndex(
                              index
                            )
                        }
                        onClick={
                          () =>
                            choose(
                              holding
                            )
                        }
                      >

                        <span className="retail-search-symbol">

                          {
                            String(
                              holding.ticker
                              ?? "?"
                            )
                              .charAt(0)
                          }

                        </span>


                        <span className="retail-search-description">

                          <strong>
                            {
                              holding.ticker
                              ?? "Unknown"
                            }
                          </strong>

                          <small>
                            {
                              holding.name
                              ?? "Portfolio holding"
                            }
                          </small>

                        </span>


                        <span className="retail-search-meta">
                          {
                            Number(
                              holding.quantity
                            )
                            || 0
                          }
                          {" units"}
                        </span>

                      </button>

                    )
                  )
                : (

                  <div className="retail-search-empty">
                    No portfolio holding matches “{query}”.
                  </div>

                )
            }

          </div>

        )
      }

    </div>
  );
}


export default RetailPortfolioSearch;
