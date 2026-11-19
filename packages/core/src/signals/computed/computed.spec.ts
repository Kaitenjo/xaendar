import { describe, expect, it, vi } from 'vitest';
import { NODE } from '../node/node.symbol';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { computed } = await import('./computed');
const { signal } = await import('../signal/signal');

describe('computed', () => {
  it('keeps the underlying Signal.Computed under NODE', () => {
    const value = computed(() => 7) as unknown as Record<typeof NODE, Signal.Computed<number>>;
    expect(value[NODE]).toBeInstanceOf(Signal.Computed);
    expect(value[NODE].get()).toBe(7);
  });

  it('is a function inheriting get() from a prototype shared by every computed signal', () => {
    const first = computed(() => 1);
    const second = computed(() => 2);
    expect(first).toBeInstanceOf(Function);
    expect(Object.getPrototypeOf(first)).toBe(Object.getPrototypeOf(second));
    expect(Object.hasOwn(first, 'get')).toBe(false);
    expect(first.get).toBe(second.get);
    expect([first.get(), second.get()]).toEqual([1, 2]);
  });

  it('returns the computed value when called', () => {
    expect(computed(() => 5)()).toBe(5);
  });

  it('exposes get()', () => {
    expect(computed(() => 'x').get()).toBe('x');
  });

  it('invokes the function with the underlying Signal.Computed as this', () => {
    const value = computed(function () { return this instanceof Signal.Computed; });
    expect(value()).toBe(true);
  });

  it('recomputes when a signal it reads changes', () => {
    const source = signal(1);
    const double = computed(() => source() * 2);
    expect(double()).toBe(2);

    source.set(3);
    expect(double()).toBe(6);
  });

  it('forwards the options to the underlying signal', () => {
    const source = signal(1);
    const value = computed(() => source(), { equals: (previous, next) => previous % 2 === next % 2 });
    expect(value()).toBe(1);

    source.set(3);
    expect(value()).toBe(1);

    source.set(4);
    expect(value()).toBe(4);
  });
});
