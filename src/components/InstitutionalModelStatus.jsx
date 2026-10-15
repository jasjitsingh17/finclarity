import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import "./InstitutionalModelStatus.css";


function formatTimestamp(
  value,
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";
  }


  return date.toLocaleString(
    [],
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


function InstitutionalModelStatus({
  status,
  metadata,
  modelName,
}) {

  if (
    status === "empty"
  ) {

    return null;
  }


  const stale =
    status === "stale";


  const timestamp =
    formatTimestamp(
      metadata?.generatedAt
    );


  return (
    <div
      className={
        `institutional-model-status ${
          stale
            ? "stale"
            : "current"
        }`
      }
    >

      <div className="institutional-model-status-icon">

        {
          stale
            ? (
              <AlertTriangle
                size={15}
              />
            )
            : (
              <CheckCircle2
                size={15}
              />
            )
        }

      </div>


      <div className="institutional-model-status-copy">

        <strong>

          {
            stale
              ? (
                "Inputs changed — refresh required"
              )
              : (
                `${modelName} result restored`
              )
          }

        </strong>


        <span>

          {
            stale
              ? (
                "The previous result is still visible, "
                + "but the active portfolio or relevant "
                + "model settings have changed."
              )
              : (
                "This analysis has been restored from "
                + "your most recent model run."
              )
          }

        </span>

      </div>


      <div className="institutional-model-status-meta">

        {
          metadata?.portfolioName
          && (

            <span>
              {
                metadata.portfolioName
              }
            </span>

          )
        }


        {
          timestamp
          && (

            <span>

              <Clock3 size={11} />

              {timestamp}

            </span>

          )
        }

      </div>

    </div>
  );
}


export default
InstitutionalModelStatus;
