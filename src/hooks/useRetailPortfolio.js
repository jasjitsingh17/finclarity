import {
  useEffect,
  useState,
} from "react";

import {
  readRetailPortfolio,
} from "../lib/retailPortfolio";


function useRetailPortfolio() {

  const [
    portfolio,
    setPortfolio,
  ] = useState(
    () =>
      readRetailPortfolio()
  );


  useEffect(
    () => {

      function refresh() {

        setPortfolio(
          readRetailPortfolio()
        );
      }


      function onStorage(
        event,
      ) {

        if (
          !event.key
          || event.key.startsWith(
            "finclarity_"
          )
        ) {

          refresh();
        }
      }


      window.addEventListener(
        "storage",
        onStorage,
      );


      window.addEventListener(
        "finclarity:retail-portfolio",
        refresh,
      );


      return () => {

        window.removeEventListener(
          "storage",
          onStorage,
        );


        window.removeEventListener(
          "finclarity:retail-portfolio",
          refresh,
        );
      };

    },
    []
  );


  return portfolio;
}


export default
useRetailPortfolio;
