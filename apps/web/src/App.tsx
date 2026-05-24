import { useCallback, useEffect, useRef, useState } from "react";
import "./styles/global.css";
import "./styles/trueohm.css";
import { OhmsWheelScreen } from "./screens/OhmsWheelScreen";
import { AcPowerScreen } from "./screens/AcPowerScreen";
import { PowerTriangleScreen } from "./screens/PowerTriangleScreen";
import { EnergyCostScreen } from "./screens/EnergyCostScreen";
import { EfficiencyScreen } from "./screens/EfficiencyScreen";
import { ToolsScreen } from "./screens/ToolsScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
  const [showTools, setShowTools] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  /** Scroll the selected tab into view when mode changes. */
  const scrollSelectedTab = useCallback(() => {
    const container = switcherRef.current;
    if (!container) return;
    const selected = container.querySelector<HTMLElement>(".selected");
    if (!selected) return;
    selected.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  useEffect(() => {
    scrollSelectedTab();
  }, [mode, scrollSelectedTab]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#f3eee4" : "#0b0b0d");
  }, [theme]);

  /** Enable theme-switch CSS transitions after the first paint (avoids FOUC). */
  useEffect(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.add("theme-ready");
    });
  }, []);

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
            <img
              src="/icon.svg"
              alt=""
              width={32}
              height={32}
              style={{ borderRadius: 8 }}
            />
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

        {showTools ? (
          <ToolsScreen onBack={() => setShowTools(false)} />
        ) : (
          <>
            <div className="to-mode-switcher" role="group" aria-label="Calculator mode" ref={switcherRef}>
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

            <ErrorBoundary key={mode}>
              {renderScreen(mode)}
            </ErrorBoundary>

            <footer className="to-footer">
              <p className="to-disclaimer">A calculation aid for qualified professionals.</p>
              <button
                type="button"
                className="to-more-tools"
                onClick={() => setShowTools(true)}
              >
                <span>
                  <strong>More 509 Tools</strong>
                  <small>TrueBend · TruePhase · TrueFault · TrueMotor · TrueDrop</small>
                </span>
                <span className="to-more-arrow" aria-hidden="true">
                  ›
                </span>
              </button>
            </footer>
          </>
        )}
      </div>

      {showDeviceChrome ? <HomeIndicator /> : null}
    </main>
  );
}
