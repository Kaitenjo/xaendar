/**
 * A read-only reactive value derived from other signals.
 *
 * Wraps {@link Signal.Computed} and is also callable as a function to read the
 * current computed value.
 *
 * @template Value - The type of the computed value. Defaults to `unknown`.
 */
export type Computed<Value = unknown> = Signal.Computed<Value> & {
  /**
   * Reads the current computed value, recomputing it if any dependency changed.
   *
   * @returns The current value of type `Value`.
   */
  (): ReturnType<Signal.Computed<Value>['get']>;
}