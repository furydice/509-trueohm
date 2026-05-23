import { describe, it, expect } from "vitest";
import { solveEfficiency } from "../src/engine/efficiency";

describe("solveEfficiency", () => {
  it("1800 W out / 2000 W in => 90%", () => {
    const r = solveEfficiency({ pOutW: 1800, pInW: 2000 });
    expect(r.efficiency).toBeCloseTo(0.9, 6);
    expect(r.warnings).toHaveLength(0);
  });

  it("solves output from input & efficiency", () => {
    const r = solveEfficiency({ pInW: 2000, efficiency: 0.9 });
    expect(r.pOutW).toBeCloseTo(1800, 6);
  });

  it("solves input from output & efficiency", () => {
    const r = solveEfficiency({ pOutW: 1800, efficiency: 0.9 });
    expect(r.pInW).toBeCloseTo(2000, 6);
  });

  it("warns when efficiency exceeds 100%", () => {
    const r = solveEfficiency({ pOutW: 2200, pInW: 2000 });
    expect(r.warnings.some((w) => w.code === "efficiency-over-100")).toBe(true);
  });

  it("warns when inputs are insufficient", () => {
    const r = solveEfficiency({ pOutW: 1800 });
    expect(r.warnings.some((w) => w.code === "insufficient-inputs")).toBe(true);
  });

  it("warns on divide-by-zero (input power = 0)", () => {
    const r = solveEfficiency({ pOutW: 1800, pInW: 0 });
    expect(r.warnings.some((w) => w.code === "divide-by-zero")).toBe(true);
  });

  it("warns on negative input", () => {
    const r = solveEfficiency({ pOutW: -1800, pInW: 2000 });
    expect(r.warnings.some((w) => w.code === "negative-input")).toBe(true);
  });
});
