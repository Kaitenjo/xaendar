// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const core = await import('@xaendar/core');
const { signal } = await import('@xaendar/core/signals');
const { CustomElement, WebComponent, _defineRender, _scope } = core;
const { FormControlDirective } = await import('./form-control.directive');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

let counter = 0;

/**
 * Defines a component declaring the form control among its host directives, whose `onInit` runs the given code, with an
 * `ElementInternals` recording the calls, which happy-dom lacks.
 */
function createField(onInit: (field: Field) => void): { element: Field, internals: ElementInternals } {
  const internals = { setFormValue: vi.fn(), setValidity: vi.fn(), states: new Set<string>() } as unknown as ElementInternals;
  Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: () => internals });
  const selector = `x-form-field-${counter++}`;

  @WebComponent({ selector, hostDirectives: [FormControlDirective], templateUrl: './x.html' })
  class Component extends Field {
    public onInit(): void {
      onInit(this);
    }
  }
  _defineRender(Component, () => _scope(null, { size: 5, nodes: 5 } as never));

  return { element: document.createElement(selector) as Field, internals };
}

/**
 * A field: a value, and the form control.
 */
class Field extends CustomElement {
  public readonly value = signal('a');
  public readonly count = signal(1);
  public readonly anchor = signal<HTMLElement | undefined>(undefined);

  public get control(): InstanceType<typeof FormControlDirective> {
    return this.hostDirectives.get(FormControlDirective)!;
  }
}

