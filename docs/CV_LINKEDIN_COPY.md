'# FinClarity — CV and LinkedIn Copy

## CV bullets — strongest general version

**FinClarity — Investment Intelligence Platform | Python, FastAPI, React**

- Built a full-stack portfolio analytics platform spanning performance, risk, diversification, stress testing, sentiment intelligence, Black-Litterman allocation, factor models and backtesting across Retail and Institutional workflows.
- Engineered FX-aware historical analytics that convert securities and benchmarks into a selected base currency before return calculations, with explicit handling for missing market/FX data and partial analytical coverage.
- Developed and validated a modular FastAPI/React architecture with **166 passing backend tests**, 23 working frontend routes and route-level code splitting that reduced the largest JavaScript bundle from ~545 kB to ~291 kB (~47%).

## CV bullets — investment banking / markets angle

- Built FinClarity, a Python/FastAPI/React investment-research platform combining portfolio performance, downside risk, diversification, stress testing, market sentiment and institutional-style quantitative models.
- Implemented Black-Litterman, Efficient Frontier, factor and backtesting workflows alongside FX-normalized historical analytics to support global multi-currency portfolios.
- Strengthened model reliability through explicit coverage controls, persistent research state and **166 automated backend tests**, while optimizing frontend delivery through route-level code splitting.

## CV bullets — quant / asset management angle

- Designed a multi-asset research platform with FX-consistent return histories, portfolio risk decomposition, historical stress analysis, optimization, Black-Litterman views, factor modelling and backtesting.
- Integrated FinBERT-based financial sentiment with news/filing context while separating neutral sentiment, unavailable data and low-confidence evidence to avoid false analytical certainty.
- Built a tested Python/FastAPI analytics backend and React research interface; **166 tests pass**, and route splitting reduced the largest production JS chunk by ~47%.

---

## LinkedIn project description

**FinClarity — Investment Intelligence Platform**

I built FinClarity to explore how portfolio analytics, quantitative finance and financial NLP can be combined into a practical research workflow.

The platform has separate Retail and Institutional experiences. Retail users can analyse portfolio performance, risk, diversification, stress scenarios, sentiment and exposure, while the Institutional side includes Efficient Frontier optimization, Black-Litterman, Factor Models, Risk Analytics and Backtesting.

A key focus was analytical integrity rather than simply displaying more metrics. Historical portfolio analytics are FX-aware, missing data is surfaced explicitly, stale research is detected when the portfolio changes, and sentiment is treated as contextual evidence rather than a return forecast.

The stack includes Python, FastAPI, React, NumPy, SciPy, pandas, yfinance, PyTorch and FinBERT.

Current QA: 166 backend tests passing, 23 frontend routes responding successfully, production build/lint passing and route-level code splitting reducing the largest JS bundle from roughly 545 kB to 291 kB.

---

## LinkedIn launch post

Over the past few weeks, I’ve been building **FinClarity**, a full-stack investment-intelligence platform designed around a question I kept coming back to:

**How can portfolio analytics become more sophisticated without becoming less understandable?**

FinClarity now has two research workflows.

The **Retail** side covers portfolio performance, historical risk, diversification, stress testing, exposure, sentiment and a Portfolio Action Centre.

The **Institutional** side includes Efficient Frontier optimization, Black-Litterman, Factor Models, Risk Analytics and Backtesting.

One of the most important parts of the build was making the analytics financially consistent rather than just visually impressive. For global portfolios, historical prices and benchmarks are converted into the selected base currency before return-based calculations. I also built explicit states for partial coverage, unavailable data and stale analysis rather than treating missing information as neutral.

On the engineering side, the platform uses **Python, FastAPI and React**, with NumPy, SciPy, pandas, yfinance, PyTorch and FinBERT across the analytics stack.

The current release gate has **166 backend tests passing**, 23 registered frontend routes responding successfully, and a production build with route-level code splitting that reduced the largest JavaScript bundle from approximately 545 kB to 291 kB.

The project has been a useful way to connect finance theory, data quality, model design and product thinking in one system.

Next, I’m documenting the architecture and methodology and preparing a public portfolio version.

#Finance #InvestmentManagement #Python #React #FastAPI #QuantitativeFinance #PortfolioManagement
'