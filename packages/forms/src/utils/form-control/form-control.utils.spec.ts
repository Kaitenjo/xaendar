// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { findFormErrors, NO_FORM_ERRORS, writeFormValidity, writeState } from './form-control.utils';

/**
 * An `ElementInternals` recording the calls, which happy-dom lacks.
 */
function fakeInternals(): ElementInternals {
  return { setValidity: vi.fn(), states: new Set<string>() } as unknown as ElementInternals;
}

describe('form control', () => {
  it('finds every error of every validator, in order', () => {
    expect(findFormErrors([() => undefined, () => ({ valueMissing: 'Required', rangeOverflow: undefined }), () => ({ customError: 'Custom', tooLong: 'Too long' }), () => ({ customError: 'Another' })])).toEqual([
      { flag: 'valueMissing', message: 'Required' },
      { flag: 'customError', message: 'Custom' },
      { flag: 'tooLong', message: 'Too long' },
      { flag: 'customError', message: 'Another' }
    ]);
  });

  it('finds the same shared list when the validators pass, or there are none', () => {
    expect(findFormErrors([() => undefined, () => ({}), () => ({ valueMissing: undefined })])).toBe(NO_FORM_ERRORS);
    expect(findFormErrors([])).toBe(NO_FORM_ERRORS);
    expect(NO_FORM_ERRORS).toEqual([]);
  });

  it('gives the form the validity: the flags of the errors with the message of the first one on the anchor, or valid with the argument the browser requires', () => {
    const internals = fakeInternals();
    const anchor = document.createElement('button');

    writeFormValidity(internals, [{ flag: 'valueMissing', message: 'Required' }, { flag: 'customError', message: 'Custom' }], anchor);
    writeFormValidity(internals, [{ flag: 'tooLong', message: 'Too long' }], undefined);
    writeFormValidity(internals, NO_FORM_ERRORS, anchor);

    expect(internals.setValidity).toHaveBeenNthCalledWith(1, { valueMissing: true, customError: true }, 'Required', anchor);
    expect(internals.setValidity).toHaveBeenNthCalledWith(2, { tooLong: true }, 'Too long', undefined);
    expect(internals.setValidity).toHaveBeenNthCalledWith(3, {});
  });

  it('adds and removes the custom states of the element', () => {
    const internals = fakeInternals();

    writeState(internals, 'touched', true);
    expect(internals.states.has('touched')).toBe(true);
    writeState(internals, 'touched', false);
    expect(internals.states.has('touched')).toBe(false);
  });
});
