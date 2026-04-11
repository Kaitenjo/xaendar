import { GLOBAL_STATE } from './globals';
import { ComputedState } from './models/computed-state.type';
import { SignalEqual } from './models/signal-equal.type';
import { SignalOptions } from './models/signal-options.type';
import { assertPrivateContext, PRIVATE } from './private-symbol';
import { State } from './state';
import { Watcher } from './watcher';

/**
 * A read-only Signal whose value is derived lazily from other Signals.
 *
 * The value is recomputed only when explicitly read and only if one or more
 * of its (recursive) dependencies have changed since the last evaluation.
 * The result is cached and reused until the Signal becomes stale again.
 *
 * @template T The type of the computed value.
 *
 * @see Signal algorithms — "The Signal.Computed class"
 */
export class Computed<T = any> {
  /**
   * The current value of the signal.
   *
   * Uninitialised (`!`) until the first evaluation. After that, holds either
   * the return value of `#callback` or a boxed error
   * `{ isError: true; value: Error }` if the last evaluation threw.
   *
   * @internalSlot
   * @see Signal algorithms — "Signal.Computed internal slots"
   */
  #value!: T | { isError: true; value: Error };
  /**
   * The current evaluation state of this Signal.
   *
   * - `~dirty~`     — value is known to be stale or has never been evaluated.
   * - `~checked~`   — an indirect source changed; may or may not be stale.
   * - `~computing~` — `#callback` is currently executing; guards against cycles.
   * - `~clean~`     — cached value is up-to-date.
   *
   * @internalSlot
   * @see Signal algorithms — "Signal.Computed State machine"
   */
  #state: ComputedState;
  /**
   * The ordered set of Signals read during the last evaluation of
   * `#callback`. Cleared and rebuilt on every re-evaluation so that
   * conditional branches that are no longer taken stop being tracked.
   *
   * May contain both `State` and `Computed` instances.
   *
   * @internalSlot
   * @see Signal algorithms — "Signal.Computed internal slots"
   */
  #sources: Set<State<unknown> | Computed<unknown>>;
  /**
   * The set of Signals and Watchers that directly depend on this Signal.
   *
   * Populated only when this Signal is reachable from at least one active
   * `Watcher`. An un-watched `Computed` has an empty sinks set, which allows
   * it to be garbage-collected independently from the rest of the graph.
   *
   * @internalSlot
   * @see Signal algorithms — "Signal.Computed internal slots"
   * @see Method — `Signal.Computed.prototype.get` (NOTE on sinks)
   */
  #sinks: Set<Computed<unknown> | Watcher>;
  /**
   * The equality function used to determine whether a newly computed value
   * is meaningfully different from the previously cached one.
   *
   * Called as `equals.call(computed, oldValue, newValue)`. Returns `true` if
   * the values are considered equal, in which case no downstream propagation
   * occurs. Defaults to `Object.is` when not provided via options.
   *
   * If this function throws, the exception is cached as the Signal's value
   * and the outcome is treated as `~dirty~`.
   *
   * @internalSlot
   * @see Signal algorithms — "Signal.Computed internal slots"
   * @see Algorithm — "Set Signal value"
   */
  #equals: SignalEqual<T>;
  /**
   * The pure function that produces this Signal's value. Evaluated lazily
   * whenever the Signal is read while in a `~dirty~` or `~checked~` state.
   *
   * Called with `this` bound to the `Computed` instance itself so that
   * internal methods (e.g. `addSource`) are accessible if needed.
   * Any exception thrown by this function is caught and cached.
   *
   * @internalSlot
   * @see Signal algorithms — "Signal.Computed internal slots"
   */
  #callback: (this: Computed<T>) => T;
  /**
   * Last seen global generation number, used to determine whether this Signal may
   * be stale without having to re-traverse the entire dependency graph. 
   * This is useful when the Computer has no watchers and is only read
   * by explicit `get()` calls, since in that case the state machine cannot be used to track staleness.
   */
  #lastSeenGeneration = -1;
  /**
   * Creates a new `Computed` signal.
   *
   * The Signal starts in the `~dirty~` state with an uninitialised value, so
   * `#callback` will be invoked on the first `get()`.
   *
   * @param cb - Pure function evaluated lazily to produce the value.
   *   Receives the `Computed` instance as `this`.
   * @param options - Optional configuration:
   *   - `equals` — custom equality function; defaults to `Object.is`.
   *
   * @see Signal algorithms — "Signal.Computed Constructor"
   */
  constructor(cb: (this: Computed<T>) => T, options?: SignalOptions<T>) {
    this.#callback = cb;
    this.#equals = options?.equals ?? Object.is;
    this.#sources = new Set;
    this.#sinks = new Set;
    this.#state = 'dirty';
  }

