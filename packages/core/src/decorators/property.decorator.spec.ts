import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { Property } = await import('./property.decorator');
const { INPUT_SIGNAL_SET_SYMBOL } = await import('../signals/input/input-set.symbol');

type Decorated = { get(): any, init(value?: unknown): any };
type Metadata = { aliasToAttribute?: Record<string, string> };

function apply(decorator: unknown, name: string | symbol = 'label', metadata: Metadata = {}): Decorated {
  return (decorator as (value: unknown, context: unknown) => Decorated)(undefined, { name, metadata });
}

describe('Property decorator', () => {
  it('throws for symbol properties', () => {
    expect(() => apply(Property(), Symbol('label'))).toThrow('Symbol properties are not supported');
  });

  it('creates an input signal without default value', () => {
    expect(apply(Property()).get()()).toBeUndefined();
  });

  it('creates an input signal with the default value', () => {
    expect(apply(Property(5)).get()()).toBe(5);
  });

  it('returns the same signal from get() and init()', () => {
    const decorated = apply(Property(1));
    expect(decorated.init()).toBe(decorated.get());
  });

  it('accepts an object as default value', () => {
    const value = { a: 1 };
    expect(apply(Property(value)).get()()).toBe(value);
  });

  it('registers the property name as attribute in the metadata', () => {
    const metadata: Metadata = {};
    apply(Property(), 'label', metadata);
    expect(metadata.aliasToAttribute).toEqual({ label: 'label' });
  });

  it('registers the alias as attribute in the metadata', () => {
    const metadata: Metadata = {};
    apply(Property('a', { alias: 'my-label' }), 'label', metadata);
    expect(metadata.aliasToAttribute).toEqual({ 'my-label': 'label' });
  });

  it('accumulates the aliases of multiple properties in the same metadata', () => {
    const metadata: Metadata = {};
    apply(Property(), 'first', metadata);
    apply(Property(), 'second', metadata);
    expect(metadata.aliasToAttribute).toEqual({ first: 'first', second: 'second' });
  });

  it('forwards the transform option', () => {
    const signal = apply(Property<any, any, number, string>(0, { transform: Number })).get();
    signal.set('7', INPUT_SIGNAL_SET_SYMBOL);
    expect(signal()).toBe(7);
  });

  describe('required', () => {
    it('creates an input signal with no default value', () => {
      expect(apply(Property.required()).get()()).toBeUndefined();
    });

    it('registers the alias in the metadata', () => {
      const metadata: Metadata = {};
      apply(Property.required({ alias: 'user-id' }), 'userId', metadata);
      expect(metadata.aliasToAttribute).toEqual({ 'user-id': 'userId' });
    });

    it('forwards the transform option', () => {
      const signal = apply(Property.required<any, number, string>({ transform: Number })).get();
      signal.set('3', INPUT_SIGNAL_SET_SYMBOL);
      expect(signal()).toBe(3);
    });
  });
});
