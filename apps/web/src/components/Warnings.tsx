import type { Warning } from "@509-trueohm/ohm-law";

/** Non-blocking sanity warnings, rendered as a warm-orange callout (warn, never block). */
export function Warnings({ warnings }: { warnings: Warning[] }): JSX.Element | null {
  if (warnings.length === 0) return null;

  return (
    <div className="warning-block" role="alert">
      <div>
        <strong>Heads up</strong>
        {warnings.map((w, i) => (
          <p key={`${w.code}-${i}`}>{w.message}</p>
        ))}
      </div>
    </div>
  );
}