  /**
   * Returns the current value of this Signal, re-evaluating `#callback` if
   * the cached value may be stale.
   *
   * Registers this Signal as a source of any outer `Computed` currently
   * being evaluated (automatic dependency tracking).
   *
   * If the state is `~dirty~` or `~checked~`, walks the source graph
   * depth-first to find and recalculate the deepest stale `Computed` first,
   * then re-checks upward until this Signal is `~clean~`.
   *
   * @returns The current computed value, or a boxed error object if the last
   *   evaluation threw.
   * @throws If `frozen` is `true`.
   * @throws If the Signal is in the `~computing~` state (cyclic dependency).
   *
   * @see Signal algorithms — "Method: Signal.Computed.prototype.get"
   */
  public get(): T | { isError: true; value: Error } {
    if (GLOBAL_STATE.frozen) {
      throw new Error('Cannot get value of a Computed signal while the global state is frozen');
    }

    if (this.#state === 'computing') {
      throw new Error('Circular dependency detected while computing a Computed signal');
    }

    GLOBAL_STATE.computing?.addSource(this, PRIVATE);

    // The global generation counter is used to invalidate Computed Value when no watchers are present and the state machine cannot be used to track staleness
    if (this.#sinks.size === 0 && this.#lastSeenGeneration < GLOBAL_STATE.generation && this.#state === 'clean') {
      this.#state = 'dirty';
    }
    
    if (this.#state === 'dirty' || this.#state === 'checked') {
      /*
        lastSeenGeneration MUST be updated even if there are any Watchers

        Edge Case:
        Watcher unwatch a Computed
        Computed is read (get) → state is clean, there are no sinks but lastSeenGeneration hasn't changed -> Do Not Recalculate.

        If we do not update lastGeneration even if it's watched, the first manual read will recalculate the value even if no changes 
        have occurred in the dependency graph, which is not what we want.

        This also cause always a double recalculation for the first two .get() calls when there is no watchers
        Since the beginning state is dirty and this would have prevent the set of lastSeenGeneration to the current generation 
        if the instruction would've be placed in the above if statement
      */
      this.#lastSeenGeneration = GLOBAL_STATE.generation;

      while (this.#state === 'dirty' || this.#state === 'checked') {
        const deepest = this.#findDeepestStale();
        deepest.#computeValue();
      }
    }

    return this.#value;
  }

  /**
   * Registers a Signal as a source of this `Computed`, discovered during the
   * execution of `#callback`.
   *
   * If this `Computed` is currently being watched (has at least one sink),
   * the source is also informed of this Signal as a new sink, building the
   * live push-notification chain upward.
   *
   * @param source - The Signal read during evaluation.
   * @param symbol - Private access symbol; rejects calls from outside the library.
   * @internal
   */
  public addSource(source: State | Computed, symbol: Symbol) {
    assertPrivateContext(symbol);
    this.#sources.add(source);
  }

  /**
   * Returns the current evaluation state of this Signal.
   *
   * @param symbol - Private access symbol; rejects calls from outside the library.
   * @internal
   * @see Signal algorithms — "Signal.Computed State machine"
   */
  public getState(symbol: Symbol): ComputedState {
    assertPrivateContext(symbol);
    return this.#state;
  }

