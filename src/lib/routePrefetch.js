// FinClarity route-intent prefetching.
// Generated from the CURRENT lazy routes in src/App.jsx.

const PREFETCHERS = {
  "/institutional/efficient-frontier": () => import("../pages/EfficientFrontier"),
  "/institutional/black-litterman": () => import("../pages/BlackLitterman"),
  "/institutional/backtesting": () => import("../pages/Backtesting"),
  "/institutional/portfolio": () => import("../pages/InstitutionalPortfolio"),
  "/institutional/sentiment": () => import("../pages/SentimentIntelligence"),
  "/institutional/settings": () => import("../pages/ModelSettings"),
  "/institutional/factors": () => import("../pages/FactorModels"),
  "/institutional/risk": () => import("../pages/RiskAnalytics"),
  "/retail/understand": () => import("../pages/RetailUnderstand"),
  "/retail/portfolio": () => import("../pages/RetailPortfolioManager"),
  "/retail/sentiment": () => import("../pages/RetailSentimentInsights"),
  "/institutional": () => import("../pages/InstitutionalDashboard"),
  "/retail/health": () => import("../pages/RetailHealth"),
  "/retail/risk": () => import("../pages/RetailRiskAnalysis"),
  "/about": () => import("../pages/AboutFinClarity"),
};

const prefetched = new Set();

function shouldSkipPrefetch() {
  const connection =
    navigator.connection
    || navigator.mozConnection
    || navigator.webkitConnection;

  if (!connection) {
    return false;
  }

  if (connection.saveData) {
    return true;
  }

  return [
    "slow-2g",
    "2g",
  ].includes(
    connection.effectiveType
  );
}

function normalizePath(href) {
  try {
    const url = new URL(
      href,
      window.location.href,
    );

    if (
      url.origin
      !== window.location.origin
    ) {
      return null;
    }

    return url.pathname;
  } catch {
    return null;
  }
}

function prefetchPath(pathname) {
  if (
    !pathname
    || prefetched.has(pathname)
    || shouldSkipPrefetch()
  ) {
    return;
  }

  const loader =
    PREFETCHERS[pathname];

  if (!loader) {
    return;
  }

  prefetched.add(pathname);

  const run = () => {
    loader().catch(() => {
      prefetched.delete(pathname);
    });
  };

  if (
    "requestIdleCallback"
    in window
  ) {
    window.requestIdleCallback(
      run,
      {
        timeout: 700,
      },
    );
  } else {
    window.setTimeout(
      run,
      40,
    );
  }
}

function linkFromEvent(event) {
  const target =
    event.target;

  if (
    !target
    || typeof target.closest
      !== "function"
  ) {
    return null;
  }

  return target.closest(
    'a[href]'
  );
}

function prefetchFromEvent(event) {
  const link =
    linkFromEvent(event);

  if (!link) {
    return;
  }

  const pathname =
    normalizePath(
      link.href
    );

  prefetchPath(
    pathname
  );
}

const guardKey =
  "__finclarityRoutePrefetchV1";

if (
  typeof window !== "undefined"
  && !window[guardKey]
) {
  window[guardKey] = true;

  document.addEventListener(
    "pointerover",
    prefetchFromEvent,
    {
      passive: true,
    },
  );

  document.addEventListener(
    "focusin",
    prefetchFromEvent,
  );

  document.addEventListener(
    "touchstart",
    prefetchFromEvent,
    {
      passive: true,
    },
  );
}
