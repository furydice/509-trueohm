// Shared engine types for TrueOhm. Zero runtime dependencies.

/** A single rendered calculation step for the "show your work" panel. */
export interface Work {
  /** Symbolic formula, e.g. "I = P / V". */
  formula: string;
  /** Substituted values, e.g. "I = 1440 / 120 = 12 A". */
  substitution: string;
  /** Optional note (e.g. which constant or assumption was used). */
  note?: string;
}

export type WarningCode =
  | "pf-out-of-range"
  | "negative-input"
  | "divide-by-zero"
  | "impossible-triangle"
  | "efficiency-over-100"
  | "insufficient-inputs"
  | "overdetermined";

/** A non-blocking sanity flag. The engine always still computes a best-effort result. */
export interface Warning {
  code: WarningCode;
  message: string;
}

export type Phase = 1 | 3;

// ---------------------------------------------------------------------------
// Ohm's Law wheel — enter any 2 of { volts, amps, ohms, watts }, solve the rest.
// ---------------------------------------------------------------------------
export interface OhmsWheelInput {
  volts?: number;
  amps?: number;
  ohms?: number;
  watts?: number;
}

export interface OhmsWheelResult {
  volts: number;
  amps: number;
  ohms: number;
  watts: number;
  work: Work[];
  warnings: Warning[];
}

// ---------------------------------------------------------------------------
// AC Power — relate { V, I, kVA, kW, PF } for 1Ø / 3Ø. Solve for the unknown(s).
// Voltage is line-to-line for 3Ø.
// ---------------------------------------------------------------------------
export interface AcPowerInput {
  phase: Phase;
  powerFactor?: number;
  volts?: number;
  amps?: number;
  kva?: number;
  kw?: number;
}

export interface AcPowerResult {
  phase: Phase;
  volts: number;
  amps: number;
  kva: number;
  kw: number;
  pf: number;
  work: Work[];
  warnings: Warning[];
}

// ---------------------------------------------------------------------------
// Power Triangle — enter any 2 of { kW (P), kVAR (Q), kVA (S), pf, angleDeg },
// solve the rest. S² = P² + Q², pf = P/S, angle = acos(pf).
// ---------------------------------------------------------------------------
export interface PowerTriangleInput {
  kw?: number;
  kvar?: number;
  kva?: number;
  pf?: number;
  angleDeg?: number;
}

export interface PowerTriangleResult {
  kw: number;
  kvar: number;
  kva: number;
  pf: number;
  angleDeg: number;
  work: Work[];
  warnings: Warning[];
}

// ---------------------------------------------------------------------------
// Energy Cost — kW × hours × $/kWh.
// ---------------------------------------------------------------------------
export interface EnergyCostInput {
  kw: number;
  hours: number;
  /** $/kWh. Defaults to DEFAULT_RATE_PER_KWH when omitted. */
  ratePerKwh?: number;
}

export interface EnergyCostResult {
  kwh: number;
  cost: number;
  ratePerKwh: number;
  work: Work[];
  warnings: Warning[];
}

// ---------------------------------------------------------------------------
// Efficiency — η = P_out / P_in. Enter any 2 of { pOutW, pInW, efficiency }.
// efficiency is a fraction (0–1); UI renders it as a percentage.
// ---------------------------------------------------------------------------
export interface EfficiencyInput {
  pOutW?: number;
  pInW?: number;
  efficiency?: number;
}

export interface EfficiencyResult {
  pOutW: number;
  pInW: number;
  efficiency: number;
  work: Work[];
  warnings: Warning[];
}
