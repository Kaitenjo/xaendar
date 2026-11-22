import { memo } from 'react';
import type { Option } from '../../../shared/data';

/**
 * A select with its label, rendered again only when its props change (`memo`).
 */
export const SelectInput = memo(function SelectInput({ label, options, value, onChange }: { label: string; options: readonly Option[]; value: string; onChange: (value: string) => void }) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      <select className="ui-field__control" value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
});
