// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { findFormErrors, writeFormValidity, writeState } from './form-control.utils';

/**
 * An `ElementInternals` recording the calls, which happy-dom lacks.
 */
function fakeInternals(): ElementInternals {
  return { setValidity: vi.fn(), states: new Set<string>() } as unknown as ElementInternals;
}

describe('form control', () => {
  it('finds the errors of the validators in order: the flags of every error, with the message of the first one', () => {
    expect(findFormErrors([() => undefined, () => ({ valueMissing: 'Required', rangeOverflow: undefined }), () => ({ customError: 'Custom' })])).toEqual({ flags: { valueMissing: true, customError: true }, message: 'Required' });
    expect(findFormErrors([() => ({ tooLong: 'Too long' })])).toEqual({ flags: { tooLong: true }, message: 'Too long' });
  });

  it('finds no error when the validators pass, or there are none', () => {
    expect(findFormErrors([() => undefined, () => ({}), () => ({ valueMissing: undefined })])).toBeUndefined();
    expect(findFormErrors([])).toBeUndefined();
  });

  it('gives the form the validity: the flags of the errors with their message on the anchor, or valid with the argument the browser requires', () => {
    const internals = fakeInternals();
    const anchor = document.createElement('button');

    writeFormValidity(internals, { flags: { valueMissing: true }, message: 'Required' }, anchor);
    writeFormValidity(internals, { flags: { tooLong: true }, message: 'Too long' }, undefined);
    writeFormValidity(internals, undefined, anchor);

    expect(internals.setValidity).toHaveBeenNthCalledWith(1, { valueMissing: true }, 'Required', anchor);
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
