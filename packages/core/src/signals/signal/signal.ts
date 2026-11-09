import type { SignalOptions } from '@xaendar/signals';
import type { Signal as SignalType } from '../types/signal.type';
import { NODE } from '../node/node.symbol';
import { untracked } from '../untracked';

/**
 * The prototype shared by every getter returned by {@link signal}: it extends `Function.prototype`, so that the getter
 * stays a function, and holds the `set`, `get` and `update` methods, created once instead of once per signal.
 */
const SIGNAL_PROTOTYPE = Object.create(Function.prototype, {
  set: {
    /**
     * Sets the value of the underlying {@link Signal.State}.
     *
     * @param value - The new value.
     */
    value(value: unknown): void {
      this[NODE].set(value);
    }
  },
  get: {
    /**
     * Reads the value of the underlying {@link Signal.State}.
     *
     * @returns The current value.
     */
    value(): unknown {
      return this[NODE].get();
    }
  },
  update: {
    /**
     * Sets the value of the underlying {@link Signal.State} to the one derived from the previous value, read untracked.
     *
     * @param updater - Function receiving the previous value and returning the next one.
     */
    value(updater: (previous: unknown) => unknown): void {
      const node = this[NODE];
      node.set(updater(untracked(() => node.get())));
    }
  }
});

/**
 * Creates a writable reactive signal.
 *
 * Returns a callable getter that reads the current value, whose prototype holds the `get` and `set`
 * of the underlying {@link Signal.State} and an `update` method to derive the next value from the previous one.
 *
 * @template T - The type of the stored value. Defaults to `unknown`.
 * @param value - The initial value of the signal.
 * @param options - Configuration options for the signal.
 * @returns A {@link SignalType} instance.
 */
export function signal<T = unknown>(value: T, options?: SignalOptions<T>): SignalType<T> {
  const signal = new Signal.State(value, options);
  const getter = () => signal.get();
  getter[NODE] = signal;
  return Object.setPrototypeOf(getter, SIGNAL_PROTOTYPE);
}
