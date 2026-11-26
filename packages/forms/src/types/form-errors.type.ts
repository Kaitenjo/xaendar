/**
 * The errors validators found in a value (see `findFormErrors`), as `ElementInternals.setValidity` takes them.
 */
export type FormErrors = {
  /**
   * The flags of `ValidityState` found, each `true`.
   */
  readonly flags: ValidityStateFlags;
  /**
   * The message the browser shows: the one of the first error found.
   */
  readonly message: string;
};
