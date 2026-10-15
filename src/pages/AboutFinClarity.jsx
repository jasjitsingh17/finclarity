import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Code2,
  ExternalLink,
  GraduationCap,
  LineChart,
  Mail,
  ShieldCheck,
  Sparkles } from "lucide-react";

import { Link } from "react-router-dom";
import "./AboutFinClarity.css";

const ANALYSTFORGE_URL = "https://analystforge.onrender.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/jasjitsinghbhatia/";
const GITHUB_URL = "https://github.com/jasjitsingh17";
const EMAIL_URL = "mailto:jasjitsingh170@gmail.com";

function Brand() {
  return (
    <Link to="/" className="fc-about-brand" aria-label="FinClarity home">
      <span><LineChart size={19} /></span>
      <div>
        <strong>finclarity.</strong>
        <small>INVESTMENT INTELLIGENCE</small>
      </div>
    </Link>
  );
}

function SocialLink({ href, label, children }) {
  const isMail = href.startsWith("mailto:");
  return (
    <a
      href={href}
      target={isMail ? undefined : "_blank"}
      rel={isMail ? undefined : "noreferrer"}
      className="fc-about-social"
      aria-label={label}
      title={label}
    >
      {children}
    </a>
  );
}

export default function AboutFinClarity() {
  return (
    <div className="fc-about">
      <div className="fc-about-grid" aria-hidden="true" />
      <div className="fc-about-glow fc-about-glow-a" aria-hidden="true" />
      <div className="fc-about-glow fc-about-glow-b" aria-hidden="true" />

      <header className="fc-about-nav">
        <div className="fc-about-shell fc-about-nav-inner">
          <Brand />

          <nav className="fc-about-nav-links" aria-label="About page navigation">
            <a href="#profile">Profile</a>
            <a href="#analystforge">AnalystForge</a>
            <a href="#principles">Principles</a>
            <a href="#connect">Connect</a>
          </nav>

          <Link to="/" className="fc-about-back">
            <ArrowLeft size={14} />
            Back to FinClarity
          </Link>
        </div>
      </header>

      <main>
        <section id="profile" className="fc-about-hero">
          <div className="fc-about-shell fc-about-hero-grid">
            <div className="fc-about-hero-copy">
              <div className="fc-about-kicker">
                <span />
                ABOUT / JASJIT SINGH BHATIA
              </div>

              <h1>
                Finance,
                <br />
                analysis
                <span>and technology.</span>
              </h1>

              <p className="fc-about-lead">
                I am a Warwick Business School MSc Business and Finance graduate
                with experience across project finance, treasury, financial
                analysis and audit. I build analytical tools that make complex
                financial workflows more transparent, interpretable and useful.
              </p>

              <div className="fc-about-focus">
                <span>Project Finance</span>
                <span>Valuation</span>
                <span>M&amp;A</span>
                <span>Markets</span>
                <span>Equity Research</span>
                <span>Financial Modelling</span>
              </div>

              <div className="fc-about-social-row">
                <SocialLink href={LINKEDIN_URL} label="LinkedIn">
                  <BriefcaseBusiness size={18} />
                </SocialLink>
                <SocialLink href={GITHUB_URL} label="GitHub">
                  <Code2 size={18} />
                </SocialLink>
                <SocialLink href={EMAIL_URL} label="Email">
                  <Mail size={18} />
                </SocialLink>
              </div>
            </div>

            <aside className="fc-about-profile-card">
              <div className="fc-about-profile-top">
                <span>PROFILE / 01</span>
                <span className="fc-about-live"><i />LONDON, UK</span>
              </div>

              <div className="fc-about-monogram">JB</div>

              <div className="fc-about-profile-heading">
                <small>RECRUITER SNAPSHOT</small>
                <strong>Finance execution with an analytical edge.</strong>
              </div>

              <div className="fc-about-facts">
                <div>
                  <span>CURRENT</span>
                  <strong>HCLTech</strong>
                  <small>Associate · Project Finance</small>
                </div>
                <div>
                  <span>EDUCATION</span>
                  <strong>Warwick</strong>
                  <small>MSc Business &amp; Finance</small>
                </div>
                <div>
                  <span>CORE</span>
                  <strong>Finance</strong>
                  <small>Budgeting · Forecasting · Analysis</small>
                </div>
                <div>
                  <span>BUILDS</span>
                  <strong>FinClarity</strong>
                  <small>AnalystForge · Investment Intelligence</small>
                </div>
              </div>

              <svg className="fc-about-profile-chart" viewBox="0 0 500 145" aria-hidden="true">
                <path className="fc-about-gridline" d="M0 116H500 M0 76H500 M0 36H500" />
                <path className="fc-about-path" d="M0 121 C48 112 74 126 113 101 S181 79 220 87 S287 97 328 61 S403 72 500 20" />
              </svg>
            </aside>
          </div>
        </section>

        <section className="fc-about-section">
          <div className="fc-about-shell">
            <div className="fc-about-section-head">
              <div>
                <span className="fc-about-section-kicker">FINANCE × ANALYSIS × TECHNOLOGY</span>
                <h2>Why I build.</h2>
              </div>
              <p>
                My work sits at the intersection of financial analysis and
                automation. The goal is not to replace judgement with a black
                box. It is to automate repetitive analytical work while keeping
                assumptions, evidence and calculations visible.
              </p>
            </div>

            <div className="fc-about-pillars">
              <article>
                <BriefcaseBusiness size={21} />
                <span>01 / EXPERIENCE</span>
                <h3>Finance in practice</h3>
                <p>
                  Experience spanning project financial control, treasury,
                  financial analysis and audit across UK and international environments.
                </p>
              </article>

              <article>
                <GraduationCap size={21} />
                <span>02 / FOUNDATION</span>
                <h3>Business + Finance</h3>
                <p>
                  MSc Business and Finance at Warwick Business School, with
                  quantitative, markets, derivatives and corporate-risk coursework.
                </p>
              </article>

              <article>
                <Code2 size={21} />
                <span>03 / BUILD</span>
                <h3>Transparent automation</h3>
                <p>
                  Python, FastAPI and Excel automation used to turn
                  financial-analysis workflows into auditable tools.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="analystforge" className="fc-about-section fc-about-project-section">
          <div className="fc-about-shell">
            <div className="fc-about-project">
              <div className="fc-about-project-copy">
                <span className="fc-about-section-kicker">FEATURED BUILD / ANALYSTFORGE</span>

                <h2>
                  From assumptions
                  <br />
                  to analyst-ready
                  <span>deliverables.</span>
                </h2>

                <p>
                  AnalystForge is a full-stack financial-analysis platform I built
                  around the workflows analysts actually use. It brings DCF valuation,
                  M&amp;A execution and post-earnings equity research into one
                  transparent workflow, with Python-based analytical engines and
                  formula-transparent, downloadable Excel outputs.
                </p>

                <div className="fc-about-project-actions">
                  <a
                    href={ANALYSTFORGE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="fc-about-primary-button"
                  >
                    Launch AnalystForge
                    <ExternalLink size={15} />
                  </a>

                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="fc-about-secondary-button"
                  >
                    View GitHub
                    <Code2 size={15} />
                  </a>
                </div>
              </div>

              <div className="fc-about-browser">
                <div className="fc-about-browser-top">
                  <div><i /><i /><i /></div>
                  <span>analystforge.onrender.com</span>
                </div>

                <div className="fc-about-browser-body">
                  <div className="fc-about-browser-nav">
                    <strong>AnalystForge</strong>
                    <span>VALUATION</span>
                    <span>M&amp;A</span>
                    <span>EQUITY RESEARCH</span>
                  </div>

                  <div className="fc-about-browser-hero">
                    <small>FINANCIAL ANALYSIS WORKBENCH</small>
                    <h3>
                      Three workflows.
                      <br />
                      One analytical system.
                    </h3>
                    <p>Transparent finance workflows. Formula-driven outputs.</p>
                  </div>

                  <div className="fc-about-browser-grid">
                    <div>
                      <span>01</span>
                      <strong>Valuation</strong>
                      <small>DCF · Sensitivity · Excel</small>
                    </div>
                    <div>
                      <span>02</span>
                      <strong>M&amp;A Execution</strong>
                      <small>Accretion · Ownership · Model</small>
                    </div>
                    <div>
                      <span>03</span>
                      <strong>Equity Research</strong>
                      <small>Earnings · Multiples · Note</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="principles" className="fc-about-section">
          <div className="fc-about-shell">
            <div className="fc-about-section-head">
              <div>
                <span className="fc-about-section-kicker">HOW I THINK ABOUT FINANCIAL TOOLS</span>
                <h2>Automation should improve judgement, not hide it.</h2>
              </div>
              <p>
                That principle connects AnalystForge and FinClarity: automate
                what is repetitive, preserve what requires judgement, and show
                users where the data or model is uncertain.
              </p>
            </div>

            <div className="fc-about-principles">
              <div><ShieldCheck size={20} /><strong>Transparent</strong><p>Assumptions, methodology and limitations should remain visible.</p></div>
              <div><BrainCircuit size={20} /><strong>Evidence-led</strong><p>Outputs should point back to the data or evidence that generated them.</p></div>
              <div><BarChart3 size={20} /><strong>Analytical</strong><p>Design should make complex financial information easier to interrogate.</p></div>
              <div><Sparkles size={20} /><strong>Useful</strong><p>Technology matters only when it improves the underlying workflow.</p></div>
            </div>
          </div>
        </section>

        <section id="connect" className="fc-about-connect">
          <div className="fc-about-shell fc-about-connect-inner">
            <div>
              <span className="fc-about-section-kicker">CONNECT</span>
              <h2>Finance, research and analytical technology.</h2>
              <p>
                If you work in investment banking, markets, equity research,
                corporate finance or financial modelling, I am always interested
                in thoughtful conversations about where technology can improve
                analytical workflows.
              </p>
            </div>

            <div className="fc-about-connect-actions">
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                <BriefcaseBusiness size={19} />
                <div><span>LINKEDIN</span><strong>Connect professionally</strong></div>
                <ArrowRight size={17} />
              </a>

              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <Code2 size={19} />
                <div><span>GITHUB</span><strong>Explore my builds</strong></div>
                <ArrowRight size={17} />
              </a>

              <a href={EMAIL_URL}>
                <Mail size={19} />
                <div><span>EMAIL</span><strong>Start a conversation</strong></div>
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="fc-about-footer">
        <div className="fc-about-shell fc-about-footer-inner">
          <Brand />
          <span>FinClarity · Built by Jasjit Bhatia</span>
          <Link to="/">Return to platform <ArrowRight size={13} /></Link>
        </div>
      </footer>
    </div>
  );
}
