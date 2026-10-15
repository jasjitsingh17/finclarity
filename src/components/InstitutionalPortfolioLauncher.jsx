import {
  FileUp,
  Link2,
  WalletCards,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import useInstitutionalPortfolio
  from "../hooks/useInstitutionalPortfolio";

import "./InstitutionalPortfolioLauncher.css";


function InstitutionalPortfolioLauncher() {

  const portfolio =
    useInstitutionalPortfolio();


  const holdings =
    portfolio.holdings || [];


  return (
    <section className="institutional-home-portfolio">

      <div className="institutional-home-portfolio-heading">

        <div>

          <span>
            ACTIVE PORTFOLIO
          </span>

          <h2>
            Portfolio Access
          </h2>

          <p>
            Define, import or connect the portfolio
            used across the institutional research
            platform.
          </p>

        </div>


        <div className="institutional-active-portfolio">

          <small>
            ● ACTIVE
          </small>

          <strong>
            {portfolio.name}
          </strong>

          <span>
            {holdings.length}
            {" holdings · "}
            {portfolio.baseCurrency}
            {" · "}
            {portfolio.benchmark}
          </span>

          <em>
            Source:
            {" "}
            {portfolio.source}
          </em>

        </div>

      </div>


      <div className="institutional-portfolio-entry-grid">

        <Link
          to="/institutional/portfolio?tab=manual"
        >
          <WalletCards size={21} />

          <strong>
            Manual Portfolio
          </strong>

          <p>
            Add and edit holdings
            directly.
          </p>

          <span>
            OPEN →
          </span>
        </Link>


        <Link
          to="/institutional/portfolio?tab=import"
        >
          <FileUp size={21} />

          <strong>
            Import Portfolio
          </strong>

          <p>
            Upload holdings from
            portfolio exports.
          </p>

          <span>
            IMPORT →
          </span>
        </Link>


        <Link
          to="/institutional/portfolio?tab=link"
        >
          <Link2 size={21} />

          <strong>
            Link Portfolio
          </strong>

          <p>
            Connect an external
            portfolio provider.
          </p>

          <span>
            CONNECT →
          </span>
        </Link>

      </div>

    </section>
  );
}


export default InstitutionalPortfolioLauncher;
