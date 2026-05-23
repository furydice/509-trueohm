import { describe, it, expect } from "vitest";
import { solveEnergyCost } from "../src/engine/energy-cost";
import { DEFAULT_RATE_PER_KWH } from "../src/constants";

describe("solveEnergyCost", () => {
  it("5 kW × 8 h × $0.12 => 40 kWh, $4.80", () => {
    const r = solveEnergyCost({ kw: 5, hours: 8, ratePerKwh: 0.12 });
    expect(r.kwh).toBeCloseTo(40, 6);
    expect(r.cost).toBeCloseTo(4.8, 6);
    expect(r.ratePerKwh).toBe(0.12);
    expect(r.warnings).toHaveLength(0);
  });

  it("falls back to the default rate when none is given", () => {
    const r = solveEnergyCost({ kw: 5, hours: 8 });
    expect(r.ratePerKwh).toBe(DEFAULT_RATE_PER_KWH);
    expect(r.cost).toBeCloseTo(40 * DEFAULT_RATE_PER_KWH, 6);
  });

  it("warns on negative input", () => {
    const r = solveEnergyCost({ kw: -5, hours: 8 });
    expect(r.warnings.some((w) => w.code === "negative-input")).toBe(true);
  });

  it("produces show-your-work steps", () => {
    const r = solveEnergyCost({ kw: 5, hours: 8, ratePerKwh: 0.12 });
    expect(r.work.length).toBeGreaterThan(0);
    expect(r.work[0].substitution).toContain("=");
  });
});
