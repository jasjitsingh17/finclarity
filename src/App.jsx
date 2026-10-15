import { lazy, Suspense } from "react";
import "./design/FinClarityRouteLoader.css";
import FinClarityLanding from "./pages/FinClarityLanding";
import RetailEntryGate from "./components/RetailEntryGate";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import "./lib/routePrefetch";
// FINCLARITY_ROUTE_SPLITTING_V1
// Route modules load on demand; landing shell remains immediate.
const AboutFinClarity = lazy(
  () =>
    import("./pages/AboutFinClarity")
);

const RetailActionCentre = lazy(
  () =>
    import("./pages/RetailActionCentre")
);

const RetailPerformance = lazy(
  () =>
    import("./pages/RetailPerformance")
);

const RetailExposureIntelligence = lazy(
  () =>
    import("./pages/RetailExposureIntelligence")
);

const RetailStressTesting = lazy(
  () =>
    import("./pages/RetailStressTesting")
);

const RetailDiversification = lazy(
  () =>
    import("./pages/RetailDiversification")
);

const RetailPortfolioManager = lazy(
  () =>
    import("./pages/RetailPortfolioManager")
);

const RetailSentimentInsights = lazy(
  () =>
    import("./pages/RetailSentimentInsights")
);

const RetailRiskAnalysis = lazy(
  () =>
    import("./pages/RetailRiskAnalysis")
);

const RetailHealth = lazy(
  () =>
    import("./pages/RetailHealth")
);

const RetailUnderstand = lazy(
  () =>
    import("./pages/RetailUnderstand")
);

const InstitutionalPortfolio = lazy(
  () =>
    import("./pages/InstitutionalPortfolio")
);

const InstitutionalDashboard = lazy(
  () =>
    import("./pages/InstitutionalDashboard")
);

const RetailDashboard = lazy(
  () =>
    import("./pages/RetailDashboard")
);

const SentimentIntelligence = lazy(
  () =>
    import("./pages/SentimentIntelligence")
);

const BlackLitterman = lazy(
  () =>
    import("./pages/BlackLitterman")
);

const FactorModels = lazy(
  () =>
    import("./pages/FactorModels")
);

const Backtesting = lazy(
  () =>
    import("./pages/Backtesting")
);

const RiskAnalytics = lazy(
  () =>
    import("./pages/RiskAnalytics")
);

const EfficientFrontier = lazy(
  () =>
    import("./pages/EfficientFrontier")
);

const ModelSettings = lazy(
  () =>
    import("./pages/ModelSettings")
);

// ========================================
// LOGO
// ========================================

// ========================================
// ROUTING
// ========================================


function FinClarityRouteLoader() {
  return (
    <div
      className="fc-route-loader"
      role="status"
      aria-live="polite"
    >
      <div className="fc-route-loader__inner">
        <div
          className="fc-route-loader__mark"
          aria-hidden="true"
        />

        <strong className="fc-route-loader__brand">
          finclarity.
        </strong>

        <span className="fc-route-loader__copy">
          Loading investment intelligence…
        </span>

        <div
          className="fc-route-loader__bar"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}


export default function App() {
  const location =
    useLocation();


  return (
    <div
      className="fc-route-stage"
      key={
        location.pathname
      }
    >

      <Suspense fallback={<FinClarityRouteLoader />}>
      <Routes>

      <Route
        path="/"
        element={<FinClarityLanding />}
      />
      <Route
        path="/retail/setup"
        element={
          <Navigate
            to="/retail/portfolio"
            replace
          />
        }
      />

      <Route
        path="/retail/portfolio"
        element={<RetailPortfolioManager />}
      />

      <Route
        path="/retail"
        element={
          <RetailEntryGate>
            <RetailDashboard />
          </RetailEntryGate>
        }
      />

      <Route
        path="/institutional"
        element={<InstitutionalDashboard />}
      />

            <Route
        path="/about"
        element={<AboutFinClarity />}
      />

<Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    
        <Route
          path="/institutional/sentiment"
          element={<SentimentIntelligence />}
        />

      
        <Route
          path="/institutional/black-litterman"
          element={<BlackLitterman />}
        />

      
        <Route
          path="/institutional/factors"
          element={<FactorModels />}
        />

      
        <Route
          path="/institutional/backtesting"
          element={<Backtesting />}
        />

      
        <Route
          path="/institutional/risk"
          element={<RiskAnalytics />}
        />

      
        <Route
          path="/institutional/portfolio"
          element={<InstitutionalPortfolio />}
        />

      
        <Route
          path="/institutional/efficient-frontier"
          element={<EfficientFrontier />}
        />

      
        <Route
          path="/institutional/settings"
          element={<ModelSettings />}
        />

      

      <Route
        path="/retail/sentiment"
        element={<RetailSentimentInsights />}
      />

      <Route
        path="/retail/risk"
        element={<RetailRiskAnalysis />}
      />

                        <Route
        path="/retail/exposure"
        element={
          <RetailEntryGate>
            <RetailExposureIntelligence />
          </RetailEntryGate>
        }
      />

<Route
        path="/retail/stress"
        element={
          <RetailEntryGate>
            <RetailStressTesting />
          </RetailEntryGate>
        }
      />

            <Route
        path="/retail/action-centre"
        element={
          <RetailEntryGate>
            <RetailActionCentre />
          </RetailEntryGate>
        }
      />

<Route
        path="/retail/performance"
        element={
          <RetailEntryGate>
            <RetailPerformance />
          </RetailEntryGate>
        }
      />

<Route
        path="/retail/diversification"
        element={
          <RetailEntryGate>
            <RetailDiversification />
          </RetailEntryGate>
        }
      />

<Route
        path="/retail/health"
        element={<RetailHealth />}
      />

      <Route
        path="/retail/understand"
        element={<RetailUnderstand />}
      />

</Routes>
    </Suspense>

    </div>
  );
}