  /**
   * Transitions this Signal to a new evaluation state.
   *
   * Only valid transitions (as defined by the state machine) are allowed.
   * Invalid transitions throw an error.
   *
   * @param newState - The target state.
   * @param symbol - Private access symbol; rejects calls from outside the library.
   * @throws If the transition from the current state to `newState` is not allowed.
   * @internal
   * @see Signal algorithms — "Signal.Computed State machine"
   */
  public setState(newState: ComputedState, symbol: Symbol) {
    assertPrivateContext(symbol);

    if (isValidTransition(this.#state, newState)) {
      throw new Error(`Cannot transition from ${this.#state} to ${newState}`);
    }

    this.#state = newState;
  }

  /**
   * Registers a new sink (a `Computed` or `Watcher` that directly depends on
   * this Signal) in the internal sinks set.
   *
   * If this is the first sink, propagates the sink registration recursively
   * up through `#sources`, building the live dependency chain that enables
   * push-based invalidation.
   *
   * @param sink - The dependent node to register.
   * @param symbol - Private access symbol; rejects calls from outside the library.
   * @internal
   */
  public addSink(sink: Computed<unknown> | Watcher, symbol: Symbol) {
    assertPrivateContext(symbol);
    if (this.#sinks.size === 0) {
      this.#sources.forEach(source => source.addSink(this, PRIVATE));
    }
    this.#sinks.add(sink);
  }

  /**
   * Removes a sink from the internal sinks set.
   *
   * If the sinks set becomes empty after removal, propagates the removal
   * recursively up through `#sources`, tearing down the live dependency
   * chain and allowing garbage collection of un-watched nodes.
   *
   * @param sink - The dependent node to remove.
   * @param symbol - Private access symbol; rejects calls from outside the library.
   * @internal
   */
  public removeSink(sink: Computed | Watcher, symbol: Symbol) {
    assertPrivateContext(symbol);
    this.#sinks.delete(sink);

    if (this.#sinks.size === 0) {
      this.#sources.forEach(source => source.removeSink(this, PRIVATE));
    }
  }

  /**
   * Checks whether this `Computed` is currently being watched (i.e. has at least one sink).
   *
   * Used by `State` nodes to determine whether to add this `Computed` to their
   * @param symbol - Private access symbol; rejects calls from outside the library.
   * @returns `true` if this Signal has at least one sink, `false` otherwise.
   */
  public watched(symbol: Symbol): boolean {
    assertPrivateContext(symbol);
    return this.#sinks.size > 0;
  }

  /**
   * Recursively walks the source graph depth-first to find the deepest,
   * left-most `Computed` node that is in a `~dirty~` or `~checked~` state.
   *
   * This ensures that recalculation always starts from the bottom of the
   * dependency graph, so every node sees already-updated dependencies —
   * the core of glitch-free evaluation.
   *
   * Cuts off the search when hitting a `~clean~` `Computed` source, since
   * its subtree is guaranteed to be up-to-date.
   *
   * @returns The deepest stale `Computed` found, or `node` itself if none of
   *   its sources are stale.
   */
  #findDeepestStale(): Computed {
    const unclearNode = [...this.#sources].find((source): source is Computed => source instanceof Computed && (source.#state === 'dirty' || source.#state === 'checked'));
    return unclearNode ? unclearNode.#findDeepestStale() : this;
  }

  /**
   * Executes `#callback` to recompute this Signal's value.
   *
   * Implements the "recalculate dirty computed Signal" algorithm:
   * 1. Clears stale sources and removes this Signal from their sinks.
   * 2. Sets `computing` to this Signal for automatic dependency tracking.
   * 3. Runs the callback, caching the return value or any thrown exception.
   * 4. Restores the previous `computing` value.
   * 5. Runs the "set Signal value" algorithm to detect value changes.
   * 6. Transitions state to `~clean~`.
   * 7. Propagates `~dirty~` to sinks (or attempts `~clean~` if value unchanged).
   *
   * @see Signal algorithms — "Algorithm: recalculate dirty computed Signal"
   */
  #computeValue(): void {
    this.#sources.forEach(source => source.removeSink(this, PRIVATE));
    this.#sources.clear();

    const previousComputing = GLOBAL_STATE.computing;
    GLOBAL_STATE.computing = this;
    this.#state = 'computing';

    let newValue: T | { isError: true; value: Error };

    try {
      newValue = this.#callback.call(this);
    } catch (error) {
      newValue = { isError: true, value: error as Error };
    } finally {
      GLOBAL_STATE.computing = previousComputing;
    }

    const outcome = this.#setValue(newValue);

    this.#state = 'clean';

    outcome === 'dirty'
      ? this.#sinks.forEach(sink => sink instanceof Computed ? sink.setState('dirty', PRIVATE) : sink.notify(PRIVATE))
      : this.#propagateClean();
  }

