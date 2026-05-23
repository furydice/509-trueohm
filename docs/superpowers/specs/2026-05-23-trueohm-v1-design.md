# TrueOhm V1 — Design Spec

**Date:** 2026-05-23
**Status:** Approved scope, pre-implementation
**Author:** Nick (509 Electric) + Claude

## 1. Summary

TrueOhm is a fast, clear Ohm's-law and power calculator for working US electricians
and apprentices — the everyday "what's the current / power / kVA?" tool that is correct,
shows its math, and never makes you guess which formula to use. It is part of the True\*
suite (TrueBend, TruePhase, TrueFault, TrueRate, TrueDrop, TrueMotor, TrueFill) and clones
the established React + Vite + Capacitor monorepo template.

**Monetization: free brand funnel.** No paywall, no IAP, no Pro guard. TrueOhm is fully
free — it exists to put 509 Electric in front of electricians (especially apprentices) and
funnel installs to the paid suite. Same model as TrueDrop, and the right fit here because
basic Ohm's-law calculators are a crowded free commodity — a paywall would only lose to free.

## 2. Market context (why this shape)

- **Ohm's-law / "electrical wheel" calculators are a free commodity.** Dozens of free apps
  do V/I/R/P. None can be sold on feature parity, so a paywall doesn't fit.
- **Most free ones are cluttered or ad-ridden** and do the math without showing it.
- **TrueOhm wins on execution:** speed, clarity, "show your work," and suite-grade polish.
- **The genuinely useful, less-commoditized piece is AC power** — relating volts, amps,
  kVA, kW, and power factor for single- *and* three-phase (with √3). That, plus the power
  triangle, is where electricians actually reach for a tool, and where wrong/unclear apps
  cause mistakes.
- **Differentiator is trust + clarity:** solve for *any* unknown, always display the exact
  formula with substituted values, and run non-blocking sanity checks (PF in range, no
  divide-by-zero, no impossible power triangle).

## 3. Scope

### In scope (V1 — "five tight calculators")

- **Ohm's Law wheel** — enter any 2 of { V, I, R, P }, solve the other two (DC / resistive).
- **AC Power (1Ø & 3Ø)** — relate { V, I, kVA, kW, PF }; solve for any single unknown.
  Three-phase uses √3 on line-to-line voltage.
- **Power Triangle** — enter any 2 of { kW (P), kVAR (Q), kVA (S), PF (cosθ), angle θ };
  solve the rest.
- **Energy Cost** — kW × hours × $/kWh → kWh and cost.
- **Efficiency** — η = P_out / P_in; solve any unknown, express as %.
- "Show your work" on every result (formula + substituted values).
- Non-blocking sanity warnings (warn, never block — TrueFault discipline).
- Light/dark mode, Universal iPhone/iPad layout.
- 509 Electric branding + "More 509 Tools" cross-promo screen.

### Deferred to V1.1

- Saved / history of calculations.
- Unit toggles (e.g., mΩ, kW vs W, HP ↔ kW conversion helper).
- Voltage-divider / series-parallel resistance helpers.
- 3-phase line vs phase (delta/wye) voltage-current relationships.

### Explicit non-goals

- No subscription, IAP, or Pro gate.
- No cloud sync / accounts (local-only).
- No NEC sizing/ampacity logic — that lives in TrueDrop / TrueMotor. TrueOhm is the
  fundamentals calculator.
- TrueOhm is a calculation *aid* for qualified professionals, not an engineering decision tool.

## 4. Architecture

