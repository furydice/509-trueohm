import { APP_STORE_APPS } from "../lib/app-store-apps";

function ExternalLinkIcon(): JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3" />
      <path d="M10 2h4v4" />
      <line x1="14" y1="2" x2="7" y2="9" />
    </svg>
  );
}

interface ToolsScreenProps {
  onBack: () => void;
}

export function ToolsScreen({ onBack }: ToolsScreenProps): JSX.Element {
  return (
    <div className="tools-screen">
      <button type="button" className="tools-back-btn" onClick={onBack}>
        <svg
          width="10"
          height="16"
          viewBox="0 0 10 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 2L2 8l6 6" />
        </svg>
        Back
      </button>

      <div className="tools-brand-header">
        <h2 className="tools-brand-heading">
          More <span style={{ color: "var(--accent)" }}>509</span> Tools
        </h2>
        <p className="tools-brand-tagline">A companion field tool from 509 Electric.</p>
      </div>

      <div className="tools-app-list">
        {APP_STORE_APPS.map((app) => (
          <a
            key={app.name}
            href={app.url}
            target="_blank"
            rel="noreferrer"
            className="tools-app-card"
            aria-label={`${app.name} — ${app.tagline} — View on App Store`}
          >
            <img
              className="tools-app-icon"
              src={app.icon}
              alt=""
              aria-hidden="true"
              width={44}
              height={44}
              loading="lazy"
            />
            <span className="tools-app-copy">
              <strong>{app.name}</strong>
              <span className="tools-app-tagline">{app.tagline}</span>
              <small>{app.priceLabel}</small>
              <small>{app.description}</small>
            </span>
            <span className="tools-app-arrow" aria-hidden="true">
              <ExternalLinkIcon />
            </span>
          </a>
        ))}
      </div>

      <p className="tools-footer-note">TrueOhm is free from 509 Electric.</p>
    </div>
  );
}
