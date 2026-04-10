import { Computed } from './computed';
import { getComputing, getFrozen } from './globals';
import { SignalOptions } from './models/signal-options.type';
import { Signal } from './models/signal.interface';
import { Watcher } from './watcher';

export class State<T> implements Signal<T> {
  /**
   * The current value of the signal. 
   * @internalSlot
   */
  #value: T;
  /**
   * The equality function used to compare the old and new value when setting a new value. 
   * @internalSlot
   */
  #equals: (this: Signal<T>, t: T, t2: T) => boolean
  /**
   * Callback called when isWatched becomes true, if it was previously false. 
   * @internalSlot
   */
  #watched?: () => void;
  /**
   * Callback called whenever isWatched becomes false, if it was previously true. 
   * @internalSlot
   */
  #unwatched?: () => void;
  /**
   * The set of signals that depend on this signal. 
   * @internalSlot
   */
  #sinks: Set<Computed<unknown> | Watcher>;

  /**
   * Creates a new state signal with the given initial value and options.
   * @param initialValue The initial value of the signal.
   * @param options The options for the signal, including the equality function and watched/unwatched callbacks.
   */
  constructor(initialValue: T, options?: SignalOptions<T>) {
    this.#value = initialValue;
    this.#equals = options?.equals ?? Object.is;
    this.#watched = options?.watched;
    this.#unwatched = options?.unwatched;
    this.#sinks = new Set;
  }

  /**
   * Gets the current value of the signal. 
   * This method should be used to access the value of the signal instead of directly accessing the internal slot.
   */
  public get(): T {
    if (getFrozen()) {
      throw new Error("Cannot get value while signals are frozen");
    }

    getComputing()?.addSource(this);

    return this.#value;
  }

  /**
   * Sets a new value for the signal. If the new value is different from the current value according to the equality function, 
   * the signal will be updated and any dependent signals will be notified. 
   * This method should be used to update the value of the signal instead of directly modifying the internal slot.
   * @param newValue The new value to set for the signal.
   */
  public set(newValue: T): void {
    if (getFrozen()) {
      throw new Error("Cannot set value while signals are frozen");
    }

    if (!this.#equals.call(this, this.#value, newValue)) {
      this.#value = newValue;
    }
  }

  /**
   * Adds a sink (dependent signal) to this signal. 
   * This method is called internally when a computed signal or watcher reads from this signal, 
   * @internal 
   */
  public _addSink(sink: Computed<unknown> | Watcher) {
    this.#sinks.add(sink);
  }

  /** 
   * Removes a sink (dependent signal) from this signal. 
   * This method is called internally when a computed signal or watcher no longer depends on this signal, 
   * @internal 
   */
  public _removeSink(sink: Computed<unknown> | Watcher) {
    this.#sinks.delete(sink);
  }

  public get watched() {
    return this.#watched;
  }

  public get unwatched() {
    return this.#unwatched;
  }
}