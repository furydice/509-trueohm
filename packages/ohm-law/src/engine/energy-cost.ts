import type { EnergyCostInput, EnergyCostResult, Warning, Work } from "../types";
import { DEFAULT_RATE_PER_KWH } from "../constants";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(4)));
}

/**
 * Energy & cost over a run: kWh = kW · hours, cost = kWh · $/kWh.
 * Rate defaults to DEFAULT_RATE_PER_KWH. Warns (never blocks) on negatives.
 */
export function solveEnergyCost(input: EnergyCostInput): EnergyCostResult {
  const warnings: Warning[] = [];
  const work: Work[] = [];
  const ratePerKwh = input.ratePerKwh ?? DEFAULT_RATE_PER_KWH;

  const named: Array<[string, number]> = [
    ["kw", input.kw],
    ["hours", input.hours],
    ["ratePerKwh", ratePerKwh],
  ];
  for (const [name, val] of named) {
    if (val < 0) warnings.push({ code: "negative-input", message: `${name} cannot be negative.` });
  }

  const kwh = input.kw * input.hours;
  const cost = kwh * ratePerKwh;

  work.push({
    formula: "kWh = kW · hours",
    substitution: `kWh = ${fmt(input.kw)} · ${fmt(input.hours)} = ${fmt(kwh)} kWh`,
  });
  work.push({
    formula: "cost = kWh · rate",
    substitution: `cost = ${fmt(kwh)} kWh · $${fmt(ratePerKwh)} = $${fmt(cost)}`,
  });

  return { kwh, cost, ratePerKwh, work, warnings };
}
