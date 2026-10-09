// @xaendar/core/signals
/**
 * The type returned by signal().
 */
type Signal<T> = Signal.State<T> & {
  /**
   * Reads the value.
   */
  (): T;
  /**
   * Computes the new value from the previous one.
   *
   * @param updater - Receives the previous value and returns the new one.
   */
  update(updater: (prev: T) => T): void;
};

/**
 * The type returned by computed().
 */
type Computed<T> = Signal.Computed<T> & {
  /**
   * Reads the value.
   */
  (): T;
};

// @xaendar/signals
/**
 * The options of signal() and of Signal.State.
 */
type SignalOptions<T> = {
  /**
   * Decides whether a new value is equal to the current one, and so notifies nobody.
   */
  equals?: (this: Signal.State<T> | Signal.Computed<T>, a: T, b: T) => boolean;
  /**
   * Called when the signal gets its first reader.
   */
  watched?: (this: Signal.State<T> | Signal.Computed<T>) => void;
  /**
   * Called when the signal loses its last reader.
   */
  unwatched?: (this: Signal.State<T> | Signal.Computed<T>) => void;
};
