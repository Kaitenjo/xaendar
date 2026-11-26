/**
 * A reactive value that can only be read: a {@link Signal} seen without its `set` and `update`, as `asReadonly()` of a
 * signal gives it.
 *
 * Has the `get` of {@link Signal.State}, and is also callable as a function to read the current value. It is the same
 * object as the signal it comes from, only typed apart: the protection is the one of the type-check, and a cast gets
 * round it.
 *
 * @template Value - The type of the stored value. Defaults to `unknown`.
 */
export type ReadonlySignal<Value = unknown> = Pick<Signal.State<Value>, 'get'> & {
  /**
   * Get the current value of the signal.
   *
   * @returns The current value of the signal.
   */
  (): Value;
}
