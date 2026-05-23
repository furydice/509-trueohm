import { useState } from "react";
import { solveEfficiency } from "@509-trueohm/ohm-law";
import { Field } from "../components/Field";
import { ResultCard, type ResultRow } from "../components/ResultCard";
import { toNum } from "../components/format";

export function EfficiencyScreen(): JSX.Element {
  const [pOut, setPOut] = useState("1800");
  const [pIn, setPIn] = useState("2000");
  const [effPct, setEffPct] = useState("");

  const effInput = toNum(effPct);
  const input = {
    pOutW: toNum(pOut),
    pInW: toNum(pIn),
    efficiency: effInput === undefined ? undefined : effInput / 100,
  };
  const r = solveEfficiency(input);

  const rows: ResultRow[] = [
    { label: "Output power", value: r.pOutW, unit: "W", computed: input.pOutW === undefined },
    { label: "Input power", value: r.pInW, unit: "W", computed: input.pInW === undefined },
  ];

  return (
    <div className="calculator-screen">
      <ResultCard
        label="Efficiency"
        hero={{ value: r.efficiency * 100, unit: "%" }}
        rows={rows}
        work={r.work}
        warnings={r.warnings}
      />

      <div className="vd-inputs-section">
        <h2 className="vd-section-label">Enter any two</h2>
        <Field id="ef-out" label="Output power" unit="W" value={pOut} onChange={setPOut} />
        <Field id="ef-in" label="Input power" unit="W" value={pIn} onChange={setPIn} />
        <Field id="ef-eff" label="Efficiency" unit="%" value={effPct} onChange={setEffPct} />
        <p className="to-input-hint">Fill any two; the third is solved.</p>
      </div>
    </div>
  );
}
