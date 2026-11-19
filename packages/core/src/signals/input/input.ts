import { NODE } from '../node/node.symbol';
import { InputSignalOptions } from '../types/input-signal.options.type';
import { InputSignal } from '../types/input-signal.type';
import { INITIAL_VALUE, INPUT_SIGNAL_INSTANCE_SYMBOL, TRANSFORM } from './input-instance.symbol';
import { assertPrivateContext } from './input-set.symbol';

/**
 * The prototype shared by every getter returned by {@link input}: it extends `Function.prototype`, so that the getter
 * stays a function, and holds the `set`, `reset` and `get` methods and the {@link INPUT_SIGNAL_INSTANCE_SYMBOL} mark,
 * created once instead of once per input. The `transform` and the initial value of each input are kept on its getter.
 * The prototype of the models extends it (see `model`).
 */
export const INPUT_PROTOTYPE = Object.create(Function.prototype, {
  set: {
    /**
     * Sets the value of the underlying {@link Signal.State}, converted by the `transform` of the input if it has one.
     *
     * @param newValue - The value coming from outside, before the `transform`.
     * @param symbol - The internal {@link INPUT_SIGNAL_SET_SYMBOL}, proving the caller is the framework.
     * @throws {Error} If `symbol` is not {@link INPUT_SIGNAL_SET_SYMBOL}.
     */
    value(newValue: unknown, symbol: symbol): void {
      assertPrivateContext(symbol);
      const transform = this[TRANSFORM];
      this[NODE].set(transform ? transform(newValue) : newValue);
    }
  },
  reset: {
    /**
     * Sets the underlying {@link Signal.State} back to the initial value of the input, without applying the `transform`.
     *
     * @param symbol - The internal {@link INPUT_SIGNAL_SET_SYMBOL}, proving the caller is the framework.
     * @throws {Error} If `symbol` is not {@link INPUT_SIGNAL_SET_SYMBOL}.
     */
    value(symbol: symbol): void {
      assertPrivateContext(symbol);
      this[NODE].set(this[INITIAL_VALUE]);
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
  [INPUT_SIGNAL_INSTANCE_SYMBOL]: { value: true }
});

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
export function input<ActualValue = unknown, IncomingValue = ActualValue>(value?: ActualValue, options?: InputSignalOptions<ActualValue, IncomingValue>): InputSignal<ActualValue, IncomingValue> {
  const { transform, ...signalOptions } = options ?? {};
  const signal = new Signal.State<ActualValue>(value as ActualValue, signalOptions);
  const getter = () => signal.get();
  Object.assign(getter, {
    [NODE]: signal,
    [TRANSFORM]: transform,
    [INITIAL_VALUE]: value
  });
  return Object.setPrototypeOf(getter, INPUT_PROTOTYPE);
}