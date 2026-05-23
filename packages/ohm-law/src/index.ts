// @509-trueohm/ohm-law — public API barrel.
export * from "./types";
export { SQRT3, DEFAULT_RATE_PER_KWH } from "./constants";

export { solveOhmsWheel } from "./engine/ohms-wheel";

// Solvers are exported as each is implemented (Phases 4–7):
//   export { solveAcPower } from "./engine/ac-power";
//   export { solvePowerTriangle } from "./engine/power-triangle";
//   export { solveEnergyCost } from "./engine/energy-cost";
//   export { solveEfficiency } from "./engine/efficiency";
