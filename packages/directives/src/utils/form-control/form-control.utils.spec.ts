// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { assertFormAssociated, writeFormValidity, writeState } from './form-control.utils';

/**
 * An `ElementInternals` recording the calls, which happy-dom lacks.
 */
function fakeInternals(): ElementInternals {
  return { setValidity: vi.fn(), states: new Set<string>() } as unknown as ElementInternals;
}

describe('form control', () => {
  it('gives the form the validity of the validators: the flags of every error with the message of the first one, or valid', () => {
    const internals = fakeInternals();
    const anchor = document.createElement('button');

    writeFormValidity(internals, [() => undefined, () => ({ valueMissing: 'Required', rangeOverflow: undefined }), () => ({ customError: 'Custom' })], anchor);
    writeFormValidity(internals, [() => ({ tooLong: 'Too long' })], undefined);
    writeFormValidity(internals, [() => undefined, () => ({})], anchor);
    writeFormValidity(internals, [], undefined);

    expect(internals.setValidity).toHaveBeenNthCalledWith(1, { valueMissing: true, customError: true }, 'Required', anchor);
    expect(internals.setValidity).toHaveBeenNthCalledWith(2, { tooLong: true }, 'Too long', undefined);
    expect(internals.setValidity).toHaveBeenNthCalledWith(3, {});
    expect(internals.setValidity).toHaveBeenNthCalledWith(4, {});
  });

  it('adds and removes the custom states of the element', () => {
    const internals = fakeInternals();

    writeState(internals, 'touched', true);
    expect(internals.states.has('touched')).toBe(true);
    writeState(internals, 'touched', false);
    expect(internals.states.has('touched')).toBe(false);
  });

  it('rejects an element whose class is not form-associated', () => {
    class Field extends HTMLElement {
      public static formAssociated = true;
    }
    class Plain extends HTMLElement { }
    customElements.define('x-control-field', Field);
    customElements.define('x-control-plain', Plain);

    expect(() => assertFormAssociated(new Field())).not.toThrow();
    expect(() => assertFormAssociated(new Plain())).toThrow('FormControlDirective is applied to <x-control-plain>, which is not form-associated: declare it in the hostDirectives of the @WebComponent of the component, which it makes form-associated');
  });
});
