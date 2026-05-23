import { describe, it, expect } from "vitest";
import { solveOhmsWheel } from "../src/engine/ohms-wheel";

// Hand-verified anchor: 120 V across 10 Ω => 12 A, 1440 W.
describe("solveOhmsWheel — six input pairs", () => {
  it("V & R => I, P", () => {
    const r = solveOhmsWheel({ volts: 120, ohms: 10 });
    expect(r.amps).toBeCloseTo(12, 6);
    expect(r.watts).toBeCloseTo(1440, 6);
    expect(r.volts).toBe(120);
    expect(r.ohms).toBe(10);
    expect(r.warnings).toHaveLength(0);
  });

  it("V & I => R, P", () => {
    const r = solveOhmsWheel({ volts: 120, amps: 12 });
    expect(r.ohms).toBeCloseTo(10, 6);
    expect(r.watts).toBeCloseTo(1440, 6);
  });

  it("V & P => I, R", () => {
    const r = solveOhmsWheel({ volts: 120, watts: 1440 });
    expect(r.amps).toBeCloseTo(12, 6);
    expect(r.ohms).toBeCloseTo(10, 6);
  });

  it("I & R => V, P", () => {
    const r = solveOhmsWheel({ amps: 12, ohms: 10 });
    expect(r.volts).toBeCloseTo(120, 6);
    expect(r.watts).toBeCloseTo(1440, 6);
  });

  it("I & P => V, R", () => {
    const r = solveOhmsWheel({ amps: 12, watts: 1440 });
    expect(r.volts).toBeCloseTo(120, 6);
    expect(r.ohms).toBeCloseTo(10, 6);
  });

  it("R & P => I, V", () => {
    const r = solveOhmsWheel({ ohms: 10, watts: 1440 });
    expect(r.amps).toBeCloseTo(12, 6);
    expect(r.volts).toBeCloseTo(120, 6);
  });
});

describe("solveOhmsWheel — show your work", () => {
  it("records two formulas for a solve", () => {
    const r = solveOhmsWheel({ volts: 120, ohms: 10 });
    expect(r.work).toHaveLength(2);
    expect(r.work[0].formula.length).toBeGreaterThan(0);
    expect(r.work[0].substitution).toContain("=");
  });
});

describe("solveOhmsWheel — sanity (warn, never block)", () => {
  it("warns when fewer than two inputs are given", () => {
    const r = solveOhmsWheel({ volts: 120 });
    expect(r.warnings.some((w) => w.code === "insufficient-inputs")).toBe(true);
  });

  it("warns when over-determined (more than two inputs)", () => {
    const r = solveOhmsWheel({ volts: 120, amps: 12, ohms: 10, watts: 1440 });
    expect(r.warnings.some((w) => w.code === "overdetermined")).toBe(true);
    // still computes a coherent result
    expect(r.watts).toBeCloseTo(1440, 6);
  });

  it("warns on divide-by-zero (I = 0 while deriving R = V/I)", () => {
    const r = solveOhmsWheel({ volts: 120, amps: 0 });
    expect(r.warnings.some((w) => w.code === "divide-by-zero")).toBe(true);
  });

  it("warns on negative input", () => {
    const r = solveOhmsWheel({ volts: -120, amps: 12 });
    expect(r.warnings.some((w) => w.code === "negative-input")).toBe(true);
  });
});