  /**
   * Implements the "set Signal value" algorithm.
   *
   * Compares the new value against the cached one using `#equals`. If equal,
   * returns `~clean~` and leaves `#value` untouched. Otherwise updates
   * `#value` and returns `~dirty~`.
   *
   * Special cases:
   * - If `newValue` is a boxed error, `#equals` is skipped and the error is
   *   cached directly.
   * - If `#equals` itself throws, the exception is cached as a boxed error
   *   and the outcome is `~dirty~`.
   *
   * @param newValue - The value (or boxed error) produced by `#callback`.
   * @returns `~clean~` if the value is unchanged, `~dirty~` otherwise.
   *
   * @see Signal algorithms — "Set Signal value algorithm"
   */
  #setValue(newValue: T | { isError: true; value: Error }): 'clean' | 'dirty' {
    const oldValue = this.#value;

    /*
      If new value is an error we always update without calling equals
    */
    if (this.#isErrorValue(newValue)) {
      this.#value = newValue;
      return 'dirty';
    }

    try {
      if (!this.#isErrorValue(oldValue) && this.#equals.call(this, oldValue, newValue)) {
        return 'clean';
      }
    } catch (equalsError) {
      this.#value = { isError: true, value: equalsError as Error };
      return 'dirty';
    }

    this.#value = newValue;
    return 'dirty';
  }

  /**
   * Recursively marks `~checked~` sinks as `~clean~` when all of their
   * immediate sources are already `~clean~`.
   *
   * Called after a recalculation that produced an unchanged value (`~clean~`
   * outcome from `#setValue`). Propagates the clean signal upward through
   * the graph so that Computed nodes that were only transitively dirty — and
   * whose dependencies have not actually changed — are not needlessly
   * re-evaluated on the next read.
   *
   * @see Signal algorithms — "Algorithm: recalculate dirty computed Signal"
   */
  #propagateClean(): void {
    [...this.#sinks]
      .filter((sink): sink is Computed<unknown> => sink instanceof Computed && sink.#state === 'checked')
      .forEach(sink => {
        const allSourcesClean = [...sink.#sources].every(source => !(source instanceof Computed) || source.#state === 'clean');
        if (allSourcesClean) {
          sink.#state = 'clean';
          sink.#propagateClean();
        }
      });
  }

  /**
   * Type guard that checks whether a value is a boxed error object.
   *
   * Used to distinguish a legitimately computed value from a cached
   * exception produced by `#callback` or `#equals`.
   *
   * @param value - The value to inspect.
   * @returns `true` if `value` is `{ isError: true; value: Error }`.
   */
  #isErrorValue(value: unknown): value is { isError: true; value: Error } {
    return typeof value === 'object' && !!value && 'isError' in value;
  }
}

/**
 * Determines whether a transition between two `ComputedState` values is
 * permitted by the Computed Signal state machine.
 *
 * Valid transitions:
 * - `~checked~`   → `~clean~` | `~dirty~`
 * - `~clean~`     → `~checked~` | `~dirty~`
 * - `~dirty~`     → `~computing~`
 * - `~computing~` → `~clean~`
 *
 * @param from - The current state.
 * @param to - The target state.
 * @returns `true` if the transition is allowed, `false` otherwise.
 *
 * @see Signal algorithms — "Signal.Computed State machine"
 */
function isValidTransition(from: ComputedState, to: ComputedState): boolean {
  switch (from) {
    case 'checked':
      return to === 'clean' || to === 'dirty';
    case 'clean':
      return to === 'checked' || to === 'dirty';
    case 'dirty':
      return to === 'computing';
    case 'computing':
      return to === 'clean';
  }
}