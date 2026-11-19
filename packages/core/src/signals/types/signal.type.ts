/**
 * A writable reactive value.
 *
 * Has the `get` and `set` of {@link Signal.State}, and is also callable as a function to read the
 * current value. It is a function, not a `Signal.State`: the `Signal.subtle` API does not accept it.
 *
 * @template Value - The type of the stored value. Defaults to `unknown`.
 */
export type Signal<Value = unknown> = Pick<Signal.State<Value>, 'get' | 'set'> & {
  /**
   * Get the current value of the signal.
   *
   * @returns The current value of the signal.
   */
  (): Value;
  /**
   * Updates the signal value based on its previous value.
   *
   * @param updater - Function receiving the previous value and returning the next one.
   */
  update(updater: (prev: Value) => Value): void;
} 