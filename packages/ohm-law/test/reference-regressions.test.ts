import { describe, it, expect } from "vitest";
import cases from "./reference-cases/benchmark.json";
import {
  solveOhmsWheel,
  solveAcPower,
  solvePowerTriangle,
  solveEnergyCost,
  solveEfficiency,
} from "../src/index";
import type {
  AcPowerInput,
  EfficiencyInput,
  EnergyCostInput,
  OhmsWheelInput,
  PowerTriangleInput,
} from "../src/types";

interface Case {
  calc: string;
  name: string;
  input: Record<string, number>;
  expect: Record<string, number>;
  tol: number;
}

function run(c: Case): Record<string, number> {
  let result: unknown;
  switch (c.calc) {
    case "ohms-wheel":
      result = solveOhmsWheel(c.input as unknown as OhmsWheelInput);
      break;
    case "ac-power":
      result = solveAcPower(c.input as unknown as AcPowerInput);
      break;
    case "power-triangle":
      result = solvePowerTriangle(c.input as unknown as PowerTriangleInput);
      break;
    case "energy-cost":
      result = solveEnergyCost(c.input as unknown as EnergyCostInput);
      break;
    case "efficiency":
      result = solveEfficiency(c.input as unknown as EfficiencyInput);
      break;
    default:
      throw new Error(`unknown calc: ${c.calc}`);
  }
  return result as Record<string, number>;
}

describe("reference regressions (hand-verified)", () => {
  for (const c of cases as unknown as Case[]) {
    it(`${c.calc}: ${c.name}`, () => {
      const r = run(c);
      for (const [field, expected] of Object.entries(c.expect)) {
        expect(Math.abs(r[field] - expected), `${field} (got ${r[field]})`).toBeLessThanOrEqual(
          c.tol,
        );
      }
    });
  }
});
