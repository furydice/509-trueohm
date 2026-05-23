import { describe, it, expect } from "vitest";
import { solveAcPower } from "../src/engine/ac-power";
import { SQRT3 } from "../src/constants";

describe("solveAcPower — forward (V, I, PF -> kVA, kW)", () => {
  it("1Ø: 240 V, 30 A, PF 1 => 7.2 kVA / 7.2 kW", () => {
    const r = solveAcPower({ phase: 1, volts: 240, amps: 30, powerFactor: 1 });
    expect(r.kva).toBeCloseTo(7.2, 4);
    expect(r.kw).toBeCloseTo(7.2, 4);
    expect(r.pf).toBeCloseTo(1, 6);
    expect(r.warnings).toHaveLength(0);
  });

  it("3Ø: 480 V, 100 A => 83.14 kVA (uses √3)", () => {
    const r = solveAcPower({ phase: 3, volts: 480, amps: 100, powerFactor: 1 });
    expect(r.kva).toBeCloseTo((SQRT3 * 480 * 100) / 1000, 4);
    expect(r.kva).toBeCloseTo(83.14, 1);
  });

  it("3Ø: 480 V, 100 A, PF 0.85 => 70.67 kW", () => {
    const r = solveAcPower({ phase: 3, volts: 480, amps: 100, powerFactor: 0.85 });
    expect(r.kw).toBeCloseTo(70.67, 1);
  });

  it("three-phase apparent power is √3× the single-phase value for same V & I", () => {
    const one = solveAcPower({ phase: 1, volts: 480, amps: 100, powerFactor: 1 });
    const three = solveAcPower({ phase: 3, volts: 480, amps: 100, powerFactor: 1 });
    expect(three.kva / one.kva).toBeCloseTo(SQRT3, 6);
  });
});

describe("solveAcPower — reverse (solve for the unknown)", () => {
  it("solves amps from kVA & volts (3Ø)", () => {
    const r = solveAcPower({ phase: 3, volts: 480, kva: 83.138 });
    expect(r.amps).toBeCloseTo(100, 2);
  });

  it("solves volts from kVA & amps (1Ø)", () => {
    const r = solveAcPower({ phase: 1, amps: 30, kva: 7.2 });
    expect(r.volts).toBeCloseTo(240, 4);
  });

  it("solves PF from kVA & kW", () => {
    const r = solveAcPower({ phase: 1, kva: 10, kw: 8 });
    expect(r.pf).toBeCloseTo(0.8, 6);
  });

  it("solves kW from kVA & PF", () => {
    const r = solveAcPower({ phase: 3, kva: 100, powerFactor: 0.9 });
    expect(r.kw).toBeCloseTo(90, 6);
  });

  it("solves amps from kW, volts, PF (3Ø)", () => {
    const r = solveAcPower({ phase: 3, volts: 480, kw: 70.67, powerFactor: 0.85 });
    expect(r.amps).toBeCloseTo(100, 1);
  });
});

describe("solveAcPower — sanity (warn, never block)", () => {
  it("warns on power factor out of range", () => {
    const r = solveAcPower({ phase: 1, volts: 240, amps: 30, powerFactor: 1.2 });
    expect(r.warnings.some((w) => w.code === "pf-out-of-range")).toBe(true);
  });

  it("warns when inputs are insufficient to solve", () => {
    const r = solveAcPower({ phase: 1, volts: 240 });
    expect(r.warnings.some((w) => w.code === "insufficient-inputs")).toBe(true);
  });

  it("warns on negative input", () => {
    const r = solveAcPower({ phase: 1, volts: -240, amps: 30, powerFactor: 1 });
    expect(r.warnings.some((w) => w.code === "negative-input")).toBe(true);
  });

  it("produces show-your-work steps", () => {
    const r = solveAcPower({ phase: 3, volts: 480, amps: 100, powerFactor: 0.85 });
    expect(r.work.length).toBeGreaterThan(0);
    expect(r.work[0].substitution).toContain("=");
  });
});
