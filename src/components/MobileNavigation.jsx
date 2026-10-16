import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import "./MobileNavigation.css";

export default function MobileNavigation({ children, label }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className={`fc-mobile-nav-root ${open ? "fc-mobile-nav-open" : ""}`}>
      <button
        type="button"
        className="fc-mobile-nav-toggle"
        aria-label={open ? "Close navigation" : `Open ${label} navigation`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
        <span>{open ? "Close" : "Menu"}</span>
      </button>

      {open && (
        <button
          type="button"
          className="fc-mobile-nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}

      {children}
    </div>
  );
}
