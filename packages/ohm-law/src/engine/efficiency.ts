import type { EfficiencyInput, EfficiencyResult, Warning, Work } from "../types";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(4)));
}

/**
 * Efficiency η = P_out / P_in. Enter any two of { pOutW, pInW, efficiency } (a
 * fraction 0–1) and the third is derived. Warns (never blocks) on negatives,
 * divide-by-zero, insufficient inputs, and η > 100%.
 */
export function solveEfficiency(input: EfficiencyInput): EfficiencyResult {
  const warnings: Warning[] = [];
  const work: Work[] = [];

  const named: Array<[string, number | undefined]> = [
    ["pOutW", input.pOutW],
    ["pInW", input.pInW],
    ["efficiency", input.efficiency],
  ];
  for (const [name, val] of named) {
    if (val !== undefined && val < 0) {
      warnings.push({ code: "negative-input", message: `${name} cannot be negative.` });
    }
  }

  let pOutW = input.pOutW;
  let pInW = input.pInW;
  let efficiency = input.efficiency;
  const provided = named.filter(([, v]) => v !== undefined).length;
  const pushDivZero = () => {
    if (!warnings.some((w) => w.code === "divide-by-zero")) {
      warnings.push({ code: "divide-by-zero", message: "Division by zero — check inputs." });
    }
  };
  const step = (formula: string, substitution: string) => work.push({ formula, substitution });

  if (provided < 2) {
    warnings.push({
      code: "insufficient-inputs",
      message: "Enter two of: output power, input power, efficiency.",
    });
    return { pOutW: pOutW ?? NaN, pInW: pInW ?? NaN, efficiency: efficiency ?? NaN, work, warnings };
  }

  if (efficiency === undefined && pOutW !== undefined && pInW !== undefined) {
    if (pInW === 0) pushDivZero();
    efficiency = pOutW / pInW;
    step("η = P_out / P_in", `η = ${fmt(pOutW)} W / ${fmt(pInW)} W = ${fmt(efficiency)} (${fmt(efficiency * 100)}%)`);
  } else if (pOutW === undefined && pInW !== undefined && efficiency !== undefined) {
    pOutW = efficiency * pInW;
    step("P_out = η · P_in", `P_out = ${fmt(efficiency)} · ${fmt(pInW)} W = ${fmt(pOutW)} W`);
  } else if (pInW === undefined && pOutW !== undefined && efficiency !== undefined) {
    if (efficiency === 0) pushDivZero();
    pInW = pOutW / efficiency;
    step("P_in = P_out / η", `P_in = ${fmt(pOutW)} W / ${fmt(efficiency)} = ${fmt(pInW)} W`);
  }

  if (efficiency !== undefined && efficiency > 1) {
    warnings.push({
      code: "efficiency-over-100",
      message: `Efficiency ${fmt(efficiency * 100)}% exceeds 100% — output cannot exceed input.`,
    });
  }

  return { pOutW: pOutW ?? NaN, pInW: pInW ?? NaN, efficiency: efficiency ?? NaN, work, warnings };
}
