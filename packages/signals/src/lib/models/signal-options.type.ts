import { SignalEqual } from './signal-equal.type';
import { Signal } from './signal.interface';

export type SignalOptions<T> = {
  /**
   * Custom comparison function between old and new value. Default: Object.is.
   * The signal is passed in as the this value for context.
   */
  equals?: SignalEqual<T>;
  /**
   * Callback called when isWatched becomes true, if it was previously false
   */
  watched?: (this: Signal<T>) => void;
  /**
   * Callback called whenever isWatched becomes false, if it was previously true
   */
  unwatched?: (this: Signal<T>) => void;
}