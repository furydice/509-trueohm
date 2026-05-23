import { useState } from "react";
import { solvePowerTriangle } from "@509-trueohm/ohm-law";
import { Field } from "../components/Field";
import { ResultCard, type ResultRow } from "../components/ResultCard";
import { toNum } from "../components/format";

export function PowerTriangleScreen(): JSX.Element {
  const [kw, setKw] = useState("80");
  const [kvar, setKvar] = useState("");
  const [kva, setKva] = useState("100");
  const [pf, setPf] = useState("");
  const [angle, setAngle] = useState("");

  const input = {
    kw: toNum(kw),
    kvar: toNum(kvar),
    kva: toNum(kva),
    pf: toNum(pf),
    angleDeg: toNum(angle),
  };
  const r = solvePowerTriangle(input);

  const rows: ResultRow[] = [
    { label: "Real power", value: r.kw, unit: "kW", computed: input.kw === undefined },
    { label: "Reactive power", value: r.kvar, unit: "kVAR", computed: input.kvar === undefined },
    { label: "Power factor", value: r.pf, computed: input.pf === undefined },
    { label: "Angle", value: r.angleDeg, unit: "°", computed: input.angleDeg === undefined },
  ];

  return (
    <div className="calculator-screen">
      <ResultCard
        label="Apparent Power"
        hero={{ value: r.kva, unit: "kVA" }}
        rows={rows}
        work={r.work}
        warnings={r.warnings}
      />

      <div className="vd-inputs-section">
        <h2 className="vd-section-label">Enter any two</h2>
        <Field id="pt-kw" label="Real power" unit="kW" value={kw} onChange={setKw} />
        <Field id="pt-kvar" label="Reactive power" unit="kVAR" value={kvar} onChange={setKvar} />
        <Field id="pt-kva" label="Apparent power" unit="kVA" value={kva} onChange={setKva} />
        <Field id="pt-pf" label="Power factor" value={pf} step={0.01} onChange={setPf} />
        <Field id="pt-angle" label="Angle" unit="°" value={angle} onChange={setAngle} />
        <p className="to-input-hint">Fill any two; the rest of the triangle is solved.</p>
      </div>
    </div>
  );
}
