import { useState } from "react";
import { solveEnergyCost, DEFAULT_RATE_PER_KWH } from "@509-trueohm/ohm-law";
import { Field } from "../components/Field";
import { ResultCard, type ResultRow } from "../components/ResultCard";
import { toNum, fmtCurrency } from "../components/format";

export function EnergyCostScreen(): JSX.Element {
  const [kw, setKw] = useState("5");
  const [hours, setHours] = useState("8");
  const [rate, setRate] = useState("0.12");

  const r = solveEnergyCost({
    kw: toNum(kw) ?? 0,
    hours: toNum(hours) ?? 0,
    ratePerKwh: toNum(rate),
  });

  const rows: ResultRow[] = [
    { label: "Energy", value: r.kwh, unit: "kWh" },
    { label: "Rate", value: r.ratePerKwh, unit: "$/kWh" },
  ];

  return (
    <div className="calculator-screen">
      <ResultCard
        label="Cost"
        hero={{ value: r.cost, unit: "", prefix: "$", format: fmtCurrency }}
        rows={rows}
        work={r.work}
        warnings={r.warnings}
      />

      <div className="vd-inputs-section">
        <h2 className="vd-section-label">Run</h2>
        <Field id="ec-kw" label="Power" unit="kW" value={kw} onChange={setKw} />
        <Field id="ec-hours" label="Hours" unit="h" value={hours} onChange={setHours} />
        <Field
          id="ec-rate"
          label="Rate"
          unit="$/kWh"
          value={rate}
          step={0.01}
          placeholder={String(DEFAULT_RATE_PER_KWH)}
          onChange={setRate}
        />
        <p className="to-input-hint">
          Leave the rate blank to use the default ${DEFAULT_RATE_PER_KWH}/kWh.
        </p>
      </div>
    </div>
  );
}
