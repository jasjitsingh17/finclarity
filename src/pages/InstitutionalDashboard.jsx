import { API_BASE_URL } from "../lib/apiBase";
import { useState } from "react";
import {
  BrainCircuit,
  BriefcaseBusiness,
  CircleCheck,
  Gauge,
  LineChart,
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import InstitutionalPortfolioLauncher from "../components/InstitutionalPortfolioLauncher";
import InstitutionalSidebar from "../components/InstitutionalSidebar";
import InstitutionalTopbarActions from "../components/InstitutionalTopbarActions";

import {
  buildPortfolioRequest,
  buildSentimentRequest,
} from "../lib/institutionalModelRequests";

import "../design/FinClarityInstitutionalOverviewScale.css";
import "../design/FinClarityOverviewMatchOtherPages.css";
import "../design/FinClarityInstitutionalGlobalTypeScale.css";



const portfolioAnalysisRequest = {
  tickers: [
    "AAPL",
    "MSFT",
    "NVDA",
  ],

  current_weights: [
    0.3333,
    0.3333,
    0.3334,
  ],

  years: 3,

  risk_free_rate: 0.04,

  min_weight: 0,

  max_weight: 1,

  frontier_points: 20,
};

const sentimentAnalysisRequest = {
  tickers:
    portfolioAnalysisRequest.tickers,

  articles_per_ticker: 5,

  lookback_hours: 72,
};





const currentWeights = [
  ["AAPL", 33.33],
  ["MSFT", 33.33],
  ["NVDA", 33.34],
];







function WeightList({ holdings }) {

  const maximumWeight = Math.max(
    ...holdings.map(
      ([, weight]) => weight
    ),
    1
  );


  return (
    <div className="weight-list">

      {holdings.map(
        ([ticker, weight]) => (

          <div
            key={ticker}
            className="weight-row"
          >

            <span>
              {ticker}
            </span>

            <div className="weight-track">

              <div
                className="weight-fill"
                style={{
                  width:
                    `${(
                      weight /
                      maximumWeight
                    ) * 100}%`,
                }}
              />

            </div>

            <strong>
              {weight.toFixed(1)}%
            </strong>

          </div>

        )
      )}

    </div>
  );
}


export default function InstitutionalDashboard() {
const [modelResult, setModelResult] =
    useState(null);

  const [
    sentimentResult,
    setSentimentResult,
  ] = useState(null);

  const [
    sentimentError,
    setSentimentError,
  ] = useState("");



  const [isRunning, setIsRunning] =
    useState(false);


  const [modelError, setModelError] =
    useState("");


  async function runSentimentModel() {

    setSentimentError("");

    try {

      const response = await fetch(
        `${API_BASE_URL}/api/sentiment/analyse`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(buildSentimentRequest(sentimentAnalysisRequest)),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail
          || "Sentiment analysis failed."
        );
      }


      setSentimentResult(
        data
      );


    } catch (error) {

      setSentimentError(
        error.message
      );

      console.error(
        "FinClarity sentiment error:",
        error
      );
    }
  }


  async function runPortfolioModel() {

    setIsRunning(true);

    setModelError("");


    try {

      const response = await fetch(
        `${API_BASE_URL}/api/portfolio/analyse`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(buildPortfolioRequest(portfolioAnalysisRequest)),
        }
      );


      if (!response.ok) {

        const errorData =
          await response.json();

        throw new Error(
          errorData.detail ??
          "Portfolio optimisation failed."
        );

      }


      const data =
        await response.json();


      setModelResult(data);

    } catch (error) {

      setModelError(
        error.message
      );

    } finally {

      setIsRunning(false);

    }

  }


  const optimisedWeights =
    modelResult
      ? Object.entries(
          modelResult
            .maximum_sharpe
            .weights
        ).map(
          ([ticker, weight]) => [
            ticker,
            weight * 100,
          ]
        )
      : [
          ["AAPL", 18],
          ["MSFT", 24],
          ["NVDA", 58],
        ];


  const expectedReturn =
    modelResult
      ? (
          modelResult
            .maximum_sharpe
            .expected_return * 100
        ).toFixed(2)
      : "12.60";


  const volatility =
    modelResult
      ? (
          modelResult
            .maximum_sharpe
            .volatility * 100
        ).toFixed(2)
      : "14.20";


  const sharpeRatio =
    modelResult
      ? modelResult
          .maximum_sharpe
          .sharpe_ratio
          .toFixed(2)
      : "1.18"; 
      
        // ========================================
  // REAL EFFICIENT FRONTIER
  // ========================================

  const frontierData =
    modelResult
      ? modelResult.efficient_frontier.filter(
          (point) =>
            point.expected_return >=
            modelResult.minimum_variance.expected_return -
              0.000001
        )
      : [];


  const maximumSharpePoint =
    modelResult?.maximum_sharpe ?? null;


  const minimumVariancePoint =
    modelResult?.minimum_variance ?? null;


  const chartVolatilities = [
    ...frontierData.map(
      (point) => point.volatility
    ),
    maximumSharpePoint?.volatility ?? 0,
    minimumVariancePoint?.volatility ?? 0,
  ];


  const chartReturns = [
    ...frontierData.map(
      (point) => point.expected_return
    ),
    maximumSharpePoint?.expected_return ?? 0,
    minimumVariancePoint?.expected_return ?? 0,
    portfolioAnalysisRequest.risk_free_rate,
  ];


  const xMin = 0;

  const xMax = Math.max(
    ...chartVolatilities,
    0.30
  );


  const yMin = Math.min(
    ...chartReturns,
    portfolioAnalysisRequest.risk_free_rate
  );


  const yMax = Math.max(
    ...chartReturns,
    0.18
  );


  function scaleX(value) {

    const chartLeft = 70;
    const chartRight = 650;

    return (
      chartLeft +
      (
        (value - xMin) /
        (xMax - xMin || 1)
      ) *
      (chartRight - chartLeft)
    );

  }


  function scaleY(value) {

  const chartTop = 40;
  const chartBottom = 270;

  return (
    chartBottom -
    (
      (value - yMin) /
      (yMax - yMin || 1)
    ) *
    (chartBottom - chartTop)
  );

}


