import { describe, it, expect } from "vitest";
import { solvePowerTriangle } from "../src/engine/power-triangle";

// Hand-verified anchor: P = 80 kW, S = 100 kVA => PF 0.8, Q 60 kVAR, θ 36.87°.
describe("solvePowerTriangle — input pairs all reach the same triangle", () => {
  it("kW & kVA => PF, kVAR, angle", () => {
    const r = solvePowerTriangle({ kw: 80, kva: 100 });
    expect(r.pf).toBeCloseTo(0.8, 4);
    expect(r.kvar).toBeCloseTo(60, 3);
    expect(r.angleDeg).toBeCloseTo(36.87, 1);
  });

  it("kW & kVAR => kVA, PF, angle", () => {
    const r = solvePowerTriangle({ kw: 80, kvar: 60 });
    expect(r.kva).toBeCloseTo(100, 4);
    expect(r.pf).toBeCloseTo(0.8, 4);
    expect(r.angleDeg).toBeCloseTo(36.87, 1);
  });

  it("kVA & PF => kW, kVAR, angle", () => {
    const r = solvePowerTriangle({ kva: 100, pf: 0.8 });
    expect(r.kw).toBeCloseTo(80, 4);
    expect(r.kvar).toBeCloseTo(60, 3);
    expect(r.angleDeg).toBeCloseTo(36.87, 1);
  });

  it("kW & PF => kVA, kVAR", () => {
    const r = solvePowerTriangle({ kw: 80, pf: 0.8 });
    expect(r.kva).toBeCloseTo(100, 4);
    expect(r.kvar).toBeCloseTo(60, 3);
  });

  it("kVA & angle => PF, kW, kVAR", () => {
    const r = solvePowerTriangle({ kva: 100, angleDeg: 36.87 });
    expect(r.pf).toBeCloseTo(0.8, 3);
    expect(r.kw).toBeCloseTo(80, 2);
    expect(r.kvar).toBeCloseTo(60, 2);
  });
});

describe("solvePowerTriangle — sanity (warn, never block)", () => {
  it("warns on impossible triangle (real power exceeds apparent)", () => {
    const r = solvePowerTriangle({ kw: 100, kva: 80 });
    expect(r.warnings.some((w) => w.code === "impossible-triangle")).toBe(true);
  });

  it("warns on power factor out of range", () => {
    const r = solvePowerTriangle({ kva: 100, pf: 1.2 });
    expect(r.warnings.some((w) => w.code === "pf-out-of-range")).toBe(true);
  });

  it("warns when inputs cannot establish magnitude (angle + PF only)", () => {
    const r = solvePowerTriangle({ pf: 0.8, angleDeg: 36.87 });
    expect(r.warnings.some((w) => w.code === "insufficient-inputs")).toBe(true);
  });

  it("warns on negative input", () => {
    const r = solvePowerTriangle({ kw: -80, kva: 100 });
    expect(r.warnings.some((w) => w.code === "negative-input")).toBe(true);
  });

  it("produces show-your-work steps", () => {
    const r = solvePowerTriangle({ kw: 80, kva: 100 });
    expect(r.work.length).toBeGreaterThan(0);
    expect(r.work[0].substitution).toContain("=");
  });
});
