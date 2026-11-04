import { InputSignalOptions } from '../types/input-signal.options.type';
import { InputSignal } from '../types/input-signal.type';
import { INPUT_SIGNAL_INSTANCE_SYMBOL } from './input-instance.symbol';
import { assertPrivateContext } from './input-set.symbol';

/**
 * Creates an `InputSignal` — a specialized reactive state designed for use
 * as a property signal in web components.
 *
 * Unlike a plain `Signal.State`, the `set` method of an `InputSignal` is
 * restricted to internal callers (identified by the private symbol) and
 * accepts an optional `transform` function that converts incoming values
 * (e.g. raw HTML attribute strings) into the internally stored type before
 * updating the signal. The internal `reset` method sets it back to its initial
 * value, without applying the `transform`.
 *
 * @param value - The initial value of the signal.
 * @param options - Optional configuration including an equality function,
 *   lifecycle hooks, and a `transform` function applied to incoming values.
 * @returns A new `InputSignal` instance.
 */
export function input<ActualValue = unknown, IncomingValue = ActualValue>(value?: ActualValue, options?: InputSignalOptions<ActualValue, IncomingValue>): InputSignal<ActualValue> {
  // The transform is kept apart from the options of the signal, leaving the object of the caller untouched
  const { transform, ...signalOptions } = options ?? {};

  const signal = new Signal.State<ActualValue>(value as ActualValue, signalOptions);
  const originalSet = signal.set;

  const getter = function () { return signal.get(); }

  // The brand of the InputSignal type exists only in the types, so the signal is cast to it
  return Object.assign(getter, {
    set(newValue: IncomingValue, symbol: symbol): void {
      assertPrivateContext(symbol);
      const transformedValue = transform ? transform(newValue) : newValue;
      originalSet.call(signal, transformedValue as ActualValue);
    },
    reset(symbol: symbol): void {
      assertPrivateContext(symbol);
      originalSet.call(signal, value as ActualValue);
    },
    get: signal.get.bind(signal),
    [INPUT_SIGNAL_INSTANCE_SYMBOL]: true as const
  });
}