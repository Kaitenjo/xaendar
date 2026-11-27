// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const core = await import('@xaendar/core');
const { signal } = await import('@xaendar/core/signals');
const { CustomElement, WebComponent, _defineRender, _resolveDirective, _scope, _setInput, CustomDirective } = core;
const { FormAssociatedDirective } = await import('../form-associated/form-associated.directive');
const { FormFieldDirective } = await import('./form-field.directive');
const { maxLength, required } = await import('../../utils/validators/validators.utils');

type Control = InstanceType<typeof FormFieldDirective>;

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

/**
 * Applies the directive to an element with the validators given, as a template does, and starts it. Its host listeners
 * are bound by the runtime, which the spec does not run: the events are given to the handlers by {@link dispatch}.
 */
function apply(element: HTMLElement, validators: unknown[] = []): Control {
  const control = new FormFieldDirective();
  control[core._SET_DIRECTIVE_ELEMENT] = element;
  _setInput(undefined as never, control, { name: 'validators', value: validators } as never);
  control.onInit();
  return control;
}

/**
 * Gives an event to the handler the directive declares for it, as its host listener does.
 */
function dispatch(control: Control, event: 'change' | 'focusout' | 'input'): void {
  const handlers = control as unknown as { _edit(): void, _touch(): void };
  event === 'focusout' ? handlers._touch() : handlers._edit();
}

let counter = 0;

describe('FormFieldDirective', () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'attachInternals');
    document.body.replaceChildren();
  });

  it('is the custom directive of the selector formField', () => {
    expect(_resolveDirective('formField', CustomDirective)).toBe(FormFieldDirective);
  });

  it('gives a native field the states, its own error and the ones of the validators, the first one as its custom error', async () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.required = true;
    form.appendChild(input);
    document.body.appendChild(form);
    const setCustomValidity = vi.spyOn(input, 'setCustomValidity');
    const control = apply(input, [maxLength(2, 'Too long.')]);

    expect([control.untouched(), control.pristine(), control.valid()]).toEqual([true, true, false]);
    expect(control.errors()).toEqual([{ name: 'valueMissing', message: input.validationMessage || expect.any(String) }]);

    input.value = 'abc';
    dispatch(control, 'input');
    dispatch(control, 'focusout');
    await flush();
    expect([control.untouched(), control.pristine(), control.valid()]).toEqual([false, false, false]);
    expect(control.errors()).toEqual([{ name: 'tooLong', message: 'Too long.' }]);
    expect(setCustomValidity).toHaveBeenLastCalledWith('Too long.');

    input.value = 'ab';
    dispatch(control, 'change');
    await flush();
    expect([control.valid(), control.errors()]).toEqual([true, []]);
    expect(setCustomValidity).toHaveBeenLastCalledWith('');

    form.dispatchEvent(new Event('reset'));
    await flush();
    expect([control.untouched(), control.pristine()]).toEqual([true, true]);

    control.onDestroy();
    form.dispatchEvent(new Event('reset'));
    expect(setCustomValidity).toHaveBeenLastCalledWith('');
  });

  it('follows the validators it is given, and stays dirty when the value goes back', async () => {
    const input = document.createElement('input');
    const control = apply(input, [required('Required.')]);
    expect(control.errors()).toEqual([{ name: 'valueMissing', message: 'Required.' }]);

    input.value = 'a';
    dispatch(control, 'input');
    input.value = '';
    dispatch(control, 'input');
    await flush();
    expect([control.pristine(), control.valid()]).toEqual([false, false]);

    _setInput(undefined as never, control, { name: 'validators', value: [] } as never);
    await flush();
    expect(control.valid()).toBe(true);
  });

  it('gives a component the states and the validators, joined with its own errors through its bridge', async () => {
    const internals = { setFormValue: vi.fn(), setValidity: vi.fn(), states: new Set<string>(), form: null } as unknown as ElementInternals;
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: () => internals });
    const selector = `x-control-field-${counter++}`;

    @WebComponent({ selector, hostDirectives: [FormAssociatedDirective], templateUrl: './x.html' })
    class Component extends CustomElement {
      public readonly value = signal(0);
      public readonly form = this.hostDirectives.get(FormAssociatedDirective)!;

      public onInit(): void {
        this.form.setValue(this.value, value => String(value));
        this.form.setValidators([value => value ? undefined : { valueMissing: 'Choose.' }]);
      }
    }
    _defineRender(Component, () => _scope(null, { size: 5, nodes: 5 } as never));
    const element = document.createElement(selector) as Component;
    document.body.appendChild(element);
    const control = apply(element, [(value: unknown) => value === 1 ? { noOne: 'Not one.' } : undefined]);

    expect(control.errors()).toEqual([{ name: 'valueMissing', message: 'Choose.' }]);

    element.value.set(1);
    dispatch(control, 'change');
    dispatch(control, 'focusout');
    await flush();
    expect(control.errors()).toEqual([{ name: 'noOne', message: 'Not one.' }]);
    expect(internals.setValidity).toHaveBeenLastCalledWith({ customError: true }, 'Not one.', undefined);
    expect([...internals.states].sort()).toEqual(['dirty', 'touched']);

    control.onDestroy();
    await flush();
    expect(internals.setValidity).toHaveBeenLastCalledWith({});
  });

  it('refuses an element that is neither a native field nor a component with the bridge', () => {
    expect(() => apply(document.createElement('div'))).toThrow('FormFieldDirective is applied to <div>, which is neither a native field nor a component declaring FormAssociatedDirective among its host directives');
  });
});
