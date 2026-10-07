// @xaendar/core/signals
type Signal<T> = Signal.State<T> & {
  (): T;
  update(updater: (prev: T) => T): void;
};

type Computed<T> = Signal.Computed<T> & {
  (): T;
};

// @xaendar/signals
type SignalOptions<T> = {
  equals?: (this: Signal.State<T> | Signal.Computed<T>, a: T, b: T) => boolean;
  watched?: (this: Signal.State<T> | Signal.Computed<T>) => void;
  unwatched?: (this: Signal.State<T> | Signal.Computed<T>) => void;
};
