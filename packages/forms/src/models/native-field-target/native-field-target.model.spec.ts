// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { effect } = await import('@xaendar/core/signals');
const { NativeFieldTarget } = await import('./native-field-target.model');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

describe('NativeFieldTarget', () => {
  it('takes the form of the field and its value, read again when the user edits it and after the reset', async () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.type = 'number';
    input.value = '3';
    form.appendChild(input);
    const target = new NativeFieldTarget(input);
    const values = new Array<unknown>();
    effect(() => values.push(target.value()));

    expect(target.form).toBe(form);
    expect(values).toEqual([3]);

    input.value = '4';
    target.edited();
    await flush();
    input.value = '';
    target.reset();
    await flush();

    expect(values).toEqual([3, 4, null]);
    expect(new NativeFieldTarget(document.createElement('textarea')).form).toBeNull();
  });

  it('gives the error of its constraints, and takes the first error of the validators as its custom error', () => {
    const input = document.createElement('input');
    input.required = true;
    const target = new NativeFieldTarget(input);
    const setCustomValidity = vi.spyOn(input, 'setCustomValidity');

    expect(target.ownErrors()).toEqual([{ name: 'valueMissing', message: input.validationMessage }]);

    target.setCustomErrors([{ name: 'noSundays', message: 'Sunday' }, { name: 'tooLong', message: 'Long' }]);
    expect(setCustomValidity).toHaveBeenLastCalledWith('Sunday');
    target.setCustomErrors([]);
    expect(setCustomValidity).toHaveBeenLastCalledWith('');
  });

  it('has no custom states to write', () => {
    const input = document.createElement('input');

    expect(() => new NativeFieldTarget(input).writeState('touched', true)).not.toThrow();
  });
});
