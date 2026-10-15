import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import "./RetailAnalysisNotice.css";


function RetailAnalysisNotice({
  cache,
}) {

  if (
    !cache
    || cache.status
      !== "stale"
  ) {
    return null;
  }


  return (
    <aside
      className="retail-analysis-notice"
      role="status"
      aria-live="polite"
    >

      <div className="retail-analysis-notice__icon">
        <AlertTriangle size={17} />
      </div>


      <div className="retail-analysis-notice__copy">

        <strong>
          Analysis needs refreshing
        </strong>

        <span>
          Your portfolio has changed since this analysis was generated. Re-run Analyse Portfolio before relying on these results.
        </span>

      </div>


      <Link
        to="/retail"
        className="retail-analysis-notice__action"
      >
        <RefreshCw size={14} />
        Refresh analysis
      </Link>

    </aside>
  );
}


export default
RetailAnalysisNotice;
