import type { FormError } from '../../types/form-error.type';
import type { FormValidator } from '../../types/form-validator.type';
import type { NativeFormField } from '../../types/native-form-field.type';

/**
 * The errors of a value that passes, shared so that a validity computed again with no error is not a change.
 */
export const NO_FORM_ERRORS: readonly FormError[] = Object.freeze([]);

/**
 * The validators of a field with none, shared by every directive.
 */
export const NO_FORM_VALIDATORS: readonly FormValidator[] = Object.freeze([]);

/**
 * The flags of `ValidityState` an error can set by its name on a component, in the order the browser checks them on a
 * native field; an error of another name sets `customError`.
 */
const VALIDITY_FLAGS: ReadonlyArray<keyof ValidityStateFlags> = ['valueMissing', 'typeMismatch', 'patternMismatch', 'tooLong', 'tooShort', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'badInput', 'customError'];

/**
 * Finds the errors of a value, computed by validators in order: each error of each validator, in the order they are
 * returned.
 *
 * @param validators - The validators.
 * @param value - The value they check.
 * @returns The errors, {@link NO_FORM_ERRORS} when none of the validators finds one.
 */
export function findFormErrors(validators: readonly FormValidator[], value: unknown): readonly FormError[] {
  let found: FormError[] | undefined;
  for (let i = 0; i < validators.length; i++) {
    const errors = validators[i](value);
    if (!errors) {
      continue;
    }

    for (const name in errors) {
      const message = errors[name];
      if (message !== undefined) {
        (found ??= []).push({ name, message });
      }
    }
  }

  return found ?? NO_FORM_ERRORS;
}

/**
 * Joins two lists of errors, either of them possibly empty.
 *
 * @param first - The first errors.
 * @param second - The errors after them.
 * @returns Both lists in one, one of them as it is when the other is empty.
 */
export function joinFormErrors(first: readonly FormError[], second: readonly FormError[]): readonly FormError[] {
  if (!first.length) {
    return second;
  }

  return second.length ? first.concat(second) : first;
}

/**
 * Gives the form the validity of a component: valid without errors, otherwise with the flag of each error, the one of
 * its name or `customError` for a name of your own, and the message of the first one, which the browser shows on the
 * anchor.
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
    const name = errors[i].name as keyof ValidityStateFlags;
    flags[VALIDITY_FLAGS.includes(name) ? name : 'customError'] = true;
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

/**
 * Tells whether an element is a native field with a validity of its own, which a custom error is given to.
 *
 * @param element - The element.
 * @returns `true` for an `<input>`, a `<select>`, a `<textarea>` and the other elements answering `setCustomValidity()`.
 */
export function isNativeFormField(element: Element): element is NativeFormField {
  return typeof (element as Partial<NativeFormField>).setCustomValidity === 'function';
}

/**
 * Reads the value of a native field, as Angular's value accessors give it: `checked` for a checkbox or a radio, a number
 * or `null` when empty for a number or a range, the values chosen for a multiple select, the text otherwise.
 *
 * @param field - The field.
 * @returns Its value.
 */
export function readNativeValue(field: NativeFormField): unknown {
  if (field instanceof HTMLInputElement) {
    switch (field.type) {
      case 'checkbox':
      case 'radio':
        return field.checked;
      case 'number':
      case 'range':
        return field.value === '' ? null : Number(field.value);
      default:
        return field.value;
    }
  }

  if (field instanceof HTMLSelectElement && field.multiple) {
    return Array.from(field.selectedOptions, option => option.value);
  }

  return (field as Partial<HTMLInputElement>).value;
}

/**
 * Reads the error of a native field its own constraints give (`required`, `minlength`, `type="email"`…), with the
 * message of the browser, clearing first the custom error a directive gave it. The browser gives one message, for the
 * first constraint failing: one error at most.
 *
 * @param field - The field.
 * @returns Its error, {@link NO_FORM_ERRORS} when its constraints pass.
 */
export function readNativeErrors(field: NativeFormField): readonly FormError[] {
  field.setCustomValidity('');
  const validity = field.validity;
  for (let i = 0; i < VALIDITY_FLAGS.length; i++) {
    const name = VALIDITY_FLAGS[i];
    if (validity[name]) {
      return [{ name, message: field.validationMessage }];
    }
  }

  return NO_FORM_ERRORS;
}
