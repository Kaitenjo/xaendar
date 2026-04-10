import { VoidFunction } from '@xendar/common';
import { Computed } from './computed';
import { getFrozen, setFrozen } from './globals';
import { Signal } from './models/signal.interface';
import { WatcherState } from './models/watcher-state.type';
import { State } from './state';

/**
 * A `Watcher` observes a set of Signals and fires a `notify` callback
 * synchronously when any of their (recursive) dependencies change.
 *
 * It is the low-level primitive on top of which frameworks implement
 * effects and scheduling. It does not hold a value and has no generic
 * type parameter.
 *
 * @see Signal algorithms — "The `Signal.subtle.Watcher` class"
 */
export class Watcher {
  /**
   * The current state of the Watcher.
   *
   * - `~waiting~`  — newly created, or `notify` has already been called since
   *                  the last `watch` call. Not actively observing changes.
   * - `~watching~` — actively watching; no dependency has changed yet.
   * - `~pending~`  — a dependency has changed but `notify` has not yet run.
   *
   * @see Signal algorithms — "Signal.subtle.Watcher State machine"
   */
  #state: WatcherState;
  /**
   * The ordered set of Signals this Watcher is currently watching.
   * May contain both `State` and `Computed` instances.
   *
   * @see Signal algorithms — "Signal.subtle.Watcher internal slots"
   */
  #signals: Set<Signal<unknown>>;
  /**
   * The callback invoked synchronously when a watched Signal (or one of its
   * recursive dependencies) changes for the first time since the last
   * `watch` call.
   *
   * Receives the Watcher itself as `this`. No Signals may be read or written
   * during its execution (`frozen` is `true` for its entire duration).
   *
   * @see Signal algorithms — "Signal.subtle.Watcher internal slots"
   */
  #notifyCallback: VoidFunction<[Watcher]>;

  /**
   * Creates a new Watcher.
   *
   * The Watcher starts in the `~waiting~` state with an empty signals set.
   *
   * @param notifyCallback - Called synchronously (with `frozen = true`) the
   * first time a watched dependency changes after each `watch` call. No
   * Signals may be read or written inside this callback.
   *
   * @see Signal algorithms — "Constructor: new Signal.subtle.Watcher(callback)"
   */
  constructor(notifyCallback: VoidFunction<[Watcher]>) {
    this.#state = 'waiting';
    this.#signals = new Set;
    this.#notifyCallback = notifyCallback;
  }

  /**
   * Returns the subset of watched Signals that are `Computed` instances
   * currently in a `~dirty~` or `~checked~` state, meaning they may have a
   * stale value that has not yet been re-evaluated.
   *
   * Typically called inside the microtask scheduled by the `notify` callback
   * to know which Signals need to be pulled.
   *
   * @returns An array of `Computed` signals that are dirty or checked.
   *
   * @see Signal algorithms — "Method: Signal.subtle.Watcher.prototype.getPending()"
   */
  public getPending(): Computed<unknown>[] {
    return [...this.#signals].filter((signal): signal is Computed<unknown> => signal instanceof Computed && (signal.state === 'checked' || signal.state === 'dirty'));
  }

  /**
   * Adds the given Signals to the watched set and transitions the Watcher to
   * the `~watching~` state.
   *
   * For each newly-watched Signal, the Watcher is registered as a sink and —
   * if it is the first sink — the sink registration is propagated recursively
   * up through the Signal's sources, building the live dependency chain.
   *
   * The `watched` callback of each Signal (if any) is called with
   * `frozen = true`.
   *
   * @param signals - One or more `State` signals to start watching.
   * @throws If `frozen` is `true` at the time of the call.
   *
   * @see Signal algorithms — "Method: Signal.subtle.Watcher.prototype.watch(...signals)"
   */
  public watch(...signals: State<unknown>[]) {
    if (getFrozen()) {
      throw new Error('Cannot watch signals while frozen');
    }

    signals.forEach(signal => {
      this.#signals.add(signal)
      signal._addSink(this);

      setFrozen(true);

      try {
        signal.watched();
      } finally {
        setFrozen(false);
      }
    });


    if (this.#state === 'waiting') {
      this.#state = 'watching';
    }
  }

  /**
   * Removes the given Signals from the watched set.
   *
   * For each removed Signal, the Watcher is unregistered as a sink. If the
   * Signal's sink set becomes empty as a result, the removal is propagated
   * recursively up through its sources, tearing down the live dependency
   * chain and allowing garbage collection of unwatched nodes.
   *
   * The `unwatched` callback of each Signal (if any) is called with
   * `frozen = true`.
   *
   * If no Signals remain in the watched set, the Watcher transitions back to
   * the `~waiting~` state.
   *
   * @param signals - One or more `State` signals to stop watching.
   * @throws If `frozen` is `true` at the time of the call.
   * @throws If any of the given Signals is not currently being watched.
   *
   * @see Signal algorithms — "Method: Signal.subtle.Watcher.prototype.unwatch(...signals)"
   */
  public unwatch(...signals: State<unknown>[]) {
    if (getFrozen()) {
      throw new Error('Cannot unwatch signals while frozen');
    }

    signals.forEach(signal => {
      if (this.#signals.has(signal)) {
        this.#signals.delete(signal)
        signal._removeSink(this);
      } else {
        throw new Error('Cannot unwatch a signal that is not being watched');
      }

      setFrozen(true);
      
      try {
        signal.unwatched();
      } finally {
        setFrozen(false);
      }
    });

    if (!this.#signals.size && this.#state === 'watching') {
      this.#state = 'waiting';
    }
  }
}