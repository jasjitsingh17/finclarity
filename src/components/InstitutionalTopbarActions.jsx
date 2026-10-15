import { useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Home,
  RotateCcw,
  Save,
  Settings2,
} from "lucide-react";
import { Link } from "react-router-dom";

import "./InstitutionalTopbarActions.css";

const PROFILE_KEY = "finclarity_institutional_demo_profile_v1";
const NOTIFICATION_KEY =
  "finclarity_institutional_notification_preferences_v1";

const DEFAULT_PROFILE = {
  name: "Demo User",
};

const DEFAULT_NOTIFICATIONS = {
  modelRuns: true,
  coverageWarnings: true,
  researchFailures: true,
  marketFreshness: true,
};

function readLocalStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);

    return {
      ...fallback,
      ...parsed,
    };
  } catch {
    return fallback;
  }
}

function initialsFromName(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0]
    + parts[parts.length - 1][0]
  ).toUpperCase();
}

function PreferenceRow({
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <label className="fc-topbar-pref-row">
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
    </label>
  );
}

export default function InstitutionalTopbarActions() {
  const [profile, setProfile] = useState(
    () => readLocalStorage(
      PROFILE_KEY,
      DEFAULT_PROFILE,
    ),
  );

  const [draftName, setDraftName] = useState(
    () => readLocalStorage(
      PROFILE_KEY,
      DEFAULT_PROFILE,
    ).name,
  );

  const [notifications, setNotifications] = useState(
    () => readLocalStorage(
      NOTIFICATION_KEY,
      DEFAULT_NOTIFICATIONS,
    ),
  );

  const [openPanel, setOpenPanel] = useState(null);

  const initials = useMemo(
    () => initialsFromName(profile.name),
    [profile.name],
  );

  const togglePanel = (panel) => {
    setOpenPanel(
      (current) => (
        current === panel
          ? null
          : panel
      ),
    );
  };

  const saveProfile = () => {
    const cleanName = String(
      draftName ?? "",
    ).trim();

    if (!cleanName) {
      return;
    }

    const next = {
      name: cleanName,
    };

    setProfile(next);
    window.localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify(next),
    );
  };

  const updateNotification = (
    key,
    value,
  ) => {
    const next = {
      ...notifications,
      [key]: value,
    };

    setNotifications(next);

    window.localStorage.setItem(
      NOTIFICATION_KEY,
      JSON.stringify(next),
    );
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    setDraftName(DEFAULT_PROFILE.name);

    window.localStorage.removeItem(
      PROFILE_KEY,
    );
  };

  return (
    <div className="fc-institutional-topbar-actions">
      <span className="quant-environment">
        DEMO MODEL
      </span>

      <div className="fc-topbar-control">
        <button
          type="button"
          className="quant-icon-button fc-topbar-clickable"
          aria-label="Research notification preferences"
          aria-expanded={openPanel === "notifications"}
          onClick={() => togglePanel("notifications")}
        >
          <Bell size={18} />
        </button>

        {openPanel === "notifications" && (
          <section
            className="fc-topbar-popover fc-notification-popover"
            aria-label="Research notifications"
          >
            <div className="fc-topbar-popover-heading">
              <div>
                <span>RESEARCH CENTRE</span>
                <strong>Notifications</strong>
              </div>

              <div className="fc-topbar-status">
                <CheckCircle2 size={14} />
                No critical alerts
              </div>
            </div>

            <div className="fc-topbar-note">
              <CircleAlert size={15} />

              <p>
                Choose which research events should be
                surfaced in the institutional workspace.
              </p>
            </div>

            <div className="fc-topbar-pref-list">
              <PreferenceRow
                label="Model run completion"
                description="Surface completed portfolio and research runs."
                checked={notifications.modelRuns}
                onChange={(event) => (
                  updateNotification(
                    "modelRuns",
                    event.target.checked,
                  )
                )}
              />

              <PreferenceRow
                label="Coverage warnings"
                description="Flag missing or partial analytical coverage."
                checked={notifications.coverageWarnings}
                onChange={(event) => (
                  updateNotification(
                    "coverageWarnings",
                    event.target.checked,
                  )
                )}
              />

              <PreferenceRow
                label="Research failures"
                description="Surface modules that fail or return unavailable."
                checked={notifications.researchFailures}
                onChange={(event) => (
                  updateNotification(
                    "researchFailures",
                    event.target.checked,
                  )
                )}
              />

              <PreferenceRow
                label="Market-data freshness"
                description="Highlight stale or unavailable market observations."
                checked={notifications.marketFreshness}
                onChange={(event) => (
                  updateNotification(
                    "marketFreshness",
                    event.target.checked,
                  )
                )}
              />
            </div>

            <Link
              to="/institutional/settings"
              className="fc-topbar-panel-link"
              onClick={() => setOpenPanel(null)}
            >
              <Settings2 size={14} />
              Open Model Settings
            </Link>
          </section>
        )}
      </div>

      <div className="fc-topbar-control">
        <button
          type="button"
          className="quant-profile fc-profile-button"
          aria-label={`Open profile for ${profile.name}`}
          aria-expanded={openPanel === "profile"}
          onClick={() => togglePanel("profile")}
        >
          <span>{initials}</span>
          <ChevronDown size={12} />
        </button>

        {openPanel === "profile" && (
          <section
            className="fc-topbar-popover fc-profile-popover"
            aria-label="Demo profile"
          >
            <div className="fc-topbar-popover-heading">
              <div>
                <span>DEMO PROFILE</span>
                <strong>{profile.name}</strong>
              </div>

              <div className="fc-profile-initials-large">
                {initials}
              </div>
            </div>

            <div className="fc-profile-field">
              <label htmlFor="fc-demo-profile-name">
                Display name
              </label>

              <input
                id="fc-demo-profile-name"
                value={draftName}
                onChange={(event) => (
                  setDraftName(event.target.value)
                )}
                placeholder="e.g. Jasjit Bhatia"
              />
            </div>

            <button
              type="button"
              className="fc-profile-save"
              onClick={saveProfile}
              disabled={!String(draftName ?? "").trim()}
            >
              <Save size={14} />
              Save demo profile
            </button>

            <div className="fc-profile-links">
              <Link
                to="/institutional/settings"
                onClick={() => setOpenPanel(null)}
              >
                <Settings2 size={14} />
                Model Settings
              </Link>

              <Link
                to="/"
                onClick={() => setOpenPanel(null)}
              >
                <Home size={14} />
                FinClarity Home
              </Link>
            </div>

            <button
              type="button"
              className="fc-profile-reset"
              onClick={resetProfile}
            >
              <RotateCcw size={13} />
              Reset demo profile
            </button>

            <p className="fc-profile-disclosure">
              This is a local demo profile, not an authenticated
              account. The display name is stored only in this
              browser.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
