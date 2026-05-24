import { useState } from "react";
import { solveOhmsWheel } from "@509-trueohm/ohm-law";
import { Field } from "../components/Field";
import { ResultCard, type ResultRow } from "../components/ResultCard";
import { toNum } from "../components/format";

export function OhmsWheelScreen(): JSX.Element {
  const [volts, setVolts] = useState("120");
  const [amps, setAmps] = useState("");
  const [ohms, setOhms] = useState("10");
  const [watts, setWatts] = useState("");

  const input = {
    volts: toNum(volts),
    amps: toNum(amps),
    ohms: toNum(ohms),
    watts: toNum(watts),
  };
  const r = solveOhmsWheel(input);

  const rows: ResultRow[] = [
    { label: "Voltage", value: r.volts, unit: "V", computed: input.volts === undefined },
    { label: "Current", value: r.amps, unit: "A", computed: input.amps === undefined },
    { label: "Resistance", value: r.ohms, unit: "Ω", computed: input.ohms === undefined },
  ];

  return (
    <div className="calculator-screen">
      <ResultCard
        label="Power"
        hero={{ value: r.watts, unit: "watts" }}
        rows={rows}
        work={r.work}
        warnings={r.warnings}
      />

      <div className="vd-inputs-section">
        <h2 className="vd-section-label">Enter any two</h2>
        <Field id="ow-volts" label="Voltage" unit="V" value={volts} onChange={setVolts} />
        <Field id="ow-amps" label="Current" unit="A" value={amps} onChange={setAmps} />
        <Field id="ow-ohms" label="Resistance" unit="Ω" value={ohms} onChange={setOhms} />
        <Field id="ow-watts" label="Power" unit="W" value={watts} onChange={setWatts} />
        <p className="to-input-hint">Fill any two fields; the other two are solved.</p>
      </div>
    </div>
  );
}
