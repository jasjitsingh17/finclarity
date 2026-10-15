'# FinClarity — Recruiter Case Study

## 1. The problem

Investment tools often sit at one of two extremes: simple portfolio dashboards that show prices and returns, or specialist quantitative tools that assume significant technical knowledge.

FinClarity was built to explore a middle ground: a single research platform where a retail investor can understand what is happening in a portfolio, while an institutional-style user can access more advanced allocation, risk and model workflows.

The key design objective was not simply “more analytics.” It was **clearer analytics with explicit uncertainty**.

---

## 2. What I built

I developed FinClarity as a full-stack investment-intelligence platform using a React/Vite frontend and a Python/FastAPI backend.

The Retail workflow includes portfolio analysis, performance, risk, diversification, stress testing, exposure, sentiment and an Action Centre that synthesizes findings.

The Institutional workflow includes Efficient Frontier optimization, Black-Litterman, Factor Models, Risk Analytics, Backtesting and persistent Model Settings.

---

## 3. Finance challenges I focused on

### Currency consistency

A major issue in global portfolios is that securities may trade in different currencies.

I therefore designed the historical analytics so prices are converted into the selected portfolio base currency before return calculations.

This applies to performance, risk, diversification and historical stress calculations.

### Missing-data integrity

I avoided treating missing data as neutral.

For example:

- failed sentiment collection is different from neutral sentiment
- incomplete FX conversion is surfaced explicitly
- partially covered analytics are not always allowed into portfolio-level rankings
- risk analysis does not silently drop holdings and pretend the remaining subset is the whole portfolio

### Historical performance wording

The performance engine is a historical constant-weight, daily-rebalanced simulation using current weights.

I deliberately label it as a historical simulation rather than realized P&L, because those are not the same concept.

---

## 4. Software-engineering challenges

### Maintaining financial-model contracts

As the project grew, frontend and backend request schemas evolved.

Automated tests helped catch mismatches between request objects, API routes and service functions before they reached the interface.

### State persistence

Institutional model outputs persist across navigation so the experience behaves like a research workstation rather than a set of disconnected pages.

### Frontend performance

The initial JavaScript bundle was approximately 545 kB.

I implemented route-level lazy loading and route-intent prefetching, reducing the largest production JavaScript chunk to approximately 291 kB while preserving the user experience.

### UX for stale research

Retail analytics are tied to the current portfolio signature.

If the user changes holdings or display currency after analysis, FinClarity marks the existing research as stale and prompts the user to rerun it.

---

## 5. Current engineering quality

The current release QA reports:

- 166 backend tests passing
- 24 unique route declarations
- 23 registered frontend routes responding without server errors
- 15 lazy routes aligned with prefetch mappings
- frontend lint passing
- production build passing
- largest JavaScript chunk approximately 291 kB
- no blocking automated release issues

---

## 6. What the project demonstrates

FinClarity demonstrates my ability to combine:

**Finance**
- portfolio theory
- historical risk
- diversification
- stress testing
- Black-Litterman
- factor thinking
- backtesting
- FX-aware portfolio analysis

**Programming**
- Python
- FastAPI
- React
- JavaScript
- NumPy
- SciPy
- pandas
- REST APIs
- automated testing

**Product thinking**
- retail vs institutional UX
- uncertainty communication
- data-quality states
- persistent workflows
- performance optimization
- recruiter-facing product polish

---

## 7. What I would build next

If FinClarity moved beyond a portfolio project, the next priorities would be authenticated users, database persistence, production market-data feeds, broker integrations and transaction-aware performance.

For the current scope, I intentionally prioritized model integrity, UX clarity, testing and a coherent research workflow over monetization or production infrastructure.
'