import { keys } from '@xaendar/common';
import { signal } from '../../signals/signal/signal';
import { untracked } from '../../signals/untracked';
import type { _FormAssociation } from '../../types/form/form-association.type';
import type { FormValidator } from '../../types/form/form-validator.type';
import type { FormValueSource } from '../../types/form/form-value-source.type';
import type { FormValue } from '../../types/form/form-value.type';

/**
 * The custom state of a component the user left after focusing it, `:state(touched)` in CSS.
 */
const TOUCHED_STATE = 'touched';

/**
 * The custom state of a component whose value differs from its initial one, `:state(dirty)` in CSS.
 */
const DIRTY_STATE = 'dirty';

/**
 * Creates what a component keeps of its form, when its `@WebComponent` declares `formAssociated: true`, as the browser
 * reads it: its `ElementInternals`, attached once, `null` where the DOM has none, as on the server, the signals of its
 * disabled and touched states, and the listener marking it touched when the user leaves it (`focusout`) or the form
 * finds it invalid (`invalid`, on a submission or `checkValidity()`).
 *
 * N.B. Deliberate: one object, held by a single field of the element, and none for the components not associated with
 * a form, the most of them, instead of a field for each member on every element; the object is itself the listener,
 * its `handleEvent` the same function for every element, instead of a closure per element. Do not add fields to
 * `CustomElement` for it, nor listen with a function created here.
 *
 * @param element - The element of the component.
 * @returns What the component keeps of its form, `null` when its class is not form-associated.
 */
export function createFormAssociation(element: HTMLElement): _FormAssociation | null {
  if ((element.constructor as { formAssociated?: unknown }).formAssociated !== true) {
    return null;
  }

  const association: _FormAssociation = {
    internals: element.attachInternals?.() ?? null,
    disabled: signal(false),
    touched: signal(false),
    source: null,
    initial: undefined,
    converts: false,
    stopValidators: null,
    handleEvent: markTouched
  };
  element.addEventListener('focusout', association);
  element.addEventListener('invalid', association);
  return association;
}

/**
 * Gives what a component keeps of its form, for the methods that need it.
 *
 * @param association - What the component keeps of its form, if anything.
 * @param element - The element of the component.
 * @param method - The name of the method called, for the message.
 * @returns What the component keeps of its form.
 * @throws When the `@WebComponent` of the component does not declare `formAssociated: true`.
 */
export function requireFormAssociation(association: _FormAssociation | null, element: HTMLElement, method: string): _FormAssociation {
  if (!association) {
    throw new Error(`${element.constructor.name}.${method}() needs a form-associated component: declare formAssociated: true in its @WebComponent`);
  }

  return association;
}

/**
 * Keeps the signal whose value goes to the form, with its value now, the initial one.
 *
 * @param association - What the component keeps of its form.
 * @param element - The element of the component.
 * @param source - The signal.
 * @param converts - Whether its value is converted for the form.
 * @throws When the component already gives the form the value of a signal: a control has one value, set once.
 */
export function bindFormValue(association: _FormAssociation, element: HTMLElement, source: FormValueSource<unknown>, converts: boolean): void {
  if (association.source) {
    throw new Error(`${element.constructor.name}.setFormValue() was already called: a form-associated component gives its form the value of one signal, set once`);
  }

  association.source = source;
  association.initial = untracked(source);
  association.converts = converts;
}

/**
 * Forgets the signal whose value goes to the form, once its effect is disposed with the component: connected again, the
 * component sets it again.
 *
 * @param association - What the component keeps of its form.
 */
export function unbindFormValue(association: _FormAssociation): void {
  association.source = null;
}

/**
 * Gives the form the value of a component, converted when the component asks for it, and writes the `dirty` state of
 * the element.
 *
 * @param association - What the component keeps of its form.
 * @param value - The value of its signal.
 * @param transform - The conversion of the value, if any.
 */
export function writeFormValue(association: _FormAssociation, value: unknown, transform: ((value: never) => FormValue) | undefined): void {
  const internals = association.internals;
  if (internals) {
    internals.setFormValue(transform ? transform(value as never) : value as FormValue);
    writeState(internals, DIRTY_STATE, !Object.is(value, association.initial));
  }
}

/**
 * Tells whether the value of a component differs from its initial one, following its signal.
 *
 * @param association - What the component keeps of its form, if anything.
 * @returns `true` when the value differs, always `false` before `setFormValue`.
 */
export function isFormDirty(association: _FormAssociation | null): boolean {
  const source = association?.source;
  return source ? !Object.is(source(), association.initial) : false;
}

/**
 * Gives the form the validity of a component, computed by its validators in order: valid when none returns errors,
 * otherwise with the flags of every error and the message of the first one, which the browser shows on the anchor.
 *
 * @param association - What the component keeps of its form.
 * @param validators - The validators of the component, none to make it valid.
 * @param anchor - The element of its shadow root the browser shows the message on, `undefined` for the host.
 */
export function writeFormValidity(association: _FormAssociation, validators: readonly FormValidator[], anchor: HTMLElement | undefined): void {
  const internals = association.internals;
  if (!internals) {
    return;
  }

  const flags: ValidityStateFlags = {};
  let message: string | undefined;
  for (let i = 0; i < validators.length; i++) {
    const errors = validators[i]();
    if (!errors) {
      continue;
    }

    const names = keys(errors);
    for (let j = 0; j < names.length; j++) {
      const name = names[j];
      const error = errors[name];
      if (error !== undefined) {
        flags[name] = true;
        message ??= error;
      }
    }
  }

  message === undefined ? internals.setValidity({}) : internals.setValidity(flags, message, anchor);
}

/**
 * Brings a component back to the state of its form when it was reset: its initial value, untouched.
 *
 * @param association - What the component keeps of its form.
 */
export function resetFormAssociation(association: _FormAssociation): void {
  association.source?.set(association.initial);
  setTouched(association, false);
}

/**
 * Marks a component touched: the listener of `focusout` and `invalid` (see {@link createFormAssociation}), called with
 * what the component keeps of its form as `this`.
 *
 * @param this - What the component keeps of its form.
 */
function markTouched(this: _FormAssociation): void {
  setTouched(this, true);
}

/**
 * Sets whether a component is touched, and the `touched` state of its element.
 *
 * @param association - What the component keeps of its form.
 * @param touched - Whether it is touched.
 */
function setTouched(association: _FormAssociation, touched: boolean): void {
  association.touched.set(touched);
  if (association.internals) {
    writeState(association.internals, TOUCHED_STATE, touched);
  }
}

/**
 * Adds or removes a custom state of an element, which CSS matches with `:state(name)`.
 *
 * @param internals - The `ElementInternals` of the element.
 * @param state - The name of the state.
 * @param on - Whether the element has it.
 */
function writeState(internals: ElementInternals, state: string, on: boolean): void {
  on ? internals.states.add(state) : internals.states.delete(state);
}
