import { computing, frozen } from '../../globals/global-internal-slots';
import { signalGlobalThis } from '../../globals/polyfill';
import { SignalOptions } from '../signal-options.type';
import { Signal } from '../signal.interface';
import { value, equals, watched, unwatched, sinks } from './state-internal-slots';

export class State<T> implements Signal<T> {
  /**
   * The current value of the signal. This is an internal slot and should not be accessed directly.
   */
  [value]: T;
  /**
   * The equality function used to compare the old and new value when setting a new value. This is an internal slot and should not be accessed directly.
   */
  [equals]: (this: Signal<T>, t: T, t2: T) => boolean
  /**
   * Callback called when isWatched becomes true, if it was previously false. This is an internal slot and should not be accessed directly.
   */
  [watched]?: () => void;
  /**
   * Callback called whenever isWatched becomes false, if it was previously true. This is an internal slot and should not be accessed directly.
   */
  [unwatched]?: () => void;
  /**
   * The set of signals that depend on this signal. This is an internal slot and should not be accessed directly.
   */
  [sinks]: Set<Signal<unknown>>;

  /**
   * Creates a new state signal with the given initial value and options.
   * @param initialValue The initial value of the signal.
   * @param options The options for the signal, including the equality function and watched/unwatched callbacks.
   */
  constructor(initialValue: T, options?: SignalOptions<T>) {
    this[value] = initialValue;
    this[equals] = options?.equals ?? Object.is;
    this[watched] = options?.watched;
    this[unwatched] = options?.unwatched;
    this[sinks] = new Set;
  }

  /**
   * Gets the current value of the signal. 
   * This method should be used to access the value of the signal instead of directly accessing the internal slot.
   */
  public get(): T {
    if (signalGlobalThis[frozen]) {
      throw new Error("Cannot get value while signals are frozen");
    }

    if (signalGlobalThis[computing]) {
      signalGlobalThis[computing][sinks].add(this);
    }

    return this[value];
  }

  /**
   * Sets a new value for the signal. If the new value is different from the current value according to the equality function, 
   * the signal will be updated and any dependent signals will be notified. 
   * This method should be used to update the value of the signal instead of directly modifying the internal slot.
   * @param newValue The new value to set for the signal.
   */
  public set(newValue: T): void {
     if (signalGlobalThis[frozen]) {
      throw new Error("Cannot set value while signals are frozen");
    }

    if (!this[equals].call(this, this[value], newValue)) {
      this[value] = newValue;
    }
  }
}