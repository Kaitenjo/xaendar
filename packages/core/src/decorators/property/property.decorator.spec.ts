import { describe, expect, it, vi } from 'vitest';
import { INTERNAL_ALIAS_TO_ATTRIBUTE } from '../../costants';
import type { InputSignal } from '../../signals/types/input-signal.type';
import type { PropertyDecoratorOptions, PropertyDecoratorOptionsWithRequired } from '../../types/property-decorator-options.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { Property } = await import('../property/property.decorator');
const { isInputSignal } = await import('../../signals/input/input-instance.symbol');
const { INPUT_SIGNAL_SET_SYMBOL } = await import('../../signals/input/input-set.symbol');

type Metadata = { [INTERNAL_ALIAS_TO_ATTRIBUTE]?: Record<string, string> };
type Decorated<ActualValue> = { init(this: unknown): InputSignal<ActualValue>, set(this: unknown, value: unknown): void };
type Accessor<ActualValue> = {
  signal: InputSignal<ActualValue>,
  assign: (value: unknown) => void,
  originalSet: ReturnType<typeof vi.fn>
};

function setup<ActualValue = unknown, IncomingValue = ActualValue>(
  value?: ActualValue,
  options?: PropertyDecoratorOptions<ActualValue, IncomingValue>,
  name: string | symbol = 'label',
  metadata: Metadata = {}
): Decorated<ActualValue> {
  const decorator = Property<InputSignal<ActualValue>, IncomingValue, ActualValue>(value, options);
  const decorated = decorator({} as Parameters<typeof decorator>[0], { name, metadata } as unknown as Parameters<typeof decorator>[1]);
  return decorated as unknown as Decorated<ActualValue>;
}

function setupRequired<ActualValue = unknown, IncomingValue = ActualValue>(
  options?: Omit<PropertyDecoratorOptionsWithRequired<ActualValue, IncomingValue>, 'required'>,
  name: string | symbol = 'label',
  metadata: Metadata = {}
): Decorated<ActualValue> {
  const decorator = Property.required<ActualValue, IncomingValue>(options);
  const decorated = decorator({} as Parameters<typeof decorator>[0], { name, metadata } as unknown as Parameters<typeof decorator>[1]);
  return decorated as unknown as Decorated<ActualValue>;
}

/*
  Decorates the accessor `label` of an element, with a getter and a setter backed by a storage of their own, as the
  ones of a real accessor: the getter returns the signal created by `init`.
*/
function setupAccessor<ActualValue = unknown, IncomingValue = ActualValue>(
  value?: ActualValue,
  options?: PropertyDecoratorOptions<ActualValue, IncomingValue>
): Accessor<ActualValue> {
  const element = {};
  const target = { get: () => stored!, set: vi.fn() };
  const decorator = Property<InputSignal<ActualValue>, IncomingValue, ActualValue>(value, options);
  const decorated = decorator(target, { name: 'label', metadata: {} } as unknown as Parameters<typeof decorator>[1]) as unknown as Decorated<ActualValue>;
  const stored = decorated.init.call(element);

  return { signal: stored, assign: newValue => decorated.set.call(element, newValue), originalSet: target.set };
}

function setValue<ActualValue, IncomingValue>(signal: InputSignal<ActualValue>, value: IncomingValue): void {
  if (!isInputSignal(signal)) {
    throw new Error('Expected an InputSignal');
  }

  signal.set(value, INPUT_SIGNAL_SET_SYMBOL);
}

function resetValue<ActualValue>(signal: InputSignal<ActualValue>): void {
  if (!isInputSignal(signal)) {
    throw new Error('Expected an InputSignal');
  }

  signal.reset(INPUT_SIGNAL_SET_SYMBOL);
}

