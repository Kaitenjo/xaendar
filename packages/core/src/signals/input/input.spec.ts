import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { input } = await import('./input');
const { isInputSignal } = await import('./input-instance.symbol');
const { INPUT_SIGNAL_SET_SYMBOL } = await import('./input-set.symbol');

describe('input', () => {
  it('returns the initial value when called', () => {
    expect(input(3)()).toBe(3);
  });

  it('is undefined without an initial value', () => {
    expect(input()()).toBeUndefined();
  });

  it('is recognised by isInputSignal', () => {
    expect(isInputSignal(input(1))).toBe(true);
  });

  it('exposes get()', () => {
    expect(input('a').get()).toBe('a');
  });

  it('sets a new value with the internal symbol', () => {
    const state = input(1) as unknown as { set(v: number, s: symbol): void, (): number };
    state.set(2, INPUT_SIGNAL_SET_SYMBOL);
    expect(state()).toBe(2);
  });

  it('rejects set() with a wrong symbol', () => {
    const state = input(1) as unknown as { set(v: number, s: symbol): void };
    expect(() => state.set(2, Symbol('wrong'))).toThrow('Invalid symbol for InputSignal set method');
  });

  it('applies the transform to incoming values', () => {
    const state = input<number, string>(0, { transform: value => Number(value) }) as unknown as { set(v: string, s: symbol): void, (): number };
    state.set('42', INPUT_SIGNAL_SET_SYMBOL);
    expect(state()).toBe(42);
  });

  it('does not forward the transform to the underlying state', () => {
    const options = { transform: (value: string) => Number(value) };
    input<number, string>(0, options);
    expect('transform' in options).toBe(false);
  });
});
