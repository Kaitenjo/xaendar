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
 */
export type InputSignal<ActualValue = unknown> = Pick<Signal.State<ActualValue>, 'get'> & {
  /**
   * Reads the current value of the input signal.
   *
   * @returns The current value of type `ActualValue`.
   */
  (): ActualValue;
};