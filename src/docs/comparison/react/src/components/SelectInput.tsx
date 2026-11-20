import type { Option } from '../../../shared/data';

/**
 * A select with its label.
 */
export function SelectInput({ label, options, value, onChange }: { label: string; options: readonly Option[]; value: string; onChange: (value: string) => void }) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      <select className="ui-field__control" value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
