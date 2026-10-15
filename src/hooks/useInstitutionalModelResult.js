import {
  useEffect,
  useState,
} from "react";

import {
  getInstitutionalModelSignature,
  readInstitutionalModelCache,
  saveInstitutionalModelCache,
} from "../lib/institutionalModelCache";


function useInstitutionalModelResult(
  modelKey,
) {

  const [
    record,
    setRecord,
  ] = useState(
    () =>
      readInstitutionalModelCache(
        modelKey
      )
  );


  useEffect(
    () => {

      function refresh() {

        const latest =
          readInstitutionalModelCache(
            modelKey
          );


        if (latest) {

          setRecord(
            latest
          );

        } else {

          setRecord(
            null
          );
        }
      }


      function onStorage(
        event,
      ) {

        if (
          !event.key
          || event.key.startsWith(
            "finclarity_institutional_"
          )
        ) {

          refresh();
        }
      }


      function onModelResult(
        event,
      ) {

        if (
          !event.detail
          || event.detail.modelKey
            === modelKey
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


      window.addEventListener(
        "finclarity:institutional-model-settings",
        refresh,
      );


      window.addEventListener(
        "finclarity:institutional-model-result",
        onModelResult,
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


        window.removeEventListener(
          "finclarity:institutional-model-settings",
          refresh,
        );


        window.removeEventListener(
          "finclarity:institutional-model-result",
          onModelResult,
        );
      };

    },
    [modelKey]
  );


  const currentSignature =
    getInstitutionalModelSignature(
      modelKey
    );


  const cacheStatus =
    !record
      ? "empty"
      : record.signature
        === currentSignature
        ? "current"
        : "stale";


  function saveResult(
    result,
  ) {

    const saved =
      saveInstitutionalModelCache(
        modelKey,
        result,
      );


    setRecord(
      saved
    );


    return result;
  }


  return {

    result:
      record?.result
      ?? null,

    saveResult,

    cacheStatus,

    cacheMetadata: {

      generatedAt:
        record?.generatedAt
        ?? null,

      portfolioName:
        record?.portfolioName
        ?? null,
    },
  };
}


export default
useInstitutionalModelResult;
