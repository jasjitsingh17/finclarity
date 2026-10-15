import { Link, useLocation } from "react-router-dom";

import {
  Activity,
  BarChart3,
  BrainCircuit,
  Grid2X2,
  Layers3,
  LineChart,
  PieChart,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import "./InstitutionalSidebar.css";


const researchItems = [
  {
    label: "Overview",
    icon: Grid2X2,
    route: "/institutional",
  },
  {
    label: "Portfolio",
    icon: PieChart,
    route: "/institutional/portfolio",
  },
  {
    label: "Efficient Frontier",
    icon: LineChart,
    route: "/institutional/efficient-frontier",
  },
  {
    label: "Sentiment Intelligence",
    icon: BrainCircuit,
    route: "/institutional/sentiment",
  },
  {
    label: "Black-Litterman",
    icon: Layers3,
    route: "/institutional/black-litterman",
  },
  {
    label: "Factor Models",
    icon: BarChart3,
    route: "/institutional/factors",
  },
  {
    label: "Risk Analytics",
    icon: ShieldCheck,
    route: "/institutional/risk",
  },
  {
    label: "Backtesting",
    icon: Activity,
    route: "/institutional/backtesting",
  },
];


function InstitutionalSidebar() {

  const location = useLocation();


  function renderItem(
    item
  ) {

    const Icon =
      item.icon;

    const active =
      item.route
      && location.pathname
        === item.route;


    if (!item.route) {

      return (
        <button
          type="button"
          className="institutional-nav-item disabled"
          disabled
          key={item.label}
        >
          <Icon size={18} />
          <span>
            {item.label}
          </span>
        </button>
      );
    }


    return (
      <Link
        key={item.label}
        to={item.route}
        className={
          `institutional-nav-item${
            active
              ? " active"
              : ""
          }`
        }
      >
        <Icon size={18} />

        <span>
          {item.label}
        </span>
      </Link>
    );
  }


  return (
    <aside className="institutional-sidebar">
      <a
        href="/"
        className="institutional-logo-home-hitbox"
        aria-label="Go to FinClarity homepage"
        title="FinClarity Home"
      />


      <div className="institutional-sidebar-brand">

        <div className="institutional-brand-mark">
          <BarChart3 size={21} />
        </div>

        <div>

          <strong>
            finclarity.
          </strong>

          <span>
            INSTITUTIONAL RESEARCH
          </span>

        </div>

      </div>


      <div className="institutional-nav-heading">
        RESEARCH
      </div>


      <nav className="institutional-nav">

        {
          researchItems.map(
            renderItem
          )
        }

      </nav>


      <div className="institutional-system-section">

        <div className="institutional-nav-heading">
          SYSTEM
        </div>


        <Link
          to="/institutional/settings"
          className={
            `institutional-nav-item${
              location.pathname
                === "/institutional/settings"
                ? " active"
                : ""
            }`
          }
        >
          <SlidersHorizontal size={18} />

          <span>
            Model Settings
          </span>

        </Link>

      </div>


      <div className="institutional-sidebar-footer">

        <ShieldCheck size={17} />

        <div>

          <strong>
            Research environment
          </strong>

          <span>
            Live market and model analytics
          </span>

        </div>

      </div>

    
      <a
        href="/"
        className="institutional-home-link"
      >
        <span aria-hidden="true">←</span>
        FinClarity Home
      </a>

</aside>
  );
}


export default InstitutionalSidebar;
