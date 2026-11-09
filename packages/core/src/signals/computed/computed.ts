import { SignalOptions } from '@xaendar/signals';
import { Computed } from '../types/computed.type';
import { NODE } from '../node/node.symbol';

/**
 * The prototype shared by every getter returned by {@link computed}: it extends `Function.prototype`, so that the
 * getter stays a function, and holds the `get` method, created once instead of once per computed signal.
 */
const COMPUTED_PROTOTYPE = Object.create(Function.prototype, {
  get: {
    /**
     * Reads the value of the underlying {@link Signal.Computed}, recomputing it if any dependency changed.
     *
     * @returns The current value.
     */
    value(): unknown {
      return this[NODE].get();
    }
  }
});

/**
 * Creates a read-only computed signal whose value is derived from other signals.
 *
 * The value is computed lazily on the first read and cached: it is computed again
 * only when read after a signal it depends on has changed.
 *
 * Returns a callable getter that reads the current value, whose prototype holds the
 * `get` method of the underlying {@link Signal.Computed}.
 *
 * @template Value - The type of the computed value. Defaults to `unknown`.
 * @param value - The function deriving the value from other signals. It is invoked with the
 *   underlying {@link Signal.Computed} as `this`, not with the returned getter.
 * @param options - Configuration options for the underlying signal: only `equals`.
 * @returns A {@link Computed} instance.
 */
export function computed<Value = unknown>(value: (this: Signal.Computed<Value>) => Value, options?: Pick<SignalOptions<Value>, 'equals'>): Computed<Value> {
  const signal = new Signal.Computed(value, options);
  const getter = () => signal.get();
  getter[NODE] = signal;
  return Object.setPrototypeOf(getter, COMPUTED_PROTOTYPE);
}