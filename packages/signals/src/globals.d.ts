declare global {
  namespace Signal {
    /**
     * A mutable Signal that holds a value and notifies dependents when it changes.
     *
     * @template T The type of the value held by this Signal.
     */
    class State <T = any> {
      /**
       * Creates a new `State` signal.
       *
       * @param initialValue - The initial value of the signal.
       * @param options - Optional configuration:
       *   - `equals` — custom equality function; defaults to `Object.is`.
       *   - `watched` — called when the signal gains its first sink.
       *   - `unwatched` — called when the signal loses its last sink.
       */
      constructor(value: T, options?: { equals?: (a: T, b: T) => boolean, watched?: () => void, unwatched?: () => void });
      /**
       * Returns the current value of the signal, registering this Signal as a
       * source of the innermost `Computed` currently being evaluated (if any).
       *
       * @throws If `frozen` is `true` — reads are forbidden while a protected
       * callback (`notify`, `watched`, `unwatched`) is executing.
       */
      get(): T;
      /**
       * Updates the signal's value and propagates changes to all dependent
       * sinks.
       *
       * If `equals(currentValue, newValue)` returns `true` the call is a no-op
       * and no propagation occurs. Otherwise the value is updated, all direct
       * `Computed` sinks are marked dirty, indirect ones checked, and
       * each reachable `Watcher` has its `notify` callback invoked synchronously
       * (with `frozen = true`).
       *
       * @param newValue - The new value to set.
       * @throws If `frozen` is `true` — writes are forbidden while a protected
       * callback is executing.
       */
      set(newValue: T): void;
    }

    /**
     * A read-only Signal whose value is derived lazily from other Signals.
     *
     * The value is recomputed only when explicitly read and only if one or more
     * of its (recursive) dependencies have changed since the last evaluation.
     * The result is cached and reused until the Signal becomes stale again.
     *
     * @template T The type of the computed value.
     */
    class Computed<T = any> {
      /**
       * Creates a new `Computed` signal.
       *
       * The Signal starts in the dirty state with an uninitialised value, so
       * the callback will be invoked on the first `get()`.
       *
       * @param computeFn - Pure function evaluated lazily to produce the value.
       * @param options - Optional configuration:
       *   - `equals` — custom equality function; defaults to `Object.is`.
       */
      constructor(computeFn: () => T, options?: { equals?: (a: T, b: T) => boolean, watched?: () => void, unwatched?: () => void });
      /**
       * Returns the current value of this Signal, re-evaluating the callback if
       * the cached value may be stale.
       *
       * Registers this Signal as a source of any outer `Computed` currently
       * being evaluated (automatic dependency tracking).
       *
       * @returns The current computed value, or a boxed error object if the last
       *   evaluation threw.
       * @throws If `frozen` is `true`.
       * @throws If the Signal is in the computing state (cyclic dependency).
       */
      get(): T | { isError: true, value: Error };
    }

    namespace subtle {
      /**
       * Executes a function without tracking any dependencies.
       * @param fn - The function to execute without tracking.
       * @returns The result of the function execution.
       */
      function untrack<T>(fn: () => T): T;
      /**
       * Returns the currently active `Computed` instance being evaluated, or `null`.
       * @returns The currently active `Computed` instance, or `null` if none is being evaluated.
       */
      function currentComputed(): Computed | null;
      /**
       * Returns the ordered list of all Signals which the given `Computed` or
       * `Watcher` referenced during its last evaluation.
       *
       * - For a `Computed`, these are the Signals read inside its callback.
       * - For a `Watcher`, these are the Signals it is currently watching.
       *
       * @param s - The `Computed` or `Watcher` to introspect.
       * @returns An array of `State` and `Computed` instances.
       */
      function introspectSources(s: Computed | Watcher): (State | Computed)[];
      /**
       * Returns the direct dependents of the given Signal — Watchers that contain
       * it, plus any `Computed` Signals which read it during their last evaluation
       * (if that `Computed` is recursively watched).
       *
       * @param signal - The `State` or `Computed` Signal to introspect.
       * @returns An array of `Computed` and `Watcher` instances.
       */
      function introspectSinks(signal: State | Computed): (Computed | Watcher)[];
      /**
       * Returns `true` if the given Signal is 'live' — i.e. it is watched by a
       * `Watcher`, or it is read by a `Computed` Signal which is (recursively)
       * live.
       *
       * @param signal - The `State` or `Computed` Signal to check.
       * @returns `true` if the Signal has at least one sink.
       */
      function hasSinks(signal: State | Computed): boolean;
      /**
       * Returns `true` if the given node is 'reactive' — i.e. it depends on some
       * other Signal. A `Computed` where `hasSources` is `false` will always
       * return the same constant.
       *
       * @param s - The `Computed` or `Watcher` to check.
       * @returns `true` if the node has at least one source.
       */
      function hasSources(s: Computed | Watcher): boolean;

      /**
       * A `Watcher` observes a set of Signals and fires a `notify` callback
       * synchronously when any of their (recursive) dependencies change.
       *
       * It is the low-level primitive on top of which frameworks implement
       * effects and scheduling. It does not hold a value and has no generic
       * type parameter.
       */
      class Watcher {
        /**
         * Creates a new Watcher.
         *
         * The Watcher starts in the waiting state with an empty signals set.
         *
         * @param notify - Called synchronously (with `frozen = true`) the
         * first time a watched dependency changes after each `watch` call. No
         * Signals may be read or written inside this callback.
         */
        constructor(notify: () => void);
        /**
         * Adds the given Signals to the watched set and transitions the Watcher to
         * the watching state.
         *
         * For each newly-watched Signal, the Watcher is registered as a sink and —
         * if it is the first sink — the sink registration is propagated recursively
         * up through the Signal's sources, building the live dependency chain.
         *
         * @param signals - One or more Signals to start watching.
         * @throws If `frozen` is `true` at the time of the call.
         */
        watch(...signals: (State | Computed)[]): void;
        /**
         * Removes the given Signals from the watched set.
         *
         * For each removed Signal, the Watcher is unregistered as a sink. If the
         * Signal's sink set becomes empty as a result, the removal is propagated
         * recursively up through its sources, tearing down the live dependency
         * chain and allowing garbage collection of unwatched nodes.
         *
         * @param signals - One or more Signals to stop watching.
         * @throws If `frozen` is `true` at the time of the call.
         * @throws If any of the given Signals is not currently being watched.
         */
        unwatch(...signals: (State | Computed)[]): void;
      }
    }
  }
}

export {};