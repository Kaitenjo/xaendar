// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { _FormAssociation } from '../../types/form/form-association.type';
import { createFormAssociation, requireFormAssociation, writeFormValidity, writeFormValue } from './form-association.util';

loadSignals();

/**
 * An `ElementInternals` recording the calls, which happy-dom lacks.
 */
function fakeInternals(): ElementInternals {
  return { setFormValue: vi.fn(), setValidity: vi.fn() } as unknown as ElementInternals;
}

/**
 * What a component keeps of its form, with the given internals.
 */
function association(internals: ElementInternals | null): _FormAssociation {
  return { internals, disabled: Object.assign(() => false, { set: vi.fn(), get: vi.fn(), update: vi.fn() }), source: null, initial: undefined, converts: false };
}

describe('form association', () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'attachInternals');
  });

  it('is created only for a class declaring static formAssociated = true, attaching its internals once', () => {
    const internals = fakeInternals();
    const attachInternals = vi.fn(() => internals);
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: attachInternals });
    class Field extends HTMLElement {
      public static formAssociated = true;
    }
    class Plain extends HTMLElement { }
    customElements.define('x-form-field', Field);
    customElements.define('x-form-plain', Plain);

    const form = createFormAssociation(new Field());

    expect(form).toMatchObject({ internals, source: null, initial: undefined, converts: false });
    expect(form!.disabled()).toBe(false);
    expect(attachInternals).toHaveBeenCalledTimes(1);
    expect(createFormAssociation(new Plain())).toBeNull();
  });

  it('has no internals where the DOM has none, as on the server', () => {
    class ServerField extends HTMLElement {
      public static formAssociated = true;
    }
    customElements.define('x-form-server', ServerField);

    expect(createFormAssociation(new ServerField())!.internals).toBeNull();
  });

  it('is required by the methods of the forms, naming the class and the method', () => {
    const form = association(null);
    class Missing extends HTMLElement { }
    customElements.define('x-form-missing', Missing);

    expect(requireFormAssociation(form, new Missing(), 'formValue')).toBe(form);
    expect(() => requireFormAssociation(null, new Missing(), 'formValue')).toThrow('Missing.formValue() needs a form-associated component: declare static formAssociated = true in its class');
  });

  it('gives the form the value, converted when asked', () => {
    const internals = fakeInternals();

    writeFormValue(association(internals), 'a', undefined);
    writeFormValue(association(internals), 3, (value: number) => String(value * 2));
    writeFormValue(association(null), 'b', undefined);

    expect(internals.setFormValue).toHaveBeenNthCalledWith(1, 'a');
    expect(internals.setFormValue).toHaveBeenNthCalledWith(2, '6');
    expect(internals.setFormValue).toHaveBeenCalledTimes(2);
  });

  it('gives the form the validity: the flags of the errors with the message of the first one, or valid', () => {
    const internals = fakeInternals();
    const anchor = document.createElement('button');

    writeFormValidity(association(internals), { valueMissing: 'Required', customError: 'Custom', rangeOverflow: undefined }, anchor);
    writeFormValidity(association(internals), { tooLong: 'Too long' }, null);
    writeFormValidity(association(internals), {}, anchor);
    writeFormValidity(association(null), { valueMissing: 'Required' }, anchor);

    expect(internals.setValidity).toHaveBeenNthCalledWith(1, { valueMissing: true, customError: true }, 'Required', anchor);
    expect(internals.setValidity).toHaveBeenNthCalledWith(2, { tooLong: true }, 'Too long', undefined);
    expect(internals.setValidity).toHaveBeenNthCalledWith(3, {});
    expect(internals.setValidity).toHaveBeenCalledTimes(3);
  });
});
