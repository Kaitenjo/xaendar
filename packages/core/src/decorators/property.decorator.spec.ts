import { ClassAccessorDecoratorValue } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { INTERNAL_ALIAS_TO_ATTRIBUTE } from '../costants';
import { CustomElement } from '../models';
import type { InputSignal } from '../signals/types/input-signal.type';
import type { PropertyDecoratorOptions, PropertyDecoratorOptionsWithRequired } from '../types/property-decorator-options.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { Property } = await import('./property.decorator');
const { isInputSignal } = await import('../signals/input/input-instance.symbol');
const { INPUT_SIGNAL_SET_SYMBOL } = await import('../signals/input/input-set.symbol');

type Metadata = { [INTERNAL_ALIAS_TO_ATTRIBUTE]?: Record<string, string> };
type Decorated<ActualValue> = { get(): InputSignal<ActualValue>; init(): InputSignal<ActualValue> };

function setup<ActualValue = unknown, IncomingValue = ActualValue>(
  value?: ActualValue,
  options?: PropertyDecoratorOptions<ActualValue, IncomingValue>,
  name: string | symbol = 'label',
  metadata: Metadata = {}
): Decorated<ActualValue> {
  const context = { name, metadata } as unknown as ClassAccessorDecoratorContext<CustomElement, InputSignal<ActualValue>>;
  const decorated = Property<CustomElement, InputSignal<ActualValue>, ActualValue, IncomingValue>(value, options)({} as ClassAccessorDecoratorValue<InputSignal<ActualValue>>, context);
  return decorated as unknown as Decorated<ActualValue>;
}

function setupRequired<ActualValue = unknown, IncomingValue = ActualValue>(
  options?: Omit<PropertyDecoratorOptionsWithRequired<ActualValue, IncomingValue>, 'required'>,
  name: string | symbol = 'label',
  metadata: Metadata = {}
): Decorated<ActualValue> {
  const context = { name, metadata } as unknown as ClassAccessorDecoratorContext<CustomElement, InputSignal<ActualValue>>;
  const decorated = Property.required<CustomElement, ActualValue, IncomingValue>(options)({} as ClassAccessorDecoratorValue<InputSignal<ActualValue>>, context);
  return decorated as unknown as Decorated<ActualValue>;
}

function setValue<ActualValue, IncomingValue>(signal: InputSignal<ActualValue>, value: IncomingValue): void {
  if (!isInputSignal(signal)) {
    throw new Error('Expected an InputSignal');
  }

  signal.set(value, INPUT_SIGNAL_SET_SYMBOL);
}

describe('Property decorator', () => {
  it('throws for symbol properties', () => {
    expect(() => setup(undefined, undefined, Symbol('label'))).toThrow('Symbol properties are not supported');
  });

  it('creates an input signal without default value', () => {
    expect(setup().get()()).toBeUndefined();
  });

  it('creates an input signal with the default value', () => {
    expect(setup(5).get()()).toBe(5);
  });

  it('returns the same signal from get() and init()', () => {
    const decorated = setup(1);
    expect(decorated.init()).toBe(decorated.get());
  });

  it('accepts an object as default value', () => {
    const value = { a: 1 };
    expect(setup(value).get()()).toBe(value);
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

  it('forwards the transform option', () => {
    const signal = setup<number, string>(0, { transform: Number }).get();
    setValue(signal, '7');
    expect(signal()).toBe(7);
  });

  describe('required', () => {
    it('creates an input signal with no default value', () => {
      expect(setupRequired().get()()).toBeUndefined();
    });

    it('registers the alias in the metadata', () => {
      const metadata: Metadata = {};
      setupRequired({ alias: 'user-id' }, 'userId', metadata);
      expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ 'user-id': 'userId' });
    });

    it('forwards the transform option', () => {
      const signal = setupRequired<number, string>({ transform: Number }).get();
      setValue(signal, '3');
      expect(signal()).toBe(3);
    });
  });
});
