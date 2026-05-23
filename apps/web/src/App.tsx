import { useEffect, useState } from "react";
import "./styles/global.css";
import "./styles/trueohm.css";
import { OhmsWheelScreen } from "./screens/OhmsWheelScreen";
import { AcPowerScreen } from "./screens/AcPowerScreen";
import { PowerTriangleScreen } from "./screens/PowerTriangleScreen";
import { EnergyCostScreen } from "./screens/EnergyCostScreen";
import { EfficiencyScreen } from "./screens/EfficiencyScreen";

type ThemeMode = "dark" | "light";
type ModeId = "ohms" | "ac" | "triangle" | "energy" | "eff";

const MODES: { id: ModeId; label: string }[] = [
  { id: "ohms", label: "Ohm's Law" },
  { id: "ac", label: "AC Power" },
  { id: "triangle", label: "Power Triangle" },
  { id: "energy", label: "Energy Cost" },
  { id: "eff", label: "Efficiency" },
];

function getStoredTheme(): ThemeMode {
  try {
    const stored = JSON.parse(window.localStorage.getItem("theme") ?? '"dark"');
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function shouldShowDeviceChrome(): boolean {
  return !("capacitorVersion" in window) && window.innerWidth >= 390;
}

function StatusBar(): JSX.Element {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, "0");
  return (
    <div className="status-bar" aria-hidden="true">
      <span>
        {h}:{m}
      </span>
      <div className="dynamic-island" />
      <span className="status-glyphs">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
          <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4" />
          <rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6" />
          <rect x="9" y="0" width="3" height="12" rx="1" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" />
        </svg>
      </span>
    </div>
  );
}

function HomeIndicator(): JSX.Element {
  return (
    <div className="home-indicator" aria-hidden="true">
      <span />
    </div>
  );
}

function renderScreen(mode: ModeId): JSX.Element {
  switch (mode) {
    case "ohms":
      return <OhmsWheelScreen />;
    case "ac":
      return <AcPowerScreen />;
    case "triangle":
      return <PowerTriangleScreen />;
    case "energy":
      return <EnergyCostScreen />;
    case "eff":
      return <EfficiencyScreen />;
  }
}

export function App(): JSX.Element {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [showDeviceChrome] = useState(shouldShowDeviceChrome);
  const [mode, setMode] = useState<ModeId>("ohms");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#f3eee4" : "#0b0b0d");
  }, [theme]);

  function toggleTheme(): void {
    setTheme((current) => {
      const next: ThemeMode = current === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem("theme", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <main
      className="trueohm-shell"
      data-device-chrome={showDeviceChrome ? "mock" : "native"}
      data-theme={theme}
    >
      {showDeviceChrome ? <StatusBar /> : null}

      <div className="screen-stack">
        <header className="home-topbar">
          <div className="brand-lockup">
            <h1>
              True<span style={{ color: "var(--accent)" }}>Ohm</span>
            </h1>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
            style={{ fontSize: 18 }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </header>

        <div className="to-mode-switcher" role="group" aria-label="Calculator mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={mode === m.id ? "selected" : ""}
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {renderScreen(mode)}

        <footer className="to-footer">
          <p className="to-disclaimer">A calculation aid for qualified professionals.</p>
          <a
            className="to-more-tools"
            href="https://509electric.com"
            target="_blank"
            rel="noreferrer"
          >
            <span>
              <strong>More 509 Tools</strong>
              <small>TrueBend · TruePhase · TrueFault · TrueDrop</small>
            </span>
            <span className="to-more-arrow" aria-hidden="true">
              ›
            </span>
          </a>
        </footer>
      </div>

      {showDeviceChrome ? <HomeIndicator /> : null}
    </main>
  );
}
