import { useState } from "react";
import { solveAcPower, type Phase } from "@509-trueohm/ohm-law";
import { Field } from "../components/Field";
import { Toggle } from "../components/Toggle";
import { ResultCard, type ResultRow } from "../components/ResultCard";
import { toNum } from "../components/format";

export function AcPowerScreen(): JSX.Element {
  const [phase, setPhase] = useState<Phase>(3);
  const [volts, setVolts] = useState("480");
  const [amps, setAmps] = useState("100");
  const [pf, setPf] = useState("0.85");
  const [kva, setKva] = useState("");
  const [kw, setKw] = useState("");

  const input = {
    phase,
    volts: toNum(volts),
    amps: toNum(amps),
    powerFactor: toNum(pf),
    kva: toNum(kva),
    kw: toNum(kw),
  };
  const r = solveAcPower(input);

  const rows: ResultRow[] = [
    { label: "Apparent power", value: r.kva, unit: "kVA", computed: input.kva === undefined },
    { label: "Voltage", value: r.volts, unit: "V", computed: input.volts === undefined },
    { label: "Current", value: r.amps, unit: "A", computed: input.amps === undefined },
    { label: "Power factor", value: r.pf, computed: input.powerFactor === undefined },
  ];

  return (
    <div className="calculator-screen">
      <ResultCard
        label="Real Power"
        hero={{ value: r.kw, unit: "kW" }}
        rows={rows}
        work={r.work}
        warnings={r.warnings}
      />

      <div className="vd-inputs-section">
        <h2 className="vd-section-label">System</h2>
        <div className="vd-input-row vd-toggle-row">
          <span className="vd-input-label">Phase</span>
          <Toggle
            options={[
              { value: 1 as Phase, label: "1Ø" },
              { value: 3 as Phase, label: "3Ø" },
            ]}
            value={phase}
            ariaLabel="Phase"
            onChange={setPhase}
          />
        </div>
        <Field id="ac-volts" label="Voltage (L-L for 3Ø)" unit="V" value={volts} onChange={setVolts} />
        <Field id="ac-amps" label="Current" unit="A" value={amps} onChange={setAmps} />
        <Field id="ac-pf" label="Power factor" value={pf} step={0.01} onChange={setPf} />
        <Field id="ac-kva" label="Apparent power" unit="kVA" value={kva} onChange={setKva} />
        <Field id="ac-kw" label="Real power" unit="kW" value={kw} onChange={setKw} />
        <p className="to-input-hint">
          Enter what you know (e.g. V, A, PF) and leave the unknown blank.
        </p>
      </div>
    </div>
  );
}
