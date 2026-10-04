import { SignalOptions } from '@xaendar/signals';
import { Computed } from '../types/computed.type';

/**
 * Creates a read-only computed signal whose value is derived from other signals.
 *
 * The value is computed lazily on the first read and cached: it is computed again
 * only when read after a signal it depends on has changed.
 *
 * Returns a callable getter that reads the current value, augmented with the
 * `get` method of the underlying {@link Signal.Computed}.
 *
 * @template Value - The type of the computed value. Defaults to `unknown`.
 * @param value - The function deriving the value from other signals. It is invoked with the
 *   underlying {@link Signal.Computed} as `this`, not with the returned getter.
 * @param options - Configuration options for the underlying signal.
 * @returns A {@link Computed} instance.
 */
export function computed<Value = unknown>(value: (this: Signal.Computed<Value>) => Value, options?: SignalOptions<Value>): Computed<Value> {
  const signal = new Signal.Computed(value, options);
  const getter = function () { return signal.get(); }
  
  return Object.assign(getter, {
    get: signal.get.bind(signal) 
  });
}