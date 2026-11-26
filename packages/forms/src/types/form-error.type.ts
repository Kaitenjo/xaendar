/**
 * An error a validator of a form-associated component found (see `FormControlDirective.errors`): the flag of
 * `ValidityState` it sets, with the message it gives.
 */
export type FormError = {
  /**
   * The flag of `ValidityState` the error sets (`valueMissing`, `rangeUnderflow`, `customError`…).
   */
  readonly flag: keyof ValidityStateFlags;
  /**
   * The message of the error: the browser shows the one of the first error found.
   */
  readonly message: string;
};
