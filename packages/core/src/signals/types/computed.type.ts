/**
 * A read-only reactive value derived from other signals.
 *
 * Has the `get` of {@link Signal.Computed}, and is also callable as a function to read the
 * current computed value. It is a function, not a `Signal.Computed`: the `Signal.subtle` API does not accept it.
 *
 * @template Value - The type of the computed value. Defaults to `unknown`.
 */
export type Computed<Value = unknown> = Pick<Signal.Computed<Value>, 'get'> & {
  /**
   * Reads the current computed value, recomputing it if any dependency changed.
   *
   * @returns The current value of type `Value`.
   */
  (): ReturnType<Signal.Computed<Value>['get']>;
}