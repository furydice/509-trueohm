import type { AcPowerInput, AcPowerResult, Warning, Work } from "../types";
import { SQRT3 } from "../constants";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(4)));
}

/**
 * Relate { V, I, kVA, kW, PF } for single- and three-phase systems and solve for
 * the unknown(s). Voltage is line-to-line for 3Ø. Works internally in base units
 * (VA, W) and fills values iteratively from S = k·V·I and P = S·PF.
 * Warns (never blocks) on negatives, out-of-range PF, and insufficient inputs.
 */
export function solveAcPower(input: AcPowerInput): AcPowerResult {
  const warnings: Warning[] = [];
  const work: Work[] = [];
  const k = input.phase === 3 ? SQRT3 : 1;
  const kLabel = input.phase === 3 ? "√3" : "1";

  const named: Array<[string, number | undefined]> = [
    ["volts", input.volts],
    ["amps", input.amps],
    ["kva", input.kva],
    ["kw", input.kw],
    ["powerFactor", input.powerFactor],
  ];
  for (const [name, val] of named) {
    if (val !== undefined && val < 0) {
      warnings.push({ code: "negative-input", message: `${name} cannot be negative.` });
    }
  }

  let V = input.volts;
  let I = input.amps;
  let S = input.kva !== undefined ? input.kva * 1000 : undefined; // VA
  let P = input.kw !== undefined ? input.kw * 1000 : undefined; // W
  let pf = input.powerFactor;

  const step = (formula: string, substitution: string) => work.push({ formula, substitution });

  for (let pass = 0; pass < 4; pass++) {
    if (pf === undefined && P !== undefined && S !== undefined && S !== 0) {
      pf = P / S;
      step("PF = P / S", `PF = ${fmt(P / 1000)} kW / ${fmt(S / 1000)} kVA = ${fmt(pf)}`);
    }
    if (S === undefined && V !== undefined && I !== undefined) {
      S = k * V * I;
      step(`S = ${kLabel} · V · I`, `S = ${kLabel} · ${fmt(V)} V · ${fmt(I)} A = ${fmt(S / 1000)} kVA`);
    }
    if (S === undefined && P !== undefined && pf !== undefined && pf !== 0) {
      S = P / pf;
      step("S = P / PF", `S = ${fmt(P / 1000)} kW / ${fmt(pf)} = ${fmt(S / 1000)} kVA`);
    }
    if (P === undefined && S !== undefined && pf !== undefined) {
      P = S * pf;
      step("P = S · PF", `P = ${fmt(S / 1000)} kVA · ${fmt(pf)} = ${fmt(P / 1000)} kW`);
    }
    if (I === undefined && S !== undefined && V !== undefined && V !== 0) {
      I = S / (k * V);
      step(`I = S / (${kLabel} · V)`, `I = ${fmt(S)} VA / (${kLabel} · ${fmt(V)} V) = ${fmt(I)} A`);
    }
    if (V === undefined && S !== undefined && I !== undefined && I !== 0) {
      V = S / (k * I);
      step(`V = S / (${kLabel} · I)`, `V = ${fmt(S)} VA / (${kLabel} · ${fmt(I)} A) = ${fmt(V)} V`);
    }
  }

  if (S === undefined) {
    warnings.push({
      code: "insufficient-inputs",
      message: "Not enough inputs to determine apparent power. Provide V & I, or kVA, or kW & PF.",
    });
  }
  if (pf !== undefined && (pf < 0 || pf > 1)) {
    warnings.push({
      code: "pf-out-of-range",
      message: `Power factor ${fmt(pf)} is outside the valid 0–1 range.`,
    });
  }

  return {
    phase: input.phase,
    volts: V ?? NaN,
    amps: I ?? NaN,
    kva: S !== undefined ? S / 1000 : NaN,
    kw: P !== undefined ? P / 1000 : NaN,
    pf: pf ?? NaN,
    work,
    warnings,
  };
}
