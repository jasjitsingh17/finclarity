import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Globe2,
  LineChart,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import GlobalMarketTape from "../components/GlobalMarketTape";
import GlobalMarketLeadersPreview from "../components/GlobalMarketLeadersPreview";
import "./FinClarityLanding.css";

function FinClarityLogo() {
  return (
    <Link to="/institutional" className="fc-home-logo">
      <div className="fc-home-logo-mark">
        <LineChart size={21} />
      </div>
      <div>
        <strong>finclarity.</strong>
        <span>INVESTMENT INTELLIGENCE</span>
      </div>
    </Link>
  );
}

export default function FinClarityLanding() {
  return (
    <div className="fc-home-shell">
      <div className="fc-home-grid" aria-hidden="true" />
      <div className="fc-home-orb fc-home-orb-a" aria-hidden="true" />
      <div className="fc-home-orb fc-home-orb-b" aria-hidden="true" />

      <header className="fc-home-nav">
        <div className="fc-home-container fc-home-nav-inner">
          <FinClarityLogo />
          <nav className="fc-home-nav-links" aria-label="FinClarity sections">
            <Link to="/about">About</Link>
            <a href="#intelligence">Intelligence</a>
            <a href="#experiences">Platform</a>
            <a href="#methodology">Methodology</a>
            <a href="#markets">Markets</a>
          </nav>
          <a className="fc-home-nav-cta" href="#experiences">
            Enter platform <ArrowRight size={14} />
          </a>
        </div>
      </header>

      <main>
        <section className="fc-home-hero">
          <div className="fc-home-container fc-home-hero-grid">
            <div className="fc-home-hero-copy">
              <div className="fc-home-kicker">
                <span className="fc-status-dot" /> GLOBAL INVESTMENT INTELLIGENCE
              </div>
              <h1>
                See your portfolio
                <span>more clearly.</span>
              </h1>
              <p className="fc-home-hero-description">
                Portfolio risk, performance, sentiment, exposure and market context
                brought together in one coherent investment-intelligence platform.
              </p>
              
          <div className="fc-home-hero-actions">

            <Link
              to="/retail/portfolio"
              className="fc-home-button fc-home-button-primary"
            >
              Explore Retail Intelligence

              <ArrowRight size={16} />
            </Link>


            <Link
              to="/institutional"
              className="fc-home-button fc-home-button-primary"
            >
              Institutional Research

              <ArrowRight size={16} />
            </Link>

          </div>
              <div className="fc-home-proof">
                <span><ShieldCheck size={14} /> Evidence-led</span>
                <span><Globe2 size={14} /> Multi-currency</span>
                <span><BrainCircuit size={14} /> Quant + sentiment</span>
              </div>
            </div>

            <div className="fc-home-terminal-wrap">
              <div className="fc-home-terminal">
                <div className="fc-home-terminal-header">
                  <div>
                    <span>FINCLARITY / PORTFOLIO INTELLIGENCE</span>
                    <strong>Integrated research view</strong>
                  </div>
                  <div className="fc-home-live"><i /> MODEL READY</div>
                </div>

                <div className="fc-home-terminal-body">
                  <div className="fc-home-chart-label">
                    <span>PORTFOLIO SIGNAL</span>
                    <small>ILLUSTRATIVE INTERFACE</small>
                  </div>
                  <svg className="fc-home-hero-chart" viewBox="0 0 560 220" role="img" aria-label="Illustrative portfolio trend">
                    <defs>
                      <linearGradient id="fcHomeArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5ed0b5" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#5ed0b5" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="20" y1="174" x2="540" y2="174" className="fc-home-chart-gridline" />
                    <line x1="20" y1="122" x2="540" y2="122" className="fc-home-chart-gridline" />
                    <line x1="20" y1="70" x2="540" y2="70" className="fc-home-chart-gridline" />
                    <path className="fc-home-chart-area" d="M22 164 C70 149 96 154 136 126 C173 101 198 126 236 96 C275 65 304 84 338 63 C376 39 410 69 448 46 C483 25 510 42 538 21 L538 195 L22 195 Z" />
                    <path className="fc-home-chart-line" d="M22 164 C70 149 96 154 136 126 C173 101 198 126 236 96 C275 65 304 84 338 63 C376 39 410 69 448 46 C483 25 510 42 538 21" />
                    <circle cx="538" cy="21" r="5" className="fc-home-chart-point" />
                  </svg>
                  <div className="fc-home-terminal-metrics">
                    <div><span>RISK</span><strong>Diagnostic</strong><small>Volatility · Drawdown</small></div>
                    <div><span>SENTIMENT</span><strong>Evidence</strong><small>News · Confidence</small></div>
                    <div><span>EXPOSURE</span><strong>Portfolio</strong><small>Sector · Geography</small></div>
                  </div>
                </div>

                <div className="fc-home-terminal-footer">
                  <span>Historical analytics</span><span>FX-aware</span><span>Coverage-aware</span><span>Diagnostic, not advisory</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fc-home-market-band">
          <div className="fc-home-market-label">
            <Globe2 size={14} />
            <div><strong>GLOBAL MARKETS</strong><span>Latest available market data</span></div>
          </div>
          <div className="fc-home-market-component"><GlobalMarketTape /></div>
        </section>

        <section id="intelligence" className="fc-home-section">
          <div className="fc-home-container">
            <div className="fc-home-section-head">
              <div>
                <span className="fc-home-section-kicker">ONE INTELLIGENCE LAYER</span>
                <h2>Different lenses.<br />One portfolio.</h2>
              </div>
              <p>
                FinClarity keeps risk, performance, sentiment and exposure distinct so
                signal and uncertainty remain visible rather than being collapsed into one opaque score.
              </p>
            </div>

            <div className="fc-home-lens-grid">
              <article className="fc-home-lens-card">
                <div className="fc-home-lens-icon"><ShieldCheck size={20} /></div>
                <span>01 / RISK</span><h3>Risk Intelligence</h3>
                <p>Volatility, drawdown and portfolio-level risk translated into the selected base currency.</p>
                <div className="fc-home-mini-bars"><i style={{ width: "74%" }} /><i style={{ width: "48%" }} /><i style={{ width: "62%" }} /></div>
              </article>

              <article className="fc-home-lens-card">
                <div className="fc-home-lens-icon"><LineChart size={20} /></div>
                <span>02 / PERFORMANCE</span><h3>Performance Context</h3>
                <p>Historical portfolio behaviour compared with a benchmark, with explicit holding coverage.</p>
                <svg className="fc-home-mini-line" viewBox="0 0 200 52" aria-hidden="true"><path d="M2 44 C28 41 39 25 62 31 C84 36 95 14 116 20 C138 27 150 8 169 13 C184 16 191 7 198 4" /></svg>
              </article>

              <article className="fc-home-lens-card">
                <div className="fc-home-lens-icon"><BrainCircuit size={20} /></div>
                <span>03 / SENTIMENT</span><h3>Sentiment Evidence</h3>
                <p>FinBERT-powered language analysis with confidence and underlying evidence kept visible.</p>
                <div className="fc-home-sentiment-bars"><i /><i /><i /><i /><i /></div>
              </article>

              <article className="fc-home-lens-card">
                <div className="fc-home-lens-icon"><BarChart3 size={20} /></div>
                <span>04 / EXPOSURE</span><h3>Exposure Intelligence</h3>
                <p>Sector, country and trading-currency concentration without overstating economic exposure.</p>
                <div className="fc-home-exposure-bar"><i /><i /><i /><i /></div>
              </article>
            </div>
          </div>
        </section>

        <section id="experiences" className="fc-home-section fc-home-experiences">
          <div className="fc-home-container">
            <div className="fc-home-section-head">
              <div><span className="fc-home-section-kicker">TWO RESEARCH EXPERIENCES</span><h2>Built for different<br />levels of complexity.</h2></div>
              <p>The same evidence-led philosophy powers both experiences. The difference is how much analytical complexity is exposed.</p>
            </div>

            <div className="fc-home-experience-grid">
              <Link to="/retail/portfolio" className="fc-home-experience-card">
                <div className="fc-home-experience-number">01</div>
                <div className="fc-home-experience-icon"><WalletCards size={25} /></div>
                <span className="fc-home-section-kicker">RETAIL INTELLIGENCE</span>
                <h3>Understand what matters.</h3>
                <p>A portfolio-first experience that makes sophisticated analytics understandable without hiding evidence, uncertainty or data coverage.</p>
                <div className="fc-home-feature-list">
                  <span>Portfolio Health</span><span>Action Centre</span><span>Performance</span><span>Risk Analysis</span><span>Stress Testing</span><span>Sentiment Evidence</span>
                </div>
                <div className="fc-home-experience-action">Explore Retail <ArrowRight size={17} /></div>
              </Link>

              <Link to="/institutional" className="fc-home-experience-card fc-home-institutional-card">
                <div className="fc-home-experience-number">02</div>
                <div className="fc-home-experience-icon"><BriefcaseBusiness size={25} /></div>
                <span className="fc-home-section-kicker">INSTITUTIONAL RESEARCH</span>
                <h3>Research without simplification.</h3>
                <p>An advanced quantitative workspace for portfolio construction, risk modelling, sentiment-informed research and systematic testing.</p>
                <div className="fc-home-feature-list">
                  <span>Efficient Frontier</span><span>Black–Litterman</span><span>Factor Models</span><span>Risk Analytics</span><span>Backtesting</span><span>Model Settings</span>
                </div>
                <div className="fc-home-experience-action">Enter Research <ArrowRight size={17} /></div>
              </Link>
            </div>
          </div>
        </section>

        <section id="methodology" className="fc-home-stack-section">
          <div className="fc-home-container">
            <div className="fc-home-stack">
              <div className="fc-home-stack-copy">
                <span className="fc-home-section-kicker">THE FINCLARITY INTELLIGENCE STACK</span>
                <h2>From portfolio inputs to decision-support context.</h2>
                <p>Market data, FX conversion, analytics, evidence and synthesis remain separate layers so uncertainty stays visible rather than hidden.</p>
              </div>
              <div className="fc-home-stack-flow">
                <div><span>01</span><strong>Portfolio</strong><small>Holdings + base currency</small></div><b><ArrowRight size={14} /></b>
                <div><span>02</span><strong>Market Data</strong><small>Prices + FX histories</small></div><b><ArrowRight size={14} /></b>
                <div><span>03</span><strong>Analytics</strong><small>Risk + performance</small></div><b><ArrowRight size={14} /></b>
                <div><span>04</span><strong>Evidence</strong><small>News + filings</small></div><b><ArrowRight size={14} /></b>
                <div><span>05</span><strong>Synthesis</strong><small>Diagnostic context</small></div>
              </div>
            </div>
          </div>
        </section>

        <section id="markets" className="fc-home-section fc-home-markets">
          <div className="fc-home-container"><GlobalMarketLeadersPreview /></div>
        </section>

        <section className="fc-home-principles">
          <div className="fc-home-container fc-home-principles-grid">
            <div><span className="fc-home-section-kicker">BUILT FOR INTERPRETABILITY</span><h2>Sophisticated does not have to mean opaque.</h2></div>
            <div className="fc-home-principle"><ShieldCheck size={19} /><div><strong>Coverage-aware</strong><p>Missing data is kept distinct from neutral or complete data.</p></div></div>
            <div className="fc-home-principle"><BrainCircuit size={19} /><div><strong>Confidence-aware</strong><p>Sentiment confidence and evidence volume remain visible.</p></div></div>
            <div className="fc-home-principle"><Sparkles size={19} /><div><strong>Diagnostic, not advisory</strong><p>Research context, not buy, sell or hold recommendations.</p></div></div>
          </div>
        </section>
      </main>

      <footer className="fc-home-footer">
        <div className="fc-home-container fc-home-footer-grid">
          <div><FinClarityLogo /><p>Investment intelligence built for understanding.</p></div>
          <div className="fc-home-footer-links"><a href="#intelligence">Intelligence</a><a href="#experiences">Retail</a><a href="#experiences">Institutional</a><a href="#markets">Markets</a></div>
          <div className="fc-home-footer-meta"><span>Research & educational platform</span><span>Built by Jasjit Bhatia</span></div>
        </div>
      </footer>
    </div>
  );
}
