import {
  useEffect,
  useState,
} from "react";

import {
  INSTITUTIONAL_MODEL_SETTINGS_KEY,
  readInstitutionalModelSettings,
} from "../lib/institutionalModelSettings";


function useInstitutionalModelSettings() {

  const [
    settings,
    setSettings,
  ] = useState(
    () =>
      readInstitutionalModelSettings()
  );


  useEffect(
    () => {

      function refresh() {

        setSettings(
          readInstitutionalModelSettings()
        );
      }


      function onStorage(
        event,
      ) {

        if (
          !event.key
          || event.key
            === INSTITUTIONAL_MODEL_SETTINGS_KEY
        ) {

          refresh();
        }
      }


      window.addEventListener(
        "storage",
        onStorage,
      );


      window.addEventListener(
        "finclarity:institutional-model-settings",
        refresh,
      );


      return () => {

        window.removeEventListener(
          "storage",
          onStorage,
        );


        window.removeEventListener(
          "finclarity:institutional-model-settings",
          refresh,
        );
      };

    },
    []
  );


  return settings;
}


export default
useInstitutionalModelSettings;
