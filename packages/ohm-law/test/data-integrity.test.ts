import { describe, it, expect } from "vitest";
import { SQRT3, DEFAULT_RATE_PER_KWH } from "../src/constants";

describe("constants", () => {
  it("SQRT3 matches √3", () => {
    expect(SQRT3).toBeCloseTo(1.7320508, 7);
  });

  it("default electricity rate is a positive $/kWh", () => {
    expect(DEFAULT_RATE_PER_KWH).toBeGreaterThan(0);
    expect(DEFAULT_RATE_PER_KWH).toBeLessThan(1);
  });
});
