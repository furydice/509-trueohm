// Engine constants. No NEC tables live here — TrueOhm is the fundamentals calculator.

/** √3, used for three-phase power (P = √3·V_LL·I·PF). */
export const SQRT3 = Math.sqrt(3);

/** Default electricity rate ($/kWh) for the Energy Cost calculator. Redline-able. */
export const DEFAULT_RATE_PER_KWH = 0.15;
