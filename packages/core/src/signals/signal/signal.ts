import type { SignalOptions } from '@xaendar/signals';
import type { Signal as SignalType } from '../types/signal.type';
import { untracked } from '../untracked';

/**
 * Creates a writable reactive signal.
 *
 * Returns a callable getter that reads the current value, augmented with the
 * underlying {@link Signal.State} API and an `update` method to derive the next
 * value from the previous one.
 *
 * @template T - The type of the stored value. Defaults to `any`.
 * @param value - The initial value of the signal.
 * @param options - Configuration options for the signal.
 * @returns A {@link SignalType} instance.
 */
export function signal<T = unknown>(value: T, options?: SignalOptions<T>): SignalType<T> {
  const signal = new Signal.State(value, options);
  const getter = function () { return signal.get(); }

  return Object.assign(getter, {
    set: signal.set.bind(signal),
    get: signal.get.bind(signal),
    update: (updater: (prev: T) => T) => signal.set(updater(untracked(() => signal.get())))
  });
}