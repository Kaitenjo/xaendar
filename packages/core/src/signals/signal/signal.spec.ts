import { describe, expect, it, vi } from 'vitest';
import { NODE } from '../node/node.symbol';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { signal } = await import('./signal');

describe('signal', () => {
  it('keeps the underlying Signal.State under NODE', () => {
    const state = signal(1) as unknown as Record<typeof NODE, Signal.State<number>>;
    expect(state[NODE]).toBeInstanceOf(Signal.State);
    expect(state[NODE].get()).toBe(1);
  });

  it('is a function inheriting its methods from a prototype shared by every signal', () => {
    const first = signal(1);
    const second = signal(2);
    expect(first).toBeInstanceOf(Function);
    expect(Object.getPrototypeOf(first)).toBe(Object.getPrototypeOf(second));
    expect(Object.hasOwn(first, 'get') || Object.hasOwn(first, 'set') || Object.hasOwn(first, 'update')).toBe(false);
    expect(first.set).toBe(second.set);
  });

  it('keeps the value of each signal apart', () => {
    const first = signal(1);
    const second = signal(2);
    first.set(10);
    second.update(prev => prev + 1);
    expect([first(), second()]).toEqual([10, 3]);
  });

  it('returns the initial value when called', () => {
    expect(signal(1)()).toBe(1);
  });

  it('exposes get()', () => {
    expect(signal('a').get()).toBe('a');
  });

  it('updates the value with set()', () => {
    const state = signal(1);
    state.set(2);
    expect(state()).toBe(2);
  });

  it('derives the next value from the previous one with update()', () => {
    const state = signal(1);
    state.update(prev => prev + 10);
    expect(state.get()).toBe(11);
  });

  it('forwards the options to the underlying state', () => {
    const equals = vi.fn(() => true);
    const state = signal(1, { equals });
    state.set(2);
    expect(equals).toHaveBeenCalled();
    expect(state()).toBe(1);
  });
});
