/**
 * The errors a validator finds in a value (see `FormValidator`), each by its name with its message: the names of the
 * flags of `ValidityState` (`valueMissing`, `tooShort`, `rangeUnderflow`…), which the browser shows as those flags on a
 * component, or names of your own (`noSundays`), which it shows as `customError`. No key, or keys holding `undefined`,
 * the value passes.
 */
export type FormValidityErrors = {
  readonly [Flag in keyof ValidityStateFlags]?: string;
} & {
  readonly [name: string]: string | undefined;
};
