/** Parse a text-field string into a number, treating blank/invalid as undefined. */
export function toNum(s: string): number | undefined {
  const t = s.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** Format a value for display: "—" for missing/non-finite, else compact. */
export function fmt(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  if (Number.isInteger(n)) return n.toLocaleString();
  return Number(n.toFixed(3)).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

/** Format a dollar value — always shows exactly 2 decimal places. */
export function fmtCurrency(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
