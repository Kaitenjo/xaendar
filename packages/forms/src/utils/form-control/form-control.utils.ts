import type { FormErrors } from '../../types/form-errors.type';
import type { FormValidator } from '../../types/form-validator.type';

/**
 * Finds the errors of a value, computed by its validators in order: the flags of every error found, and the message of
 * the first one.
 *
 * @param validators - The validators of the component.
 * @returns The errors, `undefined` when none of them finds one.
 */
export function findFormErrors(validators: readonly FormValidator[]): FormErrors | undefined {
  const flags: ValidityStateFlags = {};
  let message: string | undefined;
  for (let i = 0; i < validators.length; i++) {
    const errors = validators[i]();
    if (!errors) {
      continue;
    }

    for (const name in errors) {
      const flag = name as keyof ValidityStateFlags;
      const error = errors[flag];
      if (error !== undefined) {
        flags[flag] = true;
        message ??= error;
      }
    }
  }

  return message === undefined ? undefined : { flags, message };
}

/**
 * Gives the form the validity of a component: valid without errors, otherwise with their flags and the message of the
 * first one, which the browser shows on the anchor.
 *
 * @param internals - The `ElementInternals` of the element.
 * @param errors - The errors of the component, `undefined` when it is valid.
 * @param anchor - The element of its shadow root the browser shows the message on, `undefined` for the host.
 */
export function writeFormValidity(internals: ElementInternals, errors: FormErrors | undefined, anchor: HTMLElement | undefined): void {
  // The first argument is required, even for a valid element
  errors ? internals.setValidity(errors.flags, errors.message, anchor) : internals.setValidity({});
}

/**
 * Adds or removes a custom state of an element, which CSS matches with `:state(name)`.
 *
 * @param internals - The `ElementInternals` of the element.
 * @param state - The name of the state.
 * @param on - Whether the element has it.
 */
export function writeState(internals: ElementInternals, state: string, on: boolean): void {
  on ? internals.states.add(state) : internals.states.delete(state);
}
