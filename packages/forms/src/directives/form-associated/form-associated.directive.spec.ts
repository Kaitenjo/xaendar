// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  // Dev mode warns of an invalid transition of a computed signal, which a signal written then read by an effect causes
  loadSignals({ devMode: true });
});

const core = await import('@xaendar/core');
const { signal } = await import('@xaendar/core/signals');
const { CustomElement, WebComponent, _defineRender, _scope } = core;
const { FormAssociatedDirective } = await import('./form-associated.directive');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

let counter = 0;

/**
 * A field: a value, an anchor, and the bridge.
 */
class Field extends CustomElement {
  public readonly value = signal('a');
  public readonly count = signal(1);
  public readonly anchor = signal<HTMLElement | undefined>(undefined);

  public get form(): InstanceType<typeof FormAssociatedDirective> {
    return this.hostDirectives.get(FormAssociatedDirective)!;
  }
}

/**
 * Defines a component declaring the bridge among its host directives, whose `onInit` runs the given code, with an
 * `ElementInternals` recording the calls, which happy-dom lacks (none when `internals` is `null`, as on the server).
 */
function createField(onInit: (field: Field) => void, internals: ElementInternals | null = fakeInternals()): { element: Field, internals: ElementInternals } {
  if (internals) {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: () => internals });
  }

  const selector = `x-associated-${counter++}`;

  @WebComponent({ selector, hostDirectives: [FormAssociatedDirective], templateUrl: './x.html' })
  class Component extends Field {
    public onInit(): void {
      onInit(this);
    }
  }
  _defineRender(Component, () => _scope(null, { size: 5, nodes: 5 } as never));

  return { element: document.createElement(selector) as Field, internals: internals! };
}

/**
 * An `ElementInternals` recording the calls.
 */
function fakeInternals(): ElementInternals {
  return { setFormValue: vi.fn(), setValidity: vi.fn(), states: new Set<string>() } as unknown as ElementInternals;
}

describe('FormAssociatedDirective', () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'attachInternals');
    document.body.replaceChildren();
  });

  it('makes its component form-associated, gives the form its value, and writes back the first one on reset', async () => {
    const { element, internals } = createField(field => field.form.setValue(field.value));
    document.body.appendChild(element);

    expect((element.constructor as unknown as { formAssociated: boolean }).formAssociated).toBe(true);
    expect(element.form.internals).toBe(internals);
    expect(element.form.source).toBe(element.value);
    expect(internals.setFormValue).toHaveBeenLastCalledWith('a');

    element.value.set('b');
    await flush();
    expect(internals.setFormValue).toHaveBeenLastCalledWith('b');

    (element as unknown as { formResetCallback(): void }).formResetCallback();
    expect(element.value()).toBe('a');
    (element as unknown as { formStateRestoreCallback(state: string, mode: string): void }).formStateRestoreCallback('c', 'restore');
    expect(element.value()).toBe('c');
  });

  it('gives the form the value of one signal only, again once connected again', () => {
    const { element } = createField(field => field.form.setValue(field.value));
    document.body.appendChild(element);

    expect(() => element.form.setValue(element.value)).toThrow('FormAssociatedDirective.setValue() was already called: a field gives its form the value of one signal, set once');
    element.remove();
    expect(() => document.body.appendChild(element)).not.toThrow();
  });

  it('converts the value for the form, leaving the restoration to the component, and follows the disabled state', () => {
    const { element, internals } = createField(field => field.form.setValue(field.count, count => String(count * 10)));
    document.body.appendChild(element);

    expect(internals.setFormValue).toHaveBeenLastCalledWith('10');
    (element as unknown as { formStateRestoreCallback(state: string, mode: string): void }).formStateRestoreCallback('30', 'autocomplete');
    expect(element.count()).toBe(1);

    expect(element.form.disabled()).toBe(false);
    (element as unknown as { formDisabledCallback(disabled: boolean): void }).formDisabledCallback(true);
    expect(element.form.disabled()).toBe(true);
  });

  it('gives the form the errors of its validators for its value, then the custom ones, replaced by each call', async () => {
    const { element, internals } = createField(field => {
      field.form.setValue(field.value);
      field.form.setValidators([value => value ? undefined : { valueMissing: 'Required' }], field.anchor);
    });
    document.body.appendChild(element);
    expect(element.form.errors()).toEqual([]);
    expect(internals.setValidity).toHaveBeenLastCalledWith({});

    element.value.set('');
    await flush();
    expect(element.form.errors()).toEqual([{ name: 'valueMissing', message: 'Required' }]);
    expect(internals.setValidity).toHaveBeenLastCalledWith({ valueMissing: true }, 'Required', undefined);

    const anchor = document.createElement('button');
    element.anchor.set(anchor);
    element.form.setCustomErrors([{ name: 'noSundays', message: 'Sunday' }]);
    await flush();
    expect(internals.setValidity).toHaveBeenLastCalledWith({ valueMissing: true, customError: true }, 'Required', anchor);
    expect(element.form.errors()).toEqual([{ name: 'valueMissing', message: 'Required' }]);

    element.form.setValidators([]);
    await flush();
    expect(element.form.errors()).toEqual([]);
    expect(internals.setValidity).toHaveBeenLastCalledWith({ customError: true }, 'Sunday', undefined);
  });

  it('writes the value before the validity, in one run, with no warning and no second run for the custom errors', async () => {
    const calls = new Array<string>();
    const internals = {
      setFormValue: (value: unknown) => calls.push(`value ${String(value)}`),
      setValidity: (flags: object) => calls.push(`validity ${Object.keys(flags).join(',')}`),
      states: new Set<string>()
    } as unknown as ElementInternals;
    const validator = vi.fn((value: unknown) => value ? undefined : { valueMissing: 'Required' });
    const warn = vi.spyOn(console, 'warn');
    const { element } = createField(field => {
      field.form.setValue(field.value);
      field.form.setValidators([validator]);
    }, internals);
    document.body.appendChild(element);
    calls.length = 0;
    validator.mockClear();

    element.value.set('');
    await flush();
    element.value.set('b');
    await flush();
    element.value.set('');
    await flush();
    expect(calls).toEqual(['value ', 'validity valueMissing', 'value b', 'validity ', 'value ', 'validity valueMissing']);
    expect(validator).toHaveBeenCalledTimes(3);

    element.form.setCustomErrors([{ name: 'noSundays', message: 'Sunday' }]);
    element.form.setCustomErrors([{ name: 'noMondays', message: 'Monday' }]);
    await flush();
    expect(calls.slice(-2)).toEqual(['validity valueMissing,customError', 'validity valueMissing,customError']);
    expect(validator).toHaveBeenCalledTimes(3);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('writes nothing where the DOM has no ElementInternals, as on the server', () => {
    const { element } = createField(field => {
      field.form.setValue(field.value);
      field.form.setValidators([() => ({ valueMissing: 'Required' })]);
    }, null);

    expect(() => document.body.appendChild(element)).not.toThrow();
    expect(element.form.internals).toBeNull();
    expect(element.form.errors()).toEqual([{ name: 'valueMissing', message: 'Required' }]);
  });
});
