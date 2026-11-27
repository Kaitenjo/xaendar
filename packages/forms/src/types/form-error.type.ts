/**
 * An error a validator found (see `FormFieldDirective.errors`): its name, the one of a flag of `ValidityState` or one
 * of your own, with its message.
 */
export type FormError = {
  /**
   * The name of the error: a flag of `ValidityState` (`valueMissing`, `rangeUnderflow`…) or a name of your own.
   */
  readonly name: string;
  /**
   * The message of the error: the browser shows the one of the first error found.
   */
  readonly message: string;
};
