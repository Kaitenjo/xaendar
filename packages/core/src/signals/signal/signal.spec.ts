import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { signal } = await import('./signal');

describe('signal', () => {
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
