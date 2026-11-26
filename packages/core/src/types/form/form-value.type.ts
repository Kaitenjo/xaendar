/**
 * A value a form-associated component gives its form, as `ElementInternals.setFormValue` takes it: a text, a file,
 * several entries in a `FormData`, or `null` for none.
 */
export type FormValue = Parameters<ElementInternals['setFormValue']>[0];
