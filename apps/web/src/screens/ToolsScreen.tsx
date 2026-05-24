interface AppCard {
  name: string;
  tagline: string;
  description: string;
  url: string;
  icon: string;
}

const APPS: AppCard[] = [
  {
    name: "TrueBend",
    tagline: "Conduit bending made exact",
    description:
      "Calculate offsets, 90s, saddles, and segment bends for EMT, IMC, and rigid conduit.",
    url: "https://apps.apple.com/app/truebend",
    icon: "/tool-icons/truebend.png",
  },
  {
    name: "TrueDrop",
    tagline: "Voltage drop calculator",
    description:
      "Size conductors and verify voltage drop for branch circuits and feeders per NEC.",
    url: "https://apps.apple.com/app/truedrop",
    icon: "/tool-icons/truedrop.svg",
  },
  {
    name: "TrueFill",
    tagline: "Conduit fill",
    description:
      "Size conduit and check fill percentages per NEC Chapter 9 — any conductor mix.",
    url: "https://apps.apple.com/app/truefill",
    icon: "/tool-icons/truefill.svg",
  },
  {
    name: "TruePhase",
    tagline: "Wire colors & circuit phase",
    description:
      "Assign phase colors across a panel schedule — single-phase or three-phase, any voltage.",
    url: "https://apps.apple.com/app/truephase",
    icon: "/tool-icons/truephase.png",
  },
  {
    name: "TrueFault",
    tagline: "Available fault current",
    description:
      "Calculate available fault current at any point in a distribution system per IEEE 141.",
    url: "https://apps.apple.com/app/truefault",
    icon: "/tool-icons/truefault.png",
  },
  {
    name: "TrueMotor",
    tagline: "NEC motor calculations",
    description:
      "Size conductors, overload protection, and short-circuit protection per NEC 430.",
    url: "https://apps.apple.com/app/truemotor",
    icon: "/tool-icons/truemotor.svg",
  },
  {
    name: "TrueBox",
    tagline: "NEC box fill & pull boxes",
    description:
      "Calculate box fill per NEC 314.16 and pull/junction box sizing per 314.28.",
    url: "https://apps.apple.com/app/truebox",
    icon: "/tool-icons/truebox.svg",
  },
  {
    name: "TrueRate",
    tagline: "Flat-rate pricing for electricians",
    description:
      "Build flat-rate price books, generate customer-ready quotes, and track job profitability.",
    url: "https://apps.apple.com/app/truerate",
    icon: "/tool-icons/truerate.png",
  },
];

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
        <p className="tools-brand-tagline">
          Free electrical tools from 509 Electric — built for the field.
        </p>
      </div>

      <div className="tools-app-list" role="list">
        {APPS.map((app) => (
          <a
            key={app.name}
            href={app.url}
            target="_blank"
            rel="noreferrer"
            className="tools-app-card"
            role="listitem"
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
