/**
 * The errors a validator of a form-associated component returns (see `FormValidator`): the flags of `ValidityState` it
 * finds, each with the message the browser shows for it, `customError` for an error of its own. No key, the value passes.
 */
export type FormValidityErrors = {
  readonly [Flag in keyof ValidityStateFlags]?: string;
};
