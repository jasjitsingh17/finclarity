import {
  useEffect,
  useState,
} from "react";

import {
  INSTITUTIONAL_PORTFOLIO_STORAGE_KEY,
  readInstitutionalPortfolio,
} from "../lib/institutionalPortfolio";


function useInstitutionalPortfolio() {

  const [
    portfolio,
    setPortfolio,
  ] = useState(
    () =>
      readInstitutionalPortfolio()
  );


  useEffect(
    () => {

      function refresh() {

        setPortfolio(
          readInstitutionalPortfolio()
        );
      }


      function onStorage(
        event,
      ) {

        if (
          !event.key
          || event.key
            === INSTITUTIONAL_PORTFOLIO_STORAGE_KEY
        ) {

          refresh();
        }
      }


      window.addEventListener(
        "storage",
        onStorage,
      );


      window.addEventListener(
        "finclarity:institutional-portfolio",
        refresh,
      );


      return () => {

        window.removeEventListener(
          "storage",
          onStorage,
        );


        window.removeEventListener(
          "finclarity:institutional-portfolio",
          refresh,
        );
      };

    },
    []
  );


  return portfolio;
}


export default useInstitutionalPortfolio;
