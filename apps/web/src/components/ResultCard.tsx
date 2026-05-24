import type { Warning, Work } from "@509-trueohm/ohm-law";
import { fmt } from "./format";
import { ShowWork } from "./ShowWork";
import { Warnings } from "./Warnings";

export interface ResultRow {
  label: string;
  value: number;
  unit?: string;
  /** Highlight in accent when this value was solved (not entered). */
  computed?: boolean;
}

interface ResultCardProps {
  label: string;
  hero: { value: number; unit: string; prefix?: string; format?: (n: number | undefined) => string };
  rows: ResultRow[];
  work: Work[];
  warnings: Warning[];
}

/** Pick a hero font size that keeps the number from overflowing the card. */
function heroFontSize(text: string): string {
  const len = text.length;
  if (len <= 6) return "4rem";
  if (len <= 8) return "3rem";
  if (len <= 11) return "2.2rem";
  return "1.6rem";
}

/** Shared result card: hero number, secondary rows, show-your-work, warnings. */
export function ResultCard({ label, hero, rows, work, warnings }: ResultCardProps): JSX.Element {
  const heroFmt = hero.format ?? fmt;
  const heroText = `${hero.prefix ?? ""}${heroFmt(hero.value)}`;
  return (
    <div className="vd-result-card">
      <div className="vd-result-header">
        <span className="vd-result-label">{label}</span>
      </div>
      <div className="vd-result-hero">
        <span className="vd-result-number" style={{ fontSize: heroFontSize(heroText) }}>
          {hero.prefix}
          {heroFmt(hero.value)}
        </span>
        {hero.unit ? <span className="vd-result-unit">{hero.unit}</span> : null}
      </div>

      <div className="to-result-rows">
        {rows.map((r, i) => (
          <div className={`to-result-row${r.computed ? " computed" : ""}`} key={i}>
            <span className="to-rl">{r.label}</span>
            <span className="to-rv">
              {fmt(r.value)}
              {r.unit ? <em>{r.unit}</em> : null}
            </span>
          </div>
        ))}
      </div>

      <ShowWork work={work} />
      <Warnings warnings={warnings} />
    </div>
  );
}
