interface FieldProps {
  id: string;
  label: string;
  value: string;
  unit?: string;
  placeholder?: string;
  step?: number;
  onChange: (value: string) => void;
}

/**
 * A labeled numeric text field. Empty string means "unknown" — the engine solves
 * for blank fields. Reuses the suite `.vd-input-row` styling.
 */
export function Field({
  id,
  label,
  value,
  unit,
  placeholder = "—",
  step,
  onChange,
}: FieldProps): JSX.Element {
  return (
    <div className="vd-input-row">
      <label className="vd-input-label" htmlFor={id}>
        {label}
        {unit ? <span style={{ color: "var(--text-dim)", marginLeft: 4 }}>({unit})</span> : null}
      </label>
      <input
        id={id}
        className="vd-num-input"
        type="number"
        inputMode="decimal"
        value={value}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
    </div>
  );
}
