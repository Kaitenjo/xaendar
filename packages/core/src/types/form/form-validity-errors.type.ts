/**
 * The errors of a form-associated component (see `CustomElement.formValidity`): the flags of `ValidityState` it has, each
 * with the message the browser shows for it. No key, the component is valid.
 */
export type FormValidityErrors = {
  readonly [Flag in keyof ValidityStateFlags]?: string;
};
