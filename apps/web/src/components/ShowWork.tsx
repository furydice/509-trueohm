import { useState } from "react";
import type { Work } from "@509-trueohm/ohm-law";

/** Collapsible "How this was calculated" panel rendering each formula + substitution. */
export function ShowWork({ work }: { work: Work[] }): JSX.Element | null {
  const [open, setOpen] = useState(false);
  if (work.length === 0) return null;

  return (
    <div className="show-work-row">
      <button
        type="button"
        className="show-work-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>How this was calculated</span>
        <span className="show-work-chevron" aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open ? (
        <div className="show-work-body">
          {work.map((w, i) => (
            <div className="show-work-step" key={i}>
              <code>{w.formula}</code>
              <span className="sub">{w.substitution}</span>
              {w.note ? (
                <span className="sub" style={{ color: "var(--text-dim)" }}>
                  {w.note}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