describe('Property decorator', () => {
  it('throws for symbol properties', () => {
    expect(() => setup(undefined, undefined, Symbol('label'))).toThrow('Symbol properties are not supported');
  });

  it('creates an input signal without default value', () => {
    expect(setup().init()()).toBeUndefined();
  });

  it('creates an input signal with the default value', () => {
    expect(setup(5).init()()).toBe(5);
  });

  it('creates a separate signal for each instance', () => {
    const decorated = setup(1);
    const first = decorated.init();
    const second = decorated.init();
    expect(first).not.toBe(second);

    setValue(first, 2);
    expect(first()).toBe(2);
    expect(second()).toBe(1);
  });

  it('accepts an object as default value', () => {
    const value = { a: 1 };
    expect(setup(value).init()()).toBe(value);
  });

  it('registers the property name as attribute in the metadata', () => {
    const metadata: Metadata = {};
    setup(undefined, undefined, 'label', metadata);
    expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ label: 'label' });
  });

  it('registers the alias as attribute in the metadata', () => {
    const metadata: Metadata = {};
    setup('a', { alias: 'my-label' }, 'label', metadata);
    expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ 'my-label': 'label' });
  });

  it('accumulates the aliases of multiple properties in the same metadata', () => {
    const metadata: Metadata = {};
    setup(undefined, undefined, 'first', metadata);
    setup(undefined, undefined, 'second', metadata);
    expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ first: 'first', second: 'second' });
  });

  it('keeps the aliases of a subclass out of the metadata of its parent and of its siblings', () => {
    const parent: Metadata = {};
    setup(undefined, undefined, 'label', parent);
    const child: Metadata = Object.create(parent);
    const sibling: Metadata = Object.create(parent);
    setup(undefined, { alias: 'hint' }, 'text', child);
    setup(undefined, undefined, 'count', sibling);

    expect(parent[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ label: 'label' });
    expect(child[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ label: 'label', hint: 'text' });
    expect(sibling[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ label: 'label', count: 'count' });
  });

  it('registers the aliases of a subclass whose parent declares no input', () => {
    const child: Metadata = Object.create({});
    setup(undefined, undefined, 'text', child);

    expect(child[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ text: 'text' });
  });

  it('forwards the transform option', () => {
    const signal = setup<number, string>(0, { transform: Number }).init();
    setValue(signal, '7');
    expect(signal()).toBe(7);
  });

  describe('value assigned before the upgrade', () => {
    it('becomes the initial value of the input, in place of the default', () => {
      const element = { label: 7 };
      expect(setup(5).init.call(element)()).toBe(7);
    });

    it('goes through the transform of the input', () => {
      const element = { label: '4' };
      expect(setup<number, string>(0, { transform: Number }).init.call(element)()).toBe(4);
    });

    it('leaves the default as the value a reset goes back to', () => {
      const signal = setup(5).init.call({ label: 7 });
      resetValue(signal);
      expect(signal()).toBe(5);
    });

    it('is removed from the element, so the accessor is no longer shadowed', () => {
      const element = { label: 7 };
      setup(5).init.call(element);
      expect(Object.hasOwn(element, 'label')).toBe(false);
    });

    it('is read from the name of the property, not from its alias', () => {
      const element = { label: 7, 'my-label': 9 };
      expect(setup(5, { alias: 'my-label' }).init.call(element)()).toBe(7);
      expect(element).toEqual({ 'my-label': 9 });
    });

    it('leaves the other inputs to their default', () => {
      const element = { other: 7 };
      expect(setup(5).init.call(element)()).toBe(5);
      expect(element).toEqual({ other: 7 });
    });
  });

  describe('assignment', () => {
    it('writes the value into the input signal of the element', () => {
      const { signal, assign } = setupAccessor(1);
      assign(3);
      expect(signal()).toBe(3);
    });

    it('keeps the input signal in the accessor', () => {
      const { assign, originalSet } = setupAccessor(1);
      assign(3);
      expect(originalSet).not.toHaveBeenCalled();
    });

    it('applies the transform of the input', () => {
      const { signal, assign } = setupAccessor<number, string>(0, { transform: Number });
      assign('7');
      expect(signal()).toBe(7);
    });

    it('notifies the readers of the input', () => {
      const { signal, assign } = setupAccessor(1);
      const doubled = new Signal.Computed(() => signal() * 2);
      expect(doubled.get()).toBe(2);

      assign(4);
      expect(doubled.get()).toBe(8);
    });
  });

  describe('required', () => {
    it('creates an input signal with no default value', () => {
      expect(setupRequired().init()()).toBeUndefined();
    });

    it('registers the alias in the metadata', () => {
      const metadata: Metadata = {};
      setupRequired({ alias: 'user-id' }, 'userId', metadata);
      expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ 'user-id': 'userId' });
    });

    it('forwards the transform option', () => {
      const signal = setupRequired<number, string>({ transform: Number }).init();
      setValue(signal, '3');
      expect(signal()).toBe(3);
    });
  });
});
