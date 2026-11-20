/**
 * A text field with its label.
 */
export function TextInput({ label, placeholder = '', value, onChange }: { label: string; placeholder?: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      <input className="ui-field__control" type="search" placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} />
    </label>
  );
}
