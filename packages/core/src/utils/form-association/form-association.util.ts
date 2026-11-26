import { keys } from '@xaendar/common';
import { signal } from '../../signals/signal/signal';
import type { _FormAssociation } from '../../types/form/form-association.type';
import type { FormValidityErrors } from '../../types/form/form-validity-errors.type';
import type { FormValue } from '../../types/form/form-value.type';

/**
 * Creates what a component keeps of its form, when its `@WebComponent` declares `formAssociated: true`, as the browser
 * reads it: its `ElementInternals`, attached once, `null` where the DOM has none, as on the server, and the signal of its
 * disabled state.
 *
 * N.B. Deliberate: one object, held by a single field of the element, and none for the components not associated with
 * a form, the most of them, instead of a field for each member on every element. Do not add fields to `CustomElement`
 * for it.
 *
 * @param element - The element of the component.
 * @returns What the component keeps of its form, `null` when its class is not form-associated.
 */
export function createFormAssociation(element: HTMLElement): _FormAssociation | null {
  if ((element.constructor as { formAssociated?: unknown }).formAssociated !== true) {
    return null;
  }

  return {
    internals: element.attachInternals(),
    disabled: signal(false),
    source: null,
    initial: undefined,
    converts: false
  };
}

/**
 * Gives what a component keeps of its form, for the methods that need it.
 *
 * @param form - What the component keeps of its form, if anything.
 * @param element - The element of the component.
 * @param method - The name of the method called, for the message.
 * @returns What the component keeps of its form.
 * @throws When the `@WebComponent` of the component does not declare `formAssociated: true`.
 */
export function requireFormAssociation(form: _FormAssociation | null, element: HTMLElement, method: string): _FormAssociation {
  if (!form) {
    throw new Error(`${element.constructor.name}.${method}() needs a form-associated component: declare formAssociated: true in its @WebComponent`);
  }

  return form;
}

/**
 * Gives the form the value of a component, converted when the component asks for it.
 *
 * @param form - What the component keeps of its form.
 * @param value - The value of its signal.
 * @param toFormValue - The conversion of the value, if any.
 */
export function writeFormValue(form: _FormAssociation, value: unknown, toFormValue: ((value: never) => FormValue) | undefined): void {
  form.internals?.setFormValue(toFormValue ? toFormValue(value as never) : value as FormData);
}

/**
 * Gives the form the validity of a component: valid without errors, otherwise with the flags of its errors and the
 * message of the first one, which the browser shows on the anchor, if any.
 *
 * @param form - What the component keeps of its form.
 * @param errors - The errors of the component.
 * @param anchor - The element of its shadow root the browser shows the message on, `null` or `undefined` for the host.
 */
export function writeFormValidity(form: _FormAssociation, errors: FormValidityErrors, anchor: HTMLElement | undefined): void {
  const internals = form.internals;
  if (!internals) {
    return;
  }

  const flags: ValidityStateFlags = {};
  const names = keys(errors);
  let message: string | undefined;

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const error = errors[name];
    if (error !== undefined) {
      flags[name] = true;
      message ??= error;
    }
  }

  message === undefined ? internals.setValidity({}) : internals.setValidity(flags, message, anchor ?? undefined);
}
