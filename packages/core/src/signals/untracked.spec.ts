import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { untracked } = await import('./untracked');
const { effect } = await import('./effect/effect');

describe('untracked', () => {
  it('returns the result of the function', () => {
    expect(untracked(() => 42)).toBe(42);
  });

  it('does not track the signals read inside the function', async () => {
    const state = new Signal.State(0);
    const spy = vi.fn();

    effect(() => spy(untracked(() => state.get())));
    state.set(1);
    await new Promise<void>(resolve => queueMicrotask(resolve));

    expect(spy).toHaveBeenCalledOnce();
  });
});
