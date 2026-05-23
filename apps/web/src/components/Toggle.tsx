interface ToggleProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  ariaLabel: string;
  onChange: (value: T) => void;
}

/** Segmented control, reusing the suite `.system-toggle` styling. */
export function Toggle<T extends string | number>({
  options,
  value,
  ariaLabel,
  onChange,
}: ToggleProps<T>): JSX.Element {
  return (
    <div className="system-toggle" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className={value === opt.value ? "selected" : ""}
          onClick={() => onChange(opt.value)}
        >
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
