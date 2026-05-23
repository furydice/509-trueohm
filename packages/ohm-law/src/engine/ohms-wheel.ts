import type { OhmsWheelInput, OhmsWheelResult, Warning, Work } from "../types";

type Known = "volts" | "amps" | "ohms" | "watts";
const ORDER: Known[] = ["volts", "amps", "ohms", "watts"];
const UNIT: Record<Known, string> = { volts: "V", amps: "A", ohms: "Ω", watts: "W" };

/** Compact number for substitution strings: integers stay clean, else up to 4 sig figs. */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(4)));
}

/**
 * Solve the Ohm's Law wheel. Enter exactly two of { volts, amps, ohms, watts };
 * the other two are derived. Warns (never blocks) on bad input counts, negatives,
 * and divide-by-zero — always returns a best-effort result.
 */
export function solveOhmsWheel(input: OhmsWheelInput): OhmsWheelResult {
  const warnings: Warning[] = [];
  let V = input.volts ?? NaN;
  let I = input.amps ?? NaN;
  let R = input.ohms ?? NaN;
  let P = input.watts ?? NaN;
  const work: Work[] = [];

  for (const key of ORDER) {
    const val = input[key];
    if (val !== undefined && val < 0) {
      warnings.push({ code: "negative-input", message: `${key} cannot be negative.` });
    }
  }

  const pushDivZero = () => {
    if (!warnings.some((w) => w.code === "divide-by-zero")) {
      warnings.push({ code: "divide-by-zero", message: "Division by zero — check inputs." });
    }
  };
  const step = (formula: string, substitution: string) => work.push({ formula, substitution });

  const provided = ORDER.filter((k) => input[k] !== undefined);

  if (provided.length < 2) {
    warnings.push({
      code: "insufficient-inputs",
      message: "Enter exactly two values to solve the other two.",
    });
    return { volts: V, amps: I, ohms: R, watts: P, work, warnings };
  }
  if (provided.length > 2) {
    warnings.push({
      code: "overdetermined",
      message: "More than two values given — solving from the first two and ignoring the rest.",
    });
  }

  const pair = `${provided[0]}+${provided[1]}`;
  const out = (k: Known, n: number) => `${k} = ${fmt(n)} ${UNIT[k]}`;

  switch (pair) {
    case "volts+amps":
      if (I === 0) pushDivZero();
      R = V / I;
      P = V * I;
      step("R = V / I", `${out("ohms", R)}  (${fmt(V)} / ${fmt(I)})`);
      step("P = V · I", `${out("watts", P)}  (${fmt(V)} · ${fmt(I)})`);
      break;
    case "volts+ohms":
      if (R === 0) pushDivZero();
      I = V / R;
      P = (V * V) / R;
      step("I = V / R", `${out("amps", I)}  (${fmt(V)} / ${fmt(R)})`);
      step("P = V² / R", `${out("watts", P)}  (${fmt(V)}² / ${fmt(R)})`);
      break;
    case "volts+watts":
      if (V === 0) pushDivZero();
      if (P === 0) pushDivZero();
      I = P / V;
      R = (V * V) / P;
      step("I = P / V", `${out("amps", I)}  (${fmt(P)} / ${fmt(V)})`);
      step("R = V² / P", `${out("ohms", R)}  (${fmt(V)}² / ${fmt(P)})`);
      break;
    case "amps+ohms":
      V = I * R;
      P = I * I * R;
      step("V = I · R", `${out("volts", V)}  (${fmt(I)} · ${fmt(R)})`);
      step("P = I² · R", `${out("watts", P)}  (${fmt(I)}² · ${fmt(R)})`);
      break;
    case "amps+watts":
      if (I === 0) pushDivZero();
      V = P / I;
      R = P / (I * I);
      step("V = P / I", `${out("volts", V)}  (${fmt(P)} / ${fmt(I)})`);
      step("R = P / I²", `${out("ohms", R)}  (${fmt(P)} / ${fmt(I)}²)`);
      break;
    case "ohms+watts":
      if (R === 0) pushDivZero();
      I = Math.sqrt(P / R);
      V = I * R;
      step("I = √(P / R)", `${out("amps", I)}  (√(${fmt(P)} / ${fmt(R)}))`);
      step("V = I · R", `${out("volts", V)}  (${fmt(I)} · ${fmt(R)})`);
      break;
  }

  return { volts: V, amps: I, ohms: R, watts: P, work, warnings };
}
