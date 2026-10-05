/**
 * A read-only reactive value holding the result of a query on the Shadow DOM of a component.
 *
 * Wraps {@link Signal.State} without its `set` method (the value is updated internally
 * when the Shadow DOM changes) and is callable as a function to read the current value.
 *
 * @template Value - The type of the queried value (e.g. `HTMLElement | null` or `HTMLElement[]`). Defaults to `unknown`.
 */
export type QuerySignal<Value = unknown> = Omit<Signal.State<Value>, 'set'> & {
  /**
   * Reads the current result of the query.
   *
   * @returns The current value of type `Value`.
   */
  (): Value;
};
