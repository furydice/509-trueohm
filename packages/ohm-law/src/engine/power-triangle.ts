import type { PowerTriangleInput, PowerTriangleResult, Warning, Work } from "../types";

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;
const EPS = 1e-9;

function fmt(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(4)));
}
const clampUnit = (n: number) => Math.min(1, Math.max(-1, n));

/**
 * Solve the power triangle. Enter any two of { kW (P), kVAR (Q), kVA (S), PF (cosθ),
 * angleDeg (θ) }; the rest are derived from S² = P² + Q², PF = P/S, θ = acos(PF).
 * Warns (never blocks) on negatives, out-of-range PF, impossible triangles
 * (P > S), and inputs that can't establish magnitude.
 */
export function solvePowerTriangle(input: PowerTriangleInput): PowerTriangleResult {
  const warnings: Warning[] = [];
  const work: Work[] = [];

  const named: Array<[string, number | undefined]> = [
    ["kw", input.kw],
    ["kvar", input.kvar],
    ["kva", input.kva],
    ["pf", input.pf],
    ["angleDeg", input.angleDeg],
  ];
  for (const [name, val] of named) {
    if (val !== undefined && val < 0) {
      warnings.push({ code: "negative-input", message: `${name} cannot be negative.` });
    }
  }

  let P = input.kw;
  let Q = input.kvar;
  let S = input.kva;
  let pf = input.pf;
  let angle = input.angleDeg !== undefined ? input.angleDeg * DEG2RAD : undefined; // radians

  const step = (formula: string, substitution: string) => work.push({ formula, substitution });

  for (let pass = 0; pass < 5; pass++) {
    if (angle === undefined && pf !== undefined) {
      angle = Math.acos(clampUnit(pf));
      step("θ = acos(PF)", `θ = acos(${fmt(pf)}) = ${fmt(angle * RAD2DEG)}°`);
    }
    if (pf === undefined && angle !== undefined) {
      pf = Math.cos(angle);
      step("PF = cos(θ)", `PF = cos(${fmt(angle * RAD2DEG)}°) = ${fmt(pf)}`);
    }
    if (pf === undefined && P !== undefined && S !== undefined && S !== 0) {
      pf = P / S;
      step("PF = P / S", `PF = ${fmt(P)} kW / ${fmt(S)} kVA = ${fmt(pf)}`);
    }
    if (S === undefined && P !== undefined && Q !== undefined) {
      S = Math.hypot(P, Q);
      step("S = √(P² + Q²)", `S = √(${fmt(P)}² + ${fmt(Q)}²) = ${fmt(S)} kVA`);
    }
    if (S === undefined && P !== undefined && pf !== undefined && pf !== 0) {
      S = P / pf;
      step("S = P / PF", `S = ${fmt(P)} kW / ${fmt(pf)} = ${fmt(S)} kVA`);
    }
    if (S === undefined && Q !== undefined && angle !== undefined && Math.abs(Math.sin(angle)) > EPS) {
      S = Q / Math.sin(angle);
      step("S = Q / sin(θ)", `S = ${fmt(Q)} kVAR / sin(${fmt(angle * RAD2DEG)}°) = ${fmt(S)} kVA`);
    }
    if (P === undefined && S !== undefined && pf !== undefined) {
      P = S * pf;
      step("P = S · PF", `P = ${fmt(S)} kVA · ${fmt(pf)} = ${fmt(P)} kW`);
    }
    if (P === undefined && S !== undefined && Q !== undefined) {
      P = Math.sqrt(Math.max(S * S - Q * Q, 0));
      step("P = √(S² − Q²)", `P = √(${fmt(S)}² − ${fmt(Q)}²) = ${fmt(P)} kW`);
    }
    if (Q === undefined && S !== undefined && P !== undefined) {
      Q = Math.sqrt(Math.max(S * S - P * P, 0));
      step("Q = √(S² − P²)", `Q = √(${fmt(S)}² − ${fmt(P)}²) = ${fmt(Q)} kVAR`);
    }
    if (Q === undefined && S !== undefined && angle !== undefined) {
      Q = S * Math.sin(angle);
      step("Q = S · sin(θ)", `Q = ${fmt(S)} kVA · sin(${fmt(angle * RAD2DEG)}°) = ${fmt(Q)} kVAR`);
    }
  }

  if (S === undefined) {
    warnings.push({
      code: "insufficient-inputs",
      message: "Not enough inputs to establish magnitude. Provide at least one of kW / kVAR / kVA with a second value.",
    });
  }
  if (pf !== undefined && (pf < 0 || pf > 1)) {
    warnings.push({
      code: "pf-out-of-range",
      message: `Power factor ${fmt(pf)} is outside the valid 0–1 range.`,
    });
  }
  if (P !== undefined && S !== undefined && P > S + EPS) {
    warnings.push({
      code: "impossible-triangle",
      message: `Real power (${fmt(P)} kW) exceeds apparent power (${fmt(S)} kVA) — not physically possible.`,
    });
  }

  return {
    kw: P ?? NaN,
    kvar: Q ?? NaN,
    kva: S ?? NaN,
    pf: pf ?? NaN,
    angleDeg: angle !== undefined ? angle * RAD2DEG : NaN,
    work,
    warnings,
  };
}
