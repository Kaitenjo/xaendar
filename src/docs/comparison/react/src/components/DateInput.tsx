/**
 * A date field with its label.
 */
export function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      <input className="ui-field__control" type="date" value={value} onChange={event => onChange(event.target.value)} />
    </label>
  );
}
