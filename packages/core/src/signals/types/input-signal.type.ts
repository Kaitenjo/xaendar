import { INPUT_SIGNAL_INSTANCE_SYMBOL } from '../input/input-instance.symbol';

/**
 * The key of the type of the values an input accepts from outside, before its `transform`: it exists only in the types.
 */
declare const INCOMING_VALUE: unique symbol;

/**
 * A reactive value sourced from outside the component (e.g. an attribute).
 *
 * Has the `get` of {@link Signal.State}, without its `set` method (inputs are not set
 * directly), and is callable as a function to read the current value. It is a function, not a `Signal.State`:
 * the `Signal.subtle` API does not accept it. An
 * optional {@link InputSignalOptions.transform} can convert the incoming value
 * into the actual stored value.
 *
 * @template ActualValue - The internal type stored by the signal. Defaults to `unknown`.
 * @template IncomingValue - The type of the values the input accepts from outside, from the bindings of the templates,
 *   `createComponent`, `renderToString` and the assignments to the property of the element, before its `transform`.
 *   Defaults to `ActualValue`: an input with a `transform` taking another type declares it (`InputSignal<number, string>`).
 */
export type InputSignal<ActualValue = unknown, IncomingValue = ActualValue> = Pick<Signal.State<ActualValue>, 'get'> & {
  /**
   * Marks the signal as an input, telling it apart from a computed or a query signal, which have the same shape.
   */
  readonly [INPUT_SIGNAL_INSTANCE_SYMBOL]: true;
  /**
   * Returns the type of the values the input accepts from outside, before its `transform`. Never set: it exists only in
   *   the types, so that `createComponent` and `renderToString` take the values the `transform` takes.
   */
  readonly [INCOMING_VALUE]?: () => IncomingValue;
  /**
   * Reads the current value of the input signal.
   *
   * @returns The current value of type `ActualValue`.
   */
  (): ActualValue;
};