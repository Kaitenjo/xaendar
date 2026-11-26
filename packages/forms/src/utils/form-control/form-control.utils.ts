import type { FormError } from '../../types/form-error.type';
import type { FormValidator } from '../../types/form-validator.type';

/**
 * The errors of a value that passes its validators, shared so that a recomputed validity with no error is not a change.
 */
export const NO_FORM_ERRORS: readonly FormError[] = Object.freeze([]);

/**
 * Finds the errors of a value, computed by its validators in order: each error of each validator, in the order they
 * are returned.
 *
 * @param validators - The validators of the component.
 * @returns The errors, {@link NO_FORM_ERRORS} when none of the validators finds one.
 */
export function findFormErrors(validators: readonly FormValidator[]): readonly FormError[] {
  let found: FormError[] | undefined;
  for (let i = 0; i < validators.length; i++) {
    const errors = validators[i]();
    if (!errors) {
      continue;
    }

    for (const name in errors) {
      const flag = name as keyof ValidityStateFlags;
      const message = errors[flag];
      if (message !== undefined) {
        (found ??= []).push({ flag, message });
      }
    }
  }

  return found ?? NO_FORM_ERRORS;
}

/**
 * Gives the form the validity of a component: valid without errors, otherwise with the flags of every error and the
 * message of the first one, which the browser shows on the anchor.
 *
 * @param internals - The `ElementInternals` of the element.
 * @param errors - The errors of the component.
 * @param anchor - The element of its shadow root the browser shows the message on, `undefined` for the host.
 */
export function writeFormValidity(internals: ElementInternals, errors: readonly FormError[], anchor: HTMLElement | undefined): void {
  if (!errors.length) {
    // The first argument is required, even for a valid element
    internals.setValidity({});
    return;
  }

  const flags: ValidityStateFlags = {};
  for (let i = 0; i < errors.length; i++) {
    flags[errors[i].flag] = true;
  }

  internals.setValidity(flags, errors[0].message, anchor);
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