Clones the True\* calc-app template (TrueDrop / TrueFault / TruePhase / TrueBend),
**React + Vite + Capacitor** (not Next.js — that is TrueRate's business-app stack).

```
509-trueohm/
  packages/
    ohm-law/             # zero-dependency TS engine + constants + vitest
  apps/
    web/                 # React + Vite + Capacitor web/iOS app
  docs/
    superpowers/specs/   # this spec
    superpowers/plans/   # implementation plan
  pnpm-workspace.yaml
  package.json
  tsconfig.base.json
```

**No StoreKit / native purchase bridge** (free app) — the one deliberate deletion from the
template (same as TrueDrop), which also removes IAP-related App Store gates. iOS wrapper
(`apps/ios`) + `codemagic.yaml` are generated later, when shipping to TestFlight.

## 5. The engine (`packages/ohm-law`)

Zero-dependency TypeScript. No UI, no framework imports. This is the trust core and is
fully unit-tested. Every solver returns `{ <solved values>, work, warnings }`.

### 5.1 Calculators & inputs

| Calculator | Inputs (enter a subset) | Solves |
| --- | --- | --- |
| Ohm's Law wheel | any 2 of: volts, amps, ohms, watts | the other two |
| AC Power | phase (1Ø/3Ø), powerFactor, + any single unknown among volts (L-L for 3Ø), amps, kVA, kW | the unknown |
| Power Triangle | any 2 of: kW (P), kVAR (Q), kVA (S), pf (cosθ), angleDeg (θ) | the rest |
| Energy Cost | kW, hours, ratePerKwh (default 0.15) | kWh, cost |
| Efficiency | any 2 of: pOutW, pInW, efficiency (0–1) | the third (η as %) |

### 5.2 Methods (formulas)

**Ohm's Law wheel** (the 12-formula wheel; pick the pair that uses the two knowns):
```
V = I·R        P = V·I        R = V/I        I = P/V
V = P/I        P = I²·R       R = V²/P       I = V/R
V = √(P·R)     P = V²/R       R = P/I²       I = √(P/R)
```

**AC Power:**
```
1Ø:  S = V·I            P = V·I·PF
3Ø:  S = √3·V_LL·I      P = √3·V_LL·I·PF
PF = P / S
```
Solve for the single unknown by algebraic rearrangement of the relevant pair.

**Power Triangle:**
```
S² = P² + Q²     PF = cosθ = P / S     θ = acos(PF)     Q = S·sinθ
```

**Energy Cost:** `kWh = kW · hours`,  `cost = kWh · ratePerKwh`.

**Efficiency:** `η = P_out / P_in` (report as %).

### 5.3 "Show your work" (the differentiator vs free commodity apps)

Every result carries a `work` object: the chosen `formula` string, the substituted-values
rendering (e.g., `I = P / V = 1440 / 120 = 12 A`), and the constants used (e.g., √3 for 3Ø).
The UI "how this was calculated" panel renders it verbatim.

### 5.4 Sanity checks (warn, never block)

`sanity.ts` emits `Warning[]`; solvers attach them but **always compute and stay editable**
(TrueFault "draft must remain editable" discipline):
- Power factor outside 0–1.
- Negative magnitudes for V/I/R/P/kVA/kW.
- Divide-by-zero inputs (R = 0, I = 0, V = 0 where it would divide).
- Impossible power triangle (S < P, i.e. real power exceeds apparent).
- Efficiency > 100% (P_out > P_in).

### 5.5 Constants & data

No NEC tables → no transcription/`// VERIFY` burden. `constants.ts` holds `SQRT3` and the
default electricity rate. Trust comes from show-your-work + sanity checks + the
reference-regression suite (§8), not from embedded code tables.

### 5.6 Engine API (sketch)

```ts
solveOhmsWheel(input):    { volts, amps, ohms, watts, work, warnings }
solveAcPower(input):      { volts, amps, kva, kw, pf, phase, work, warnings }
solvePowerTriangle(input):{ kw, kvar, kva, pf, angleDeg, work, warnings }
solveEnergyCost(input):   { kwh, cost, work, warnings }
solveEfficiency(input):   { pOutW, pInW, efficiency, work, warnings }
```
`work` carries the rendered formula + substituted values; `warnings[]` carries sanity results.

## 6. UI (`apps/web`)

Mirrors the suite design contract; visual design produced in **Claude Design**
("TrueOhm V1 App Design") and approved before the UI is built.

- Segmented mode switcher across the five calculators.
- Per-calculator input fields; the field the user leaves blank is the one solved
  (or, for the wheel/triangle, the two left blank).
- Results card: large primary result, secondary results below, expandable "how this was
  calculated" rendering the `work`.
- Sanity warnings surfaced inline, plainly worded, non-blocking.
- Light/dark, Universal iPhone/iPad layout.
- "More 509 Tools" screen linking the paid suite on the App Store.
- Design tokens reused verbatim from the suite: gold accent `#ffc53d`, SF Pro / SF Mono,
  near-black `#0b0b0d` surfaces (dark) + warm paper (light).

## 7. Guardrails (TrueFault discipline)

- "Calculations are aids for qualified professionals, not engineering decisions."
- Inputs, assumptions, and warnings stay visible with every result.
- Draft work remains editable when any sanity check warns.
- App Store privacy answers match the shipped binary (no IAP / services to declare).

## 8. Testing

- `packages/ohm-law`: vitest unit suite covering every calculator, every solve-for-unknown
  path, 1Ø/3Ø for AC power, and each sanity-check trigger.
- Reference-regression suite: a JSON set of hand-verified cases (mirrors TrueDrop /
  TrueFault `reference-cases`) spanning all five calculators — e.g. 120 V & 10 Ω → 12 A /
  1440 W; 480 V 3Ø @ 100 A → 83.1 kVA, @ PF 0.85 → 70.7 kW; P 80 kW / S 100 kVA → PF 0.8,
  Q 60 kVAR, θ 36.87°; 5 kW × 8 h × $0.12 → 40 kWh / $4.80; 1800 W / 2000 W → 90%.
- Sanity-check warnings have dedicated tests (each trigger flagged, never blocked).
- A small data-integrity test asserts the constants (e.g., SQRT3 ≈ 1.7320508).

## 9. Release path (mirrors suite)

GitHub repo → Codemagic iOS signing/build → App Store Connect / TestFlight. No IAP
configuration. Reuses the suite's signing approach (provisioning profile uploaded to the
**Codemagic Code signing identities store**, shared `509Electric AppStore` cert +
`Codemagic_ASC_API` key — see TrueFault release notes). Deferred until the web app + engine
are complete (TrueDrop parity: `apps/ios` + `codemagic.yaml` not generated in V1 core).

## 10. Open redline items

- Monetization is settled (free funnel) — no IAP.
- Sanity checks = warn, never block (settled, redline-able).
- Default electricity rate ($/kWh) for Energy Cost — placeholder 0.15, redline-able.
- Whether any deferred V1.1 item (history, unit toggles, delta/wye) should be pulled forward.