describe('FormControlDirective', () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'attachInternals');
    document.body.replaceChildren();
  });

  it('makes its component form-associated and gives the form its value, following the signal', async () => {
    const { element, internals } = createField(field => field.control.setValue(field.value));
    document.body.appendChild(element);

    expect((element.constructor as unknown as { formAssociated: boolean }).formAssociated).toBe(true);
    expect(element.control.internals).toBe(internals);
    expect(internals.setFormValue).toHaveBeenLastCalledWith('a');

    element.value.set('b');
    await flush();
    expect(internals.setFormValue).toHaveBeenLastCalledWith('b');
  });

  it('exposes untouched, pristine, valid and disabled as signals to follow, leaving the opposites to the consumer', async () => {
    const { element } = createField(field => field.control.setValue(field.value));
    document.body.appendChild(element);
    const control = element.control;
    const seen = new Array<string>();
    element.effect(() => seen.push(`${control.untouched()} ${control.pristine()} ${control.valid()} ${control.disabled()}`));

    expect(seen).toEqual(['true true true false']);

    (element as unknown as { formDisabledCallback(disabled: boolean): void }).formDisabledCallback(true);
    await flush();
    element.dispatchEvent(new Event('focusout'));
    await flush();
    element.dispatchEvent(new Event('input'));
    await flush();

    expect(seen.at(-1)).toBe('false false true true');
  });

  it('is touched when the user leaves the element or the form finds it invalid, with the custom state', () => {
    const { element, internals } = createField(() => undefined);
    document.body.appendChild(element);

    element.dispatchEvent(new Event('focusout'));
    expect(element.control.untouched()).toBe(false);
    expect([...internals.states]).toEqual(['touched']);

    (element as unknown as { formResetCallback(): void }).formResetCallback();
    expect(element.control.untouched()).toBe(true);
    element.dispatchEvent(new Event('invalid'));
    expect(element.control.untouched()).toBe(false);
  });

  it('is dirty as soon as the user changes the value, even to the same value or back to the first one, never for the code of the application', async () => {
    const { element, internals } = createField(field => field.control.setValue(field.value));
    document.body.appendChild(element);
    const control = element.control;

    element.value.set('b');
    (element as unknown as { formStateRestoreCallback(state: string, mode: string): void }).formStateRestoreCallback('c', 'restore');
    await flush();
    expect(control.pristine()).toBe(true);

    // Pasting the text the field already holds changes no signal: the event of the browser is what tells
    element.value.set('a');
    element.dispatchEvent(new Event('change'));
    await flush();
    expect(control.pristine()).toBe(false);
    expect([...internals.states]).toEqual(['dirty']);

    // Back to the first value, it stays dirty
    element.value.set('b');
    element.value.set('a');
    await flush();
    expect(control.pristine()).toBe(false);

    (element as unknown as { formResetCallback(): void }).formResetCallback();
    expect(control.pristine()).toBe(true);
    expect(element.value()).toBe('a');
    expect([...internals.states]).toEqual([]);
  });

  it('gives the form the value of one signal only, again once connected again', () => {
    const { element } = createField(field => field.control.setValue(field.value));
    document.body.appendChild(element);

    expect(() => element.control.setValue(element.value)).toThrow('FormControlDirective.setValue() was already called: a control gives its form the value of one signal, set once');
    element.remove();
    expect(() => document.body.appendChild(element)).not.toThrow();
  });

  it('converts the value for the form, leaving the restoration to the component, and follows the disabled state', () => {
    const { element, internals } = createField(field => field.control.setValue(field.count, count => String(count * 10)));
    document.body.appendChild(element);

    expect(internals.setFormValue).toHaveBeenLastCalledWith('10');
    (element as unknown as { formStateRestoreCallback(state: string, mode: string): void }).formStateRestoreCallback('30', 'autocomplete');
    expect(element.count()).toBe(1);

    (element as unknown as { formDisabledCallback(disabled: boolean): void }).formDisabledCallback(true);
    expect(element.control.disabled()).toBe(true);
  });

  it('gives the form the validity of its validators, replaced by each call and removed by an empty list', async () => {
    const { element, internals } = createField(field => field.control.setValidators([
      () => field.value() ? undefined : { valueMissing: 'Required' },
      () => field.value() === 'x' ? { customError: 'Not x' } : undefined
    ], field.anchor));
    document.body.appendChild(element);
    expect(internals.setValidity).toHaveBeenLastCalledWith({});

    element.value.set('');
    await flush();
    expect(internals.setValidity).toHaveBeenLastCalledWith({ valueMissing: true }, 'Required', undefined);

    const anchor = document.createElement('button');
    element.anchor.set(anchor);
    element.value.set('x');
    await flush();
    expect(internals.setValidity).toHaveBeenLastCalledWith({ customError: true }, 'Not x', anchor);

    element.control.setValidators([() => ({ customError: 'Always' })]);
    expect(internals.setValidity).toHaveBeenLastCalledWith({ customError: true }, 'Always', undefined);

    expect(element.control.valid()).toBe(false);
    element.control.setValidators([]);
    expect(element.control.valid()).toBe(true);
    expect(internals.setValidity).toHaveBeenLastCalledWith({});
    const calls = vi.mocked(internals.setValidity).mock.calls.length;
    element.value.set('');
    await flush();
    expect(internals.setValidity).toHaveBeenCalledTimes(calls);
  });

  it('writes nothing where the DOM has no ElementInternals, as on the server', () => {
    const selector = `x-form-field-${counter++}`;
    @WebComponent({ selector, hostDirectives: [FormControlDirective], templateUrl: './x.html' })
    class Component extends Field {
      public onInit(): void {
        this.control.setValue(this.value);
        this.control.setValidators([() => ({ valueMissing: 'Required' })]);
      }
    }
    _defineRender(Component, () => _scope(null, { size: 5, nodes: 5 } as never));
    const element = document.createElement(selector) as Field;

    expect(() => document.body.appendChild(element)).not.toThrow();
    expect(element.control.internals).toBeNull();
    element.dispatchEvent(new Event('focusout'));
    element.dispatchEvent(new Event('input'));
    expect([element.control.untouched(), element.control.pristine(), element.control.valid()]).toEqual([false, false, false]);
  });
});