const frontierPath =
  frontierData.length > 1
    ? frontierData
        .map(
          (point, index) =>
            `${
              index === 0 ? "M" : "L"
            } ${
              scaleX(
                point.volatility
              )
            } ${
              scaleY(
                point.expected_return
              )
            }`
        )
        .join(" ")
    : "";


const cmlEndVolatility =
  xMax;


const cmlEndReturn =
  modelResult
    ? (
        portfolioAnalysisRequest.risk_free_rate +
        modelResult.maximum_sharpe.sharpe_ratio *
          cmlEndVolatility
      )
    : 0;
      const sentimentRegime =
    sentimentResult
      ?.portfolio_sentiment
      ?.regime
    ?? "Pending";


  const sentimentConfidence =
    sentimentResult
      ?.portfolio_sentiment
      ?.confidence
    ?? 0;


  const riskMetrics =
    modelResult
      ? [
          {
            metric: "Sharpe Ratio",

            current:
              modelResult
                .current_portfolio
                .sharpe_ratio
                .toFixed(2),

            optimised:
              modelResult
                .maximum_sharpe
                .sharpe_ratio
                .toFixed(2),

            status:
              modelResult
                .maximum_sharpe
                .sharpe_ratio
              >=
              modelResult
                .current_portfolio
                .sharpe_ratio
                ? "improved"
                : "weaker",

            statusLabel:
              modelResult
                .maximum_sharpe
                .sharpe_ratio
              >=
              modelResult
                .current_portfolio
                .sharpe_ratio
                ? "Improved"
                : "Weaker",
          },

          {
            metric: "Sortino Ratio",

            current:
              modelResult
                .risk_analytics
                .current_portfolio
                .sortino_ratio
                .toFixed(2),

            optimised:
              modelResult
                .risk_analytics
                .maximum_sharpe
                .sortino_ratio
                .toFixed(2),

            status:
              modelResult
                .risk_analytics
                .maximum_sharpe
                .sortino_ratio
              >=
              modelResult
                .risk_analytics
                .current_portfolio
                .sortino_ratio
                ? "improved"
                : "weaker",

            statusLabel:
              modelResult
                .risk_analytics
                .maximum_sharpe
                .sortino_ratio
              >=
              modelResult
                .risk_analytics
                .current_portfolio
                .sortino_ratio
                ? "Improved"
                : "Weaker",
          },

          {
            metric: "Annualised Vol.",

            current:
              `${(
                modelResult
                  .current_portfolio
                  .volatility
                * 100
              ).toFixed(2)}%`,

            optimised:
              `${(
                modelResult
                  .maximum_sharpe
                  .volatility
                * 100
              ).toFixed(2)}%`,

            status:
              modelResult
                .maximum_sharpe
                .volatility
              <=
              modelResult
                .current_portfolio
                .volatility
                ? "lower-risk"
                : "higher-risk",

            statusLabel:
              modelResult
                .maximum_sharpe
                .volatility
              <=
              modelResult
                .current_portfolio
                .volatility
                ? "Lower Risk"
                : "Higher Risk",
          },

          {
            metric: "Expected Return",

            current:
              `${(
                modelResult
                  .current_portfolio
                  .expected_return
                * 100
              ).toFixed(2)}%`,

            optimised:
              `${(
                modelResult
                  .maximum_sharpe
                  .expected_return
                * 100
              ).toFixed(2)}%`,

            status:
              modelResult
                .maximum_sharpe
                .expected_return
              >=
              modelResult
                .current_portfolio
                .expected_return
                ? "higher-return"
                : "lower-return",

            statusLabel:
              modelResult
                .maximum_sharpe
                .expected_return
              >=
              modelResult
                .current_portfolio
                .expected_return
                ? "Higher Return"
                : "Lower Return",
          },

          {
            metric: "VaR 95% (1D)",

            current:
              `${(
                modelResult
                  .risk_analytics
                  .current_portfolio
                  .var_95
                * 100
              ).toFixed(2)}%`,

            optimised:
              `${(
                modelResult
                  .risk_analytics
                  .maximum_sharpe
                  .var_95
                * 100
              ).toFixed(2)}%`,

            status:
              modelResult
                .risk_analytics
                .maximum_sharpe
                .var_95
              >=
              modelResult
                .risk_analytics
                .current_portfolio
                .var_95
                ? "lower-risk"
                : "higher-risk",

            statusLabel:
              modelResult
                .risk_analytics
                .maximum_sharpe
                .var_95
              >=
              modelResult
                .risk_analytics
                .current_portfolio
                .var_95
                ? "Lower Risk"
                : "Higher Risk",
          },

          {
            metric: "CVaR 95% (1D)",

            current:
              `${(
                modelResult
                  .risk_analytics
                  .current_portfolio
                  .cvar_95
                * 100
              ).toFixed(2)}%`,

            optimised:
              `${(
                modelResult
                  .risk_analytics
                  .maximum_sharpe
                  .cvar_95
                * 100
              ).toFixed(2)}%`,

            status:
              modelResult
                .risk_analytics
                .maximum_sharpe
                .cvar_95
              >=
              modelResult
                .risk_analytics
                .current_portfolio
                .cvar_95
                ? "lower-risk"
                : "higher-risk",

            statusLabel:
              modelResult
                .risk_analytics
                .maximum_sharpe
                .cvar_95
              >=
              modelResult
                .risk_analytics
                .current_portfolio
                .cvar_95
                ? "Lower Risk"
                : "Higher Risk",
          },

          {
            metric: "Max Drawdown",

            current:
              `${(
                modelResult
                  .risk_analytics
                  .current_portfolio
                  .max_drawdown
                * 100
              ).toFixed(2)}%`,

            optimised:
              `${(
                modelResult
                  .risk_analytics
                  .maximum_sharpe
                  .max_drawdown
                * 100
              ).toFixed(2)}%`,

            status:
              modelResult
                .risk_analytics
                .maximum_sharpe
                .max_drawdown
              >=
              modelResult
                .risk_analytics
                .current_portfolio
                .max_drawdown
                ? "lower-risk"
                : "higher-risk",

            statusLabel:
              modelResult
                .risk_analytics
                .maximum_sharpe
                .max_drawdown
              >=
              modelResult
                .risk_analytics
                .current_portfolio
                .max_drawdown
                ? "Lower Risk"
                : "Higher Risk",
          },
        ]

      : [
          {
            metric: "Run model",
            current: "—",
            optimised: "—",
            status: "",
            statusLabel: "",
          },
        ];


    return (
    <div className="quant-dashboard">

      {/* SIDEBAR */}

      <InstitutionalSidebar active="overview" />


      {/* MAIN */}

      <main className="quant-main fc-institutional-page fc-institutional-overview fc-inst-standard-page">

        {/* TOPBAR */}

        <header className="quant-topbar">

          <div className="quant-search">
            <Search size={17} />

            <span>
              Search assets, models or signals...
            </span>
          </div>


          <InstitutionalTopbarActions />

        </header>

          <div className="fc-institutional-launcher-scale">
          <InstitutionalPortfolioLauncher />
        </div>



        <div className="quant-content">

          {/* HEADING */}

          <section className="quant-heading">

            <div>

              <span className="quant-eyebrow">
                QUANTITATIVE RESEARCH TERMINAL
              </span>

              <h1>
                Portfolio intelligence,
                <span>
                  {" "}without the noise.
                </span>
              </h1>

              <p>
                Portfolio optimisation, sentiment,
                risk and factor research in one
                institutional-style workspace.
              </p>

            </div>


            <button
  className="run-model-button"
  onClick={() => {
          runPortfolioModel();
          runSentimentModel();
        }}
  disabled={isRunning}
>
  <BrainCircuit size={17} />

  {isRunning
    ? "Running Model..."
    : "Run Portfolio Model"}
</button>

          </section>


          {/* SUMMARY CARDS */}

          <section className="quant-metrics">

            <div className="quant-metric-card">

              <div className="quant-metric-icon">
                <TrendingUp size={20} />
              </div>

              <div>
                <span>
                  Expected Return
                </span>

                <strong>
  {expectedReturn}%
</strong>

               <small>
  {modelResult
    ? "Calculated by Python optimiser"
    : "Illustrative until model is run"}
</small>
              </div>

            </div>


            <div className="quant-metric-card">

              <div className="quant-metric-icon">
                <Gauge size={20} />
              </div>

              <div>
                <span>
                  Sharpe Ratio
                </span>

                <strong>
  {sharpeRatio}
</strong>

                <small>
                  Calculated by Python optimiser
                </small>
              </div>

            </div>


            <div className="quant-metric-card">

              <div className="quant-metric-icon">
                <ShieldCheck size={20} />
              </div>

              <div>
                <span>
  Annualised Volatility
</span>

<strong>
  {volatility}%
</strong>

<small>
  {modelResult
    ? "Calculated from covariance matrix"
    : "Illustrative until model is run"}
</small>
              </div>

            </div>


            <div className="quant-metric-card">

              <div className="quant-metric-icon">
                <BrainCircuit size={20} />
              </div>

              <div>
                <span>
                  Sentiment Regime
                </span>

                <strong>{sentimentRegime}</strong>

                <small>
                  {sentimentResult
              ? `FinBERT confidence ${(
                  sentimentConfidence
                  * 100
                ).toFixed(1)}%`
              : sentimentError
                ? "Sentiment unavailable"
                : "Awaiting sentiment analysis"}
                </small>
              </div>

            </div>

          </section>
            {modelError && (
  <div className="quant-api-error">
    {modelError}
  </div>
)}

          {/* CURRENT VS OPTIMISED */}

          <section className="quant-two-column">

            <div className="quant-panel">

              <div className="quant-panel-heading">

                <div>
                  <h2>
                    Current Portfolio
                  </h2>

                  <p>
                    Current portfolio allocation
                  </p>
                </div>

                <BriefcaseBusiness size={19} />

              </div>

              <WeightList
                holdings={currentWeights}
              />

            </div>


            <div className="quant-panel">

              <div className="quant-panel-heading">

                <div>
                  <h2>
                    Optimised Portfolio
                  </h2>

                  <p>
  {modelResult
    ? "Python Maximum Sharpe solution"
    : "Illustrative preview"}
</p>
                </div>

                <CircleCheck size={19} />

              </div>

              <WeightList
                holdings={optimisedWeights}
              />

            </div>

          </section>


          {/* FRONTIER + RISK */}

          <section className="quant-main-grid">

            <div className="quant-panel frontier-panel">

              <div className="quant-panel-heading">

                <div>
                  <h2>
                    Efficient Frontier
                  </h2>

                  <p>
                    Risk-return optimisation preview
                  </p>
                </div>

                <LineChart size={19} />

              </div>


              <div className="institutional-frontier">

                <div className="institutional-frontier">

  {modelResult ? (

    <svg
      viewBox="0 0 700 330"
      role="img"
      aria-label="Calculated efficient frontier"
    >

      {/* GRID */}

      <g className="quant-grid-lines">

        <line
          x1="70"
          y1="40"
          x2="70"
          y2="270"
        />

        <line
          x1="70"
          y1="270"
          x2="650"
          y2="270"
        />

        <line
          x1="70"
          y1="215"
          x2="650"
          y2="215"
        />

        <line
          x1="70"
          y1="160"
          x2="650"
          y2="160"
        />

        <line
          x1="70"
          y1="105"
          x2="650"
          y2="105"
        />

      </g>


      {/* CALCULATED FRONTIER POINTS */}

      {frontierData.map(
        (point, index) => (

          <circle
            key={index}
            cx={
              scaleX(
                point.volatility
              )
            }
            cy={
              scaleY(
                point.expected_return
              )
            }
            r="5"
            className="portfolio-point"
          />

        )
      )}


      {/* CALCULATED FRONTIER */}

      <path
        d={frontierPath}
        className="efficient-line"
      />


      {/* CAPITAL MARKET LINE */}

      <line
        x1={scaleX(0)}
        y1={
          scaleY(
            portfolioAnalysisRequest
              .risk_free_rate
          )
        }
        x2={
          scaleX(
            cmlEndVolatility
          )
        }
        y2={
          scaleY(
            cmlEndReturn
          )
        }
        className="cml-line"
      />


      {/* MINIMUM VARIANCE */}

      <circle
        cx={
          scaleX(
            minimumVariancePoint
              .volatility
          )
        }
        cy={
          scaleY(
            minimumVariancePoint
              .expected_return
          )
        }
        r="9"
        className="min-var-point"
      />


      <text
        x={
          scaleX(
            minimumVariancePoint
              .volatility
          ) - 75
        }
        y={
          scaleY(
            minimumVariancePoint
              .expected_return
          ) - 12
        }
        className="chart-text"
      >
        Min Variance
      </text>


      {/* MAXIMUM SHARPE */}

      <circle
        cx={
          scaleX(
            maximumSharpePoint
              .volatility
          )
        }
        cy={
          scaleY(
            maximumSharpePoint
              .expected_return
          )
        }
        r="10"
        className="max-sharpe-point"
      />


      <text
        x={
          scaleX(
            maximumSharpePoint
              .volatility
          ) + 12
        }
        y={
          scaleY(
            maximumSharpePoint
              .expected_return
          ) - 10
        }
        className="chart-text"
      >
        Max Sharpe
      </text>


      {/* AXIS LABELS */}

      <text
        x="610"
        y="300"
        className="chart-text"
      >
        Risk →
      </text>

      <text
        x="15"
        y="45"
        className="chart-text"
      >
        Return
      </text>

    </svg>

  ) : (

    <div className="frontier-waiting">

      <LineChart size={30} />

      <strong>
        Run the portfolio model
      </strong>

      <span>
        The calculated efficient frontier
        will appear here.
      </span>

    </div>

  )}

</div>

              </div>


              <div className="frontier-legend">

                <span>
                  <i className="legend-frontier" />
                  Efficient Frontier
                </span>

                <span>
                  <i className="legend-cml" />
                  Capital Market Line
                </span>

                <span>
                  <i className="legend-optimal" />
                  Optimal Portfolio
                </span>

              </div>


              <div className="quant-placeholder-note">

  {modelResult
    ? "Calculated by the FinClarity Python optimisation engine."
    : "Run the portfolio model to calculate the efficient frontier."}

</div>
            </div>


            <div className="quant-panel risk-table-panel">

              <div className="quant-panel-heading">

                <div>
                  <h2>
                    Risk Comparison
                  </h2>

                  <p>
                    Current vs optimised portfolio
                  </p>
                </div>

                <ShieldCheck size={19} />

              </div>


              <div className="risk-table">

                <div className="risk-table-head">
                  <span>Metric</span>
                  <span>Current</span>
                  <span>Optimised</span>
                  <span></span>
                </div>


                {riskMetrics.map(
                  (row) => (

                    <div
                      key={row.metric}
                      className="risk-table-row"
                    >

                      <strong>
                        {row.metric}
                      </strong>

                      <span>
                        {row.current}
                      </span>

                      <span className="optimised-value">
                        {row.optimised}
                      </span>

                      {row.status ? (
  <span
    className={`risk-status-badge ${row.status}`}
  >
    {row.statusLabel}
  </span>
) : (
  <span>—</span>
)}

                    </div>

                  )
                )}

              </div>

            </div>

          </section>


          {/* SENTIMENT MODEL */}

          <section className="quant-panel sentiment-preview-panel">

            <div className="quant-panel-heading">

              <div>
                <h2>
                  Sentiment Intelligence
                </h2>

                <p>
                  Preview of the model architecture
                </p>
              </div>

              <BrainCircuit size={19} />

            </div>


            <div className="sentiment-model-grid">

              <div className="sentiment-source">

                <span>
                  NEWS SENTIMENT
                </span>

                <strong>
                  +0.64
                </strong>

                <small>
                  FinBERT prototype
                </small>

              </div>


              <div className="sentiment-source">

                <span>
                  SOCIAL SENTIMENT
                </span>

                <strong>
                  +0.41
                </strong>

                <small>
                  Social-data prototype
                </small>

              </div>


              <div className="sentiment-source">

                <span>
                  DISPERSION
                </span>

                <strong>
                  0.28
                </strong>

                <small>
                  Lower disagreement
                </small>

              </div>


              <div className="sentiment-source">

                <span>
                  BL CONFIDENCE
                </span>

                <strong>
                  76%
                </strong>

                <small>
                  Illustrative Ω input
                </small>

              </div>

            </div>


            <div className="sentiment-flow">

              <span>
                News + Social
              </span>

              <strong>→</strong>

              <span>
                FinBERT
              </span>

              <strong>→</strong>

              <span>
                Confidence
              </span>

              <strong>→</strong>

              <span>
                Black-Litterman
              </span>

              <strong>→</strong>

              <span>
                Portfolio
              </span>

            </div>

          </section>


          <footer className="quant-disclaimer">

            All institutional dashboard values are
            illustrative until the quantitative
            backend is connected.

          </footer>

        </div>

      </main>

    </div>
  );
}