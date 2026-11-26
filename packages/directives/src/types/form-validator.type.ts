import type { FormValidityErrors } from './form-validity-errors.type';

/**
 * A validator of a form-associated component (see `FormControlDirective.setValidators`): returns its errors, as the
 * flags of `ValidityState` each with its message, or `undefined` when the value passes. The signals it reads are
 * followed: when one changes, the validity is computed again.
 */
export type FormValidator = () => FormValidityErrors | undefined;
