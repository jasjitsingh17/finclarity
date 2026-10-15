import { API_BASE_URL } from "../lib/apiBase";
import {
  useEffect,
  useState,
} from "react";





function useGlobalMarkets() {

  const [
    data,
    setData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(
    () => {

      let cancelled = false;


      async function refresh() {

        try {

          const response =
            await fetch(
              `${API_BASE_URL}/api/markets/global-overview`
            );


          const payload =
            await response.json();


          if (!response.ok) {

            throw new Error(
              payload.detail
              || "Global market data unavailable."
            );
          }


          if (!cancelled) {

            setData(
              payload
            );

            setError("");
          }

        } catch (
          requestError
        ) {

          if (!cancelled) {

            setError(
              requestError.message
            );
          }

        } finally {

          if (!cancelled) {

            setLoading(false);
          }
        }
      }


      refresh();


      const interval =
        window.setInterval(
          refresh,
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


  return {
    data,
    loading,
    error,
  };
}


export default useGlobalMarkets;
