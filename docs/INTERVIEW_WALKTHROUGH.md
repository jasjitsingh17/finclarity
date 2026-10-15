'# FinClarity — Interview Walkthrough

## 30-second version

“FinClarity is a full-stack investment-intelligence platform I built using Python, FastAPI and React. It has a Retail workflow for performance, risk, diversification, stress testing, sentiment and portfolio health, and an Institutional workflow with Efficient Frontier, Black-Litterman, Factor Models, Risk Analytics and Backtesting. The part I focused on most was analytical integrity—for example, historical portfolio analytics are converted into the selected base currency before calculating returns, and missing or partial data is surfaced explicitly rather than treated as neutral. The current version has 166 passing backend tests and a fully code-split production frontend.”

---

## 60-second version

“I built FinClarity as a portfolio project to combine finance theory with software engineering.

There are two sides. The Retail side simplifies portfolio analytics into performance, risk, diversification, stress testing, exposure and sentiment. The Institutional side exposes more advanced tools such as Efficient Frontier optimization, Black-Litterman, Factor Models, Risk Analytics and Backtesting.

A major technical challenge was global currency consistency. If I own US and UK securities but view the portfolio in GBP, I cannot calculate comparable historical returns from unconverted local prices. So I built an FX layer that converts historical security and benchmark prices into the selected base currency before return calculations.

I also focused on uncertainty. FinClarity distinguishes unavailable data, partial coverage, stale analysis and neutral sentiment instead of collapsing them into one state.

The backend is FastAPI/Python and the frontend is React/Vite. The latest QA has 166 backend tests passing, and route-level code splitting reduced the largest production JS bundle from roughly 545 kB to 291 kB.”

---

## 3-minute technical walkthrough

### 1. Architecture

“The frontend is React/Vite and communicates with a FastAPI backend.

The backend is separated into services for market data, currency conversion, sentiment and quantitative analytics. I kept those concerns separate because finance calculations become difficult to test when market-data retrieval and mathematical logic are tightly coupled.”

### 2. Portfolio and FX layer

“One of the most important design decisions was normalizing historical prices into the user’s selected base currency before calculating portfolio returns.

For example, for a US stock shown in GBP, I combine the USD price history with USD/GBP FX history. UK instruments quoted in pence are normalized into GBP first. Benchmarks are converted the same way.

I also avoid future backfills when aligning FX series because that would introduce look-ahead information.”

### 3. Risk and performance

“The performance page is explicitly a constant-weight daily-rebalanced historical simulation using today’s weights. I don’t label it as realized investor P&L because there are no historical transactions.

Risk includes metrics such as volatility, drawdown, VaR, CVaR, Sharpe and Sortino, plus concentration and correlation diagnostics.”

### 4. Sentiment

“I use FinBERT for financial-language sentiment. But I deliberately treat sentiment as evidence, not a forecast.

No news, a source outage and genuinely neutral text are different states, so the system tries to keep those concepts separate.”

### 5. Institutional models

“The Institutional workflow includes Efficient Frontier and Black-Litterman.

I particularly liked Black-Litterman because it addresses the instability of using raw historical expected returns in mean-variance optimization. It allows views to be incorporated into a prior in a more controlled way.”

### 6. Engineering quality

“I added automated tests throughout the backend because as the application grew, API schemas and service contracts could easily drift.

The current suite has 166 passing tests.

I also optimized the frontend. The initial JS bundle was around 545 kB, so I introduced route-level React lazy loading and intent-based prefetching. The largest production bundle is now around 291 kB.”

### 7. Limitation

“If I took this into production, the biggest limitation is data infrastructure. yfinance and RSS-based sources are suitable for a portfolio demonstration but not an institutional production system. I would replace those with contracted market/news feeds and authenticated persistent storage.”

---

## Likely interview questions

### Why did you build it?

“I wanted a project where I could apply portfolio theory and markets knowledge rather than build a generic CRUD application. It also forced me to think about how finance outputs should be explained to someone who did not build the model.”

### What was the hardest finance problem?

“Currency consistency across historical analytics. It affects performance, risk, correlation, stress testing and benchmarks, so fixing it at only the display layer would be mathematically wrong.”

### What was the hardest engineering problem?

“Keeping model contracts stable while the platform expanded. Tests caught several places where frontend request schemas, API schemas and service signatures could otherwise diverge.”

### What would you improve?

“Production data feeds, transaction-aware performance, authenticated accounts, persistent databases and more sophisticated portfolio construction constraints.”

### What did you deliberately not build?

“I did not build fake authentication or monetization flows just to make the project look larger. I focused the scope on financial-model integrity, testing and a coherent research workflow.”
'