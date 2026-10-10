import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { computed } = await import('../computed/computed');
const { input } = await import('../input/input');
const { signal } = await import('../signal/signal');
const { getPending, hasSinks, hasSources, introspectSinks, introspectSources, isComputed, isState, unwatch, watch } = await import('./subtle');

/**
 * A graph whose signals are the functions returned by `signal()`, `input()` and `computed()`: price → total ← quantity.
 */
function graph() {
  const price = signal(10);
  const quantity = input(2);
  const total = computed(() => price() * quantity());
  const watcher = new Signal.subtle.Watcher(() => undefined);
  return { price, quantity, total, watcher };
}

describe('isState', () => {
  it.each([
    ['signal()', () => signal(1), true],
    ['input()', () => input(1), true],
    ['a Signal.State', () => new Signal.State(1), true],
    ['computed()', () => computed(() => 1), false],
    ['a plain function', () => () => 1, false],
    ['null', () => null, false]
  ])('tells whether %s is a writable signal', (_name, create, expected) => {
    expect(isState(create())).toBe(expected);
  });
});

describe('isComputed', () => {
  it.each([
    ['computed()', () => computed(() => 1), true],
    ['a Signal.Computed', () => new Signal.Computed(() => 1), true],
    ['signal()', () => signal(1), false],
    ['a plain object', () => ({}), false]
  ])('tells whether %s is a computed signal', (_name, create, expected) => {
    expect(isComputed(create())).toBe(expected);
  });
});

describe('introspection', () => {
  it('accepts the functions returned by the factories, and returns them in place of the nodes they wrap', () => {
    const { price, quantity, total, watcher } = graph();
    watch(watcher, total);
    total();

    expect(introspectSources(total)).toEqual([price, quantity]);
    expect(introspectSinks(price)).toEqual([total]);
    expect(introspectSinks(total)).toEqual([watcher]);
    expect(introspectSources(watcher)).toEqual([total]);
    expect([hasSources(total), hasSinks(price), hasSinks(quantity), hasSources(watcher)]).toEqual([true, true, true, true]);

    unwatch(watcher, total);
    expect([hasSinks(price), hasSinks(total), hasSources(watcher)]).toEqual([false, false, false]);
  });

  it('returns the nodes no function wraps as they are', () => {
    const price = signal(10);
    const total = new Signal.Computed(() => price() * 2);
    const watcher = new Signal.subtle.Watcher(() => undefined);
    watcher.watch(total);
    total.get();

    expect(introspectSinks(price)).toEqual([total]);
    expect(introspectSources(total)).toEqual([price]);
    watcher.unwatch(total);
  });
});

describe('watch, unwatch and getPending', () => {
  it('watch the functions returned by the factories, and return them in place of the nodes they wrap', () => {
    const { price, total } = graph();
    const notify = vi.fn();
    const watcher = new Signal.subtle.Watcher(notify);
    watch(watcher, total, price);
    total();

    price.set(20);

    expect(notify).toHaveBeenCalled();
    expect(getPending(watcher)).toEqual([total]);
    unwatch(watcher, total, price);
    expect(introspectSources(watcher)).toEqual([]);
  });
});
