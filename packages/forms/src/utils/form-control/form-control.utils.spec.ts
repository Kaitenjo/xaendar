// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { findFormErrors, isNativeFormField, joinFormErrors, NO_FORM_ERRORS, NO_FORM_VALIDATORS, readNativeErrors, readNativeValue, writeFormValidity, writeState } from './form-control.utils';

/**
 * An `ElementInternals` recording the calls, which happy-dom lacks.
 */
function fakeInternals(): ElementInternals {
  return { setValidity: vi.fn(), states: new Set<string>() } as unknown as ElementInternals;
}

/**
 * Creates an `<input>` of a type, with a value.
 */
function input(type: string, value = ''): HTMLInputElement {
  const element = document.createElement('input');
  element.type = type;
  element.value = value;
  return element;
}

describe('form control', () => {
  it('finds every error of every validator for the value, in order, the native names and the ones of its own', () => {
    expect(findFormErrors([() => undefined, value => ({ valueMissing: `Required ${String(value)}`, rangeOverflow: undefined }), () => ({ noSundays: 'Not on Sundays', tooLong: 'Too long' })], 'x')).toEqual([
      { name: 'valueMissing', message: 'Required x' },
      { name: 'noSundays', message: 'Not on Sundays' },
      { name: 'tooLong', message: 'Too long' }
    ]);
  });

  it('finds the same shared list when the validators pass, or there are none', () => {
    expect(findFormErrors([() => undefined, () => ({}), () => ({ valueMissing: undefined })], 'x')).toBe(NO_FORM_ERRORS);
    expect(findFormErrors(NO_FORM_VALIDATORS, 'x')).toBe(NO_FORM_ERRORS);
    expect([NO_FORM_ERRORS, NO_FORM_VALIDATORS]).toEqual([[], []]);
  });

  it('joins two lists of errors, keeping one as it is when the other is empty', () => {
    const first = [{ name: 'a', message: 'A' }];
    const second = [{ name: 'b', message: 'B' }];

    expect(joinFormErrors(first, second)).toEqual([...first, ...second]);
    expect(joinFormErrors(NO_FORM_ERRORS, second)).toBe(second);
    expect(joinFormErrors(first, NO_FORM_ERRORS)).toBe(first);
  });

  it('gives the form the validity: the native flag of each native name, customError for the others, and the first message', () => {
    const internals = fakeInternals();
    const anchor = document.createElement('button');

    writeFormValidity(internals, [{ name: 'valueMissing', message: 'Required' }, { name: 'noSundays', message: 'Sunday' }], anchor);
    writeFormValidity(internals, [{ name: 'tooLong', message: 'Too long' }], undefined);
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

  it('tells the native fields, which answer setCustomValidity, from the other elements', () => {
    expect(isNativeFormField(document.createElement('input'))).toBe(true);
    expect(isNativeFormField(document.createElement('textarea'))).toBe(true);
    expect(isNativeFormField(document.createElement('div'))).toBe(false);
  });

  it('reads the value of a native field as Angular gives it', () => {
    const checkbox = input('checkbox');
    checkbox.checked = true;
    const select = document.createElement('select');
    select.multiple = true;
    select.innerHTML = '<option value="a" selected>A</option><option value="b">B</option><option value="c" selected>C</option>';
    const textarea = document.createElement('textarea');
    textarea.value = 'text';

    expect(readNativeValue(checkbox)).toBe(true);
    expect(readNativeValue(input('radio'))).toBe(false);
    expect(readNativeValue(input('number', '4.5'))).toBe(4.5);
    expect(readNativeValue(input('number', ''))).toBeNull();
    expect(readNativeValue(input('range', '7'))).toBe(7);
    expect(readNativeValue(input('text', 'abc'))).toBe('abc');
    expect(readNativeValue(select)).toEqual(['a', 'c']);
    expect(readNativeValue(document.createElement('select'))).toBe('');
    expect(readNativeValue(textarea)).toBe('text');
  });

  it('reads the error its own constraints give a native field, with the message of the browser, after clearing the custom one', () => {
    const field = {
      setCustomValidity: vi.fn(),
      validity: { valueMissing: false, typeMismatch: true, customError: false },
      validationMessage: 'Enter an email address.'
    } as unknown as HTMLInputElement;

    expect(readNativeErrors(field)).toEqual([{ name: 'typeMismatch', message: 'Enter an email address.' }]);
    expect(field.setCustomValidity).toHaveBeenCalledWith('');
    expect(readNativeErrors({ setCustomValidity: vi.fn(), validity: {}, validationMessage: '' } as unknown as HTMLInputElement)).toBe(NO_FORM_ERRORS);
  });
});
