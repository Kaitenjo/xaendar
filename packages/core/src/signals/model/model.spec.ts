import { describe, expect, it, vi } from 'vitest';
import type { ModelChange } from '../../types/model/model-change.type';
import type { EventHost } from '../../types/event/event-host.type';
import { NODE } from '../node/node.symbol';
import { INITIAL_VALUE, isInputSignal } from '../input/input-instance.symbol';
import { MODEL_CHANGE, MODEL_HOST, isModelSignal } from './model-instance.symbol';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { createModelPrototype, model } = await import('./model');
const { input } = await import('../input/input');
const { INPUT_SIGNAL_SET_SYMBOL } = await import('../input/input-set.symbol');
const { computed } = await import('../computed/computed');
const { effect } = await import('../effect/effect');

/**
 * A host recording the events dispatched on it.
 */
function createHost(): EventHost & { events: CustomEvent[] } {
  const events = new Array<CustomEvent>();
  return { events, dispatchEvent: (event: CustomEvent) => events.push(event) > 0 } as unknown as EventHost & { events: CustomEvent[] };
}

/**
 * Creates the prototype of the models of an accessor named `value`.
 */
function createPrototype(initialValue: unknown, change: Partial<ModelChange> = {}): object {
  return createModelPrototype(initialValue, Object.assign({ name: 'valueChange', event: undefined, equals: Object.is }, change));
}

describe('model', () => {
  it('keeps the state and the host on the getter, the initial value and the change on the prototype of the accessor', () => {
    const host = createHost();
    const prototype = createPrototype(5);
    const value = model<number>(prototype, host, undefined) as unknown as Record<symbol, unknown>;

    expect(value[NODE]).toBeInstanceOf(Signal.State);
    expect(value[MODEL_HOST]).toBe(host);
    expect(Object.getOwnPropertySymbols(value)).toEqual([NODE, MODEL_HOST]);
    expect(Object.getPrototypeOf(value)).toBe(prototype);
    expect(value[INITIAL_VALUE]).toBe(5);
    expect((value[MODEL_CHANGE] as ModelChange).name).toBe('valueChange');
  });

  it('shares its methods with every model, the ones of the accessor sharing their prototype', () => {
    const prototype = createPrototype(0);
    const first = model<number>(prototype, createHost(), undefined);
    const second = model<number>(prototype, createHost(), undefined);
    const other = model<number>(createPrototype(1), createHost(), undefined);

    expect(Object.getPrototypeOf(first)).toBe(Object.getPrototypeOf(second));
    expect(first.set).toBe(other.set);
    expect(first.update).toBe(other.update);
    expect([first(), second(), other()]).toEqual([0, 0, 1]);
  });

  it('is a function recognised as a model and as an input, an input not being a model', () => {
    const value = model<number>(createPrototype(1), createHost(), undefined);

    expect(value).toBeInstanceOf(Function);
    expect(isModelSignal(value)).toBe(true);
    expect(isInputSignal(value)).toBe(true);
    expect(isModelSignal(input(1))).toBe(false);
    expect(isModelSignal({})).toBe(false);
  });

  it('reads its value by call and by get()', () => {
    const value = model<string>(createPrototype('a'), createHost(), undefined);

    expect(value()).toBe('a');
    expect(value.get()).toBe('a');
  });

  it('is set quietly by the framework, with the internal set symbol', () => {
    const host = createHost();
    const value = model<number>(createPrototype(0), host, undefined) as unknown as { set(value: number, symbol: symbol): void, (): number };
    value.set(3, INPUT_SIGNAL_SET_SYMBOL);

    expect(value()).toBe(3);
    expect(host.events).toEqual([]);
  });

  it('dispatches the event of change on its host when its class sets a different value', () => {
    const host = createHost();
    const value = model<number>(createPrototype(0), host, undefined);
    value.set(1);
    value.set(1);

    expect(value()).toBe(1);
    expect(host.events.map(event => [event.type, event.detail, event.bubbles, event.composed])).toEqual([['valueChange', 1, false, false]]);
  });

  it('dispatches the event of change with the options of the accessor', () => {
    const host = createHost();
    const value = model<number>(createPrototype(0, { event: { bubbles: true, cancelable: true, composed: true } }), host, undefined);
    value.set(1);

    expect([host.events[0].bubbles, host.events[0].cancelable, host.events[0].composed]).toEqual([true, true, true]);
  });

  it('updates its value from the current one, dispatching the event of change', () => {
    const host = createHost();
    const value = model<number>(createPrototype(1), host, undefined);
    value.update(previous => previous + 1);

    expect(value()).toBe(2);
    expect(host.events.map(event => event.detail)).toEqual([2]);
  });

  it('compares the values with the equality of the accessor, called on the state', () => {
    const host = createHost();
    const equals = vi.fn(function (this: unknown, previous: { id: number }, next: { id: number }) {
      return previous.id === next.id;
    });
    const value = model<{ id: number }>(createPrototype({ id: 1 }, { equals }), host, { equals });
    value.set({ id: 1 });
    value.set({ id: 2 });

    expect(equals.mock.contexts[0]).toBe((value as unknown as Record<symbol, unknown>)[NODE]);
    expect(host.events.map(event => event.detail)).toEqual([{ id: 2 }]);
  });

  it('reads the current value untracked when written inside a reactive context', () => {
    const value = model<number>(createPrototype(0), createHost(), undefined);
    const other = model<number>(createPrototype(0), createHost(), undefined);
    const runs = vi.fn();
    const dispose = effect(() => {
      runs();
      other.set(value.get() + 1);
      other.update(previous => previous);
    });

    expect(runs).toHaveBeenCalledTimes(1);
    expect(computed(() => other())()).toBe(1);
    dispose();
  });

  it('goes back to the initial value of the accessor on reset', () => {
    const value = model<number>(createPrototype(4), createHost(), undefined) as unknown as { set(value: number, symbol?: symbol): void, reset(symbol: symbol): void, (): number };
    value.set(9);
    value.reset(INPUT_SIGNAL_SET_SYMBOL);

    expect(value()).toBe(4);
  });
});
