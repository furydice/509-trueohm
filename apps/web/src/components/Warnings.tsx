import type { Warning } from "@509-trueohm/ohm-law";

/** Non-blocking sanity warnings, rendered as a warm-orange callout (warn, never block). */
export function Warnings({ warnings }: { warnings: Warning[] }): JSX.Element | null {
  if (warnings.length === 0) return null;

  return (
    <div className="warning-block" role="alert">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>
        <strong>Heads up</strong>
        {warnings.map((w, i) => (
          <p key={`${w.code}-${i}`}>{w.message}</p>
        ))}
      </div>
    </div>
  );
}
