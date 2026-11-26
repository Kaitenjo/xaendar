// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { signal } from '../../signals/signal/signal';
import type { _FormAssociation } from '../../types/form/form-association.type';
import { bindFormValue, createFormAssociation, isFormDirty, requireFormAssociation, resetFormAssociation, unbindFormValue, writeFormValidity, writeFormValue } from './form-association.util';

loadSignals();

/**
 * An `ElementInternals` recording the calls, which happy-dom lacks.
 */
function fakeInternals(): ElementInternals {
  return { setFormValue: vi.fn(), setValidity: vi.fn(), states: new Set<string>() } as unknown as ElementInternals;
}

/**
 * Defines a form-associated class, and one that is not.
 */
let counter = 0;
function defineClasses(): { Field: typeof HTMLElement, Plain: typeof HTMLElement } {
  class Field extends HTMLElement {
    public static formAssociated = true;
  }
  class Plain extends HTMLElement { }
  customElements.define(`x-form-field-${counter}`, Field);
  customElements.define(`x-form-plain-${counter++}`, Plain);
  return { Field, Plain };
}

/**
 * Creates what a form-associated component keeps of its form, with the given internals.
 */
function associate(internals: ElementInternals | undefined): { association: _FormAssociation, element: HTMLElement } {
  if (internals) {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: () => internals });
  }

  const element = new (defineClasses().Field)();
  return { association: createFormAssociation(element)!, element };
}

describe('form association', () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'attachInternals');
  });

  it('is created only for a form-associated class, attaching its internals once', () => {
    const internals = fakeInternals();
    const attachInternals = vi.fn(() => internals);
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: attachInternals });
    const { Field, Plain } = defineClasses();

    const association = createFormAssociation(new Field());

    expect(association).toMatchObject({ internals, source: null, initial: undefined, converts: false, stopValidators: null });
    expect(association!.disabled()).toBe(false);
    expect(association!.touched()).toBe(false);
    expect(attachInternals).toHaveBeenCalledTimes(1);
    expect(createFormAssociation(new Plain())).toBeNull();
  });

  it('has no internals where the DOM has none, as on the server, writing nothing', () => {
    const { association, element } = associate(undefined);
    const value = signal('a');

    expect(association.internals).toBeNull();
    bindFormValue(association, element, value, false);
    expect(() => writeFormValue(association, 'b', undefined)).not.toThrow();
    expect(() => writeFormValidity(association, [() => ({ valueMissing: 'Required' })], undefined)).not.toThrow();
    element.dispatchEvent(new Event('focusout'));
    expect(association.touched()).toBe(true);
  });

  it('is required by the methods of the forms, naming the class and the method', () => {
    const { association, element } = associate(fakeInternals());

    expect(requireFormAssociation(association, element, 'setFormValue')).toBe(association);
    expect(() => requireFormAssociation(null, element, 'setFormValue')).toThrow(/^Field\.setFormValue\(\) needs a form-associated component: declare formAssociated: true in its @WebComponent$/);
  });

  it('keeps the signal of the value once, with its initial value, until it is unbound', () => {
    const { association, element } = associate(fakeInternals());
    const value = signal(3);

    bindFormValue(association, element, value, true);

    expect(association).toMatchObject({ source: value, initial: 3, converts: true });
    expect(() => bindFormValue(association, element, signal(1), false)).toThrow('Field.setFormValue() was already called: a form-associated component gives its form the value of one signal, set once');
    unbindFormValue(association);
    expect(association.source).toBeNull();
    expect(() => bindFormValue(association, element, signal(1), false)).not.toThrow();
  });

  it('gives the form the value, converted when asked, with the dirty state', () => {
    const internals = fakeInternals();
    const { association, element } = associate(internals);
    bindFormValue(association, element, signal('a'), false);

    writeFormValue(association, 'b', undefined);
    expect(internals.setFormValue).toHaveBeenLastCalledWith('b');
    expect(internals.states.has('dirty')).toBe(true);

    writeFormValue(association, 'a', (value: string) => value.toUpperCase());
    expect(internals.setFormValue).toHaveBeenLastCalledWith('A');
    expect(internals.states.has('dirty')).toBe(false);
  });

  it('tells whether the value differs from the initial one', () => {
    const { association, element } = associate(fakeInternals());
    const value = signal('a');

    expect(isFormDirty(null)).toBe(false);
    expect(isFormDirty(association)).toBe(false);
    bindFormValue(association, element, value, false);
    expect(isFormDirty(association)).toBe(false);
    value.set('b');
    expect(isFormDirty(association)).toBe(true);
  });

  it('gives the form the validity of the validators: the flags of every error with the message of the first one, or valid', () => {
    const internals = fakeInternals();
    const { association } = associate(internals);
    const anchor = document.createElement('button');

    writeFormValidity(association, [() => undefined, () => ({ valueMissing: 'Required', rangeOverflow: undefined }), () => ({ customError: 'Custom' })], anchor);
    writeFormValidity(association, [() => ({ tooLong: 'Too long' })], undefined);
    writeFormValidity(association, [() => undefined, () => ({})], anchor);
    writeFormValidity(association, [], undefined);

    expect(internals.setValidity).toHaveBeenNthCalledWith(1, { valueMissing: true, customError: true }, 'Required', anchor);
    expect(internals.setValidity).toHaveBeenNthCalledWith(2, { tooLong: true }, 'Too long', undefined);
    expect(internals.setValidity).toHaveBeenNthCalledWith(3, {});
    expect(internals.setValidity).toHaveBeenNthCalledWith(4, {});
  });

  it('is touched when the user leaves the element or the form finds it invalid, and untouched by the reset, with the value written back', () => {
    const internals = fakeInternals();
    const { association, element } = associate(internals);
    const value = signal('a');
    bindFormValue(association, element, value, false);

    element.dispatchEvent(new Event('focusout'));
    expect(association.touched()).toBe(true);
    expect(internals.states.has('touched')).toBe(true);

    value.set('b');
    resetFormAssociation(association);
    expect(value()).toBe('a');
    expect(association.touched()).toBe(false);
    expect(internals.states.has('touched')).toBe(false);

    element.dispatchEvent(new Event('invalid'));
    expect(association.touched()).toBe(true);
    unbindFormValue(association);
    expect(() => resetFormAssociation(association)).not.toThrow();
  });
});
