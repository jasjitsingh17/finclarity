import "./RetailReadability.css";
import {
  Activity,
  ChartNoAxesCombined,
  Sparkles,
  ArrowLeft,
  BrainCircuit,
  Gauge,
  Flame,
  Radar,
  LayoutDashboard,
  LineChart,
  PieChart,
  Network,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";


const ITEMS = [
  {
    key: "portfolio",
    label: "My Portfolio",
    to: "/retail/portfolio",
    icon: WalletCards,
  },
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/retail",
    icon: LayoutDashboard,
  },
  {
    key: "action",
    label: "Action Centre",
    to: "/retail/action-centre",
    icon: Sparkles,
  },
  {
    key: "sentiment",
    label: "Sentiment Insights",
    to: "/retail/sentiment",
    icon: BrainCircuit,
  },
  {
    key: "risk",
    label: "Risk Analysis",
    to: "/retail/risk",
    icon: Activity,
  },
  {
    key: "performance",
    label: "Performance",
    to: "/retail/performance",
    icon: ChartNoAxesCombined,
  },
  {
    key: "diversification",
    label: "Diversification",
    to: "/retail/diversification",
    icon: Network,
  },
  {
    key: "stress",
    label: "Stress Testing",
    to: "/retail/stress",
    icon: Flame,
  },
  {
    key: "exposure",
    label: "Exposure Intelligence",
    to: "/retail/exposure",
    icon: Radar,
  },
  {
    key: "health",
    label: "Portfolio Health",
    to: "/retail/health",
    icon: PieChart,
  },
];


function RetailSidebar({
  active,
}) {
  return (
    <aside className="retail-live-sidebar">

      <Link
        to="/"
        className="retail-live-logo"
      >
        <div>
          <LineChart size={21} />
        </div>

        <span>
          <strong>
            finclarity.
          </strong>

          <small>
            PERSONAL INVESTING
          </small>
        </span>
      </Link>


      <nav>

        <span className="retail-nav-section">
          OVERVIEW
        </span>


        {
          ITEMS.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={
                    `retail-live-nav ${
                      active === item.key
                        ? "active"
                        : ""
                    }`
                  }
                  aria-current={
                    active === item.key
                      ? "page"
                      : undefined
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            }
          )
        }


        <span className="retail-nav-section second">
          LEARN
        </span>


        <Link
          to="/retail/understand"
          className={
            `retail-live-nav ${
              active === "understand"
                ? "active"
                : ""
            }`
          }
          aria-current={
            active === "understand"
              ? "page"
              : undefined
          }
        >
          <Gauge size={18} />
          Understand My Portfolio
        </Link>

      </nav>


      <div className="retail-live-sidebar-bottom">

        <ShieldCheck size={16} />

        <div>
          <strong>
            Educational platform
          </strong>

          <span>
            Insights are not investment advice.
          </span>
        </div>

      </div>


      <Link
        to="/"
        className="retail-switch-investor"
      >
        <ArrowLeft size={14} />
        Switch investor type
      </Link>

    </aside>
  );
}


export default RetailSidebar;
