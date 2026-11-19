import { describe, expect, it, vi } from 'vitest';
import { NODE } from '../node/node.symbol';
import { INITIAL_VALUE, INPUT_SIGNAL_INSTANCE_SYMBOL, isInputSignal, TRANSFORM } from './input-instance.symbol';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { input } = await import('./input');
const { INPUT_SIGNAL_SET_SYMBOL } = await import('./input-set.symbol');

describe('input', () => {
  it('keeps the underlying Signal.State, the transform and the initial value on the getter', () => {
    const transform = (value: string): number => Number(value);
    const state = input<number, string>(5, { transform });
    expect((state as unknown as Record<typeof NODE, Signal.State<number>>)[NODE]).toBeInstanceOf(Signal.State);
    expect(state[TRANSFORM]).toBe(transform);
    expect(state[INITIAL_VALUE]).toBe(5);
  });

  it('keeps no transform without options', () => {
    const state = input(1);
    expect(TRANSFORM in state).toBe(true);
    expect(state[TRANSFORM]).toBeUndefined();
  });

  it('is a function inheriting its methods and its mark from a prototype shared by every input', () => {
    const first = input(1) as unknown as { set(v: number, s: symbol): void, (): number };
    const second = input(2) as unknown as { set(v: number, s: symbol): void, (): number };
    expect(first).toBeInstanceOf(Function);
    expect(Object.getPrototypeOf(first)).toBe(Object.getPrototypeOf(second));
    expect(Object.hasOwn(first, 'get') || Object.hasOwn(first, 'set') || Object.hasOwn(first, 'reset')).toBe(false);
    expect(Object.hasOwn(first, INPUT_SIGNAL_INSTANCE_SYMBOL)).toBe(false);
    expect(first.set).toBe(second.set);

    first.set(10, INPUT_SIGNAL_SET_SYMBOL);
    expect([first(), second()]).toEqual([10, 2]);
  });

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

  it('resets to the initial value with the internal symbol, without applying the transform', () => {
    const state = input<string, string>('initial', { transform: value => value.toUpperCase() }) as unknown as { set(v: string, s: symbol): void, reset(s: symbol): void, (): string };
    state.set('updated', INPUT_SIGNAL_SET_SYMBOL);
    state.reset(INPUT_SIGNAL_SET_SYMBOL);
    expect(state()).toBe('initial');
  });

  it('rejects reset() with a wrong symbol', () => {
    const state = input(1) as unknown as { reset(s: symbol): void };
    expect(() => state.reset(Symbol('wrong'))).toThrow('Invalid symbol for InputSignal set method');
  });

  it('leaves the options untouched, so that they can be reused for another input', () => {
    const options = { transform: (value: string) => Number(value) };
    const first = input<number, string>(0, options) as unknown as { set(v: string, s: symbol): void, (): number };
    const second = input<number, string>(0, options) as unknown as { set(v: string, s: symbol): void, (): number };
    first.set('1', INPUT_SIGNAL_SET_SYMBOL);
    second.set('2', INPUT_SIGNAL_SET_SYMBOL);

    expect('transform' in options).toBe(true);
    expect([first(), second()]).toEqual([1, 2]);
  });

  it('forwards the other options to the underlying state', () => {
    const state = input<{ id: number }>({ id: 1 }, { equals: (a, b) => a.id === b.id }) as unknown as { set(v: { id: number }, s: symbol): void, (): { id: number } };
    const initial = state();
    state.set({ id: 1 }, INPUT_SIGNAL_SET_SYMBOL);

    expect(state()).toBe(initial);
  });
});
