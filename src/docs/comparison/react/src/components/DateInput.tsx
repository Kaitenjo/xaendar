import { memo } from 'react';

/**
 * A date field with its label, rendered again only when its props change (`memo`).
 */
export const DateInput = memo(function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      <input className="ui-field__control" type="date" value={value} onChange={event => onChange(event.target.value)} />
    </label>
  );
});
