/**
 * A native element taking part in the forms with a validity of its own: `<input>`, `<select>`, `<textarea>` and the
 * others answering `setCustomValidity()`.
 */
export type NativeFormField = HTMLElement & Pick<HTMLInputElement, 'form' | 'setCustomValidity' | 'validationMessage' | 'validity'>;
