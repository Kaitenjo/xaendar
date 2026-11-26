import type { FormValidator } from '../../types/form-validator.type';

/**
 * Gives the form the validity of a component, computed by its validators in order: valid when none returns errors,
 * otherwise with the flags of every error and the message of the first one, which the browser shows on the anchor.
 *
 * @param internals - The `ElementInternals` of the element.
 * @param validators - The validators of the component, none to make it valid.
 * @param anchor - The element of its shadow root the browser shows the message on, `undefined` for the host.
 */
export function writeFormValidity(internals: ElementInternals, validators: readonly FormValidator[], anchor: HTMLElement | undefined): void {
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

  message === undefined ? internals.setValidity({}) : internals.setValidity(flags, message, anchor);
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
 * Ensures the element a form control is applied to is form-associated: the directive is a host directive of its
 * component, whose class it makes form-associated, never applied from a template.
 *
 * @param element - The element.
 * @throws When the class of the element is not form-associated.
 */
export function assertFormAssociated(element: HTMLElement): void {
  if ((element.constructor as { formAssociated?: unknown }).formAssociated !== true) {
    throw new Error(`FormControlDirective is applied to <${element.localName}>, which is not form-associated: declare it in the hostDirectives of the @WebComponent of the component, which it makes form-associated`);
  }
}
