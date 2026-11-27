import type { FormValidityErrors } from './form-validity-errors.type';

/**
 * A validator, as Angular's: a function receiving the value of the field and returning its errors, by name with their
 * message, or `undefined` when the value passes. The signals it reads are followed: when one changes, the validity is
 * computed again.
 */
export type FormValidator = (value: unknown) => FormValidityErrors | undefined;
