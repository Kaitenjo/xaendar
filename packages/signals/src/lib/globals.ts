import { Computed } from "./computed";

/**
 * The innermost `Signal.Computed` (or effect Signal) currently being
 * re-evaluated as a side-effect of a `.get()` call.
 *
 * All Signal reads that occur while this is non-null will register
 * themselves as sources of this computed, enabling automatic dependency
 * tracking.
 *
 * Set to `null` when no computed is being evaluated (i.e. a "root" read).
 *
 * @see Signal algorithms — "Hidden global state"
 */
let computing: Computed<unknown> | null = null;
export function setComputing(value: Computed<unknown> | null) {
  computing = value;
}
export function getComputing() {
  return computing;
}

/**
 * Whether a callback is currently executing that requires the Signal graph
 * to remain unmodified for the duration of its execution.
 *
 * When `true`, any attempt to read or write a Signal will throw an exception.
 * This prevents the graph from being mutated while it is being traversed,
 * which would risk exposing inconsistent or half-processed state.
 *
 * Set to `true` immediately before invoking:
 * - The `notify` callback of a `Signal.subtle.Watcher` (during `State.prototype.set`)
 * - The `watched` callback (during `Watcher.prototype.watch`)
 * - The `unwatched` callback (during `Watcher.prototype.unwatch`)
 *
 * Restored to `false` in a `finally` block after each such callback returns
 * (or throws), guaranteeing the flag is never left permanently set.
 *
 * Note: `Signal.subtle.untrack` does NOT clear this flag — frozen is always
 * respected regardless of tracking context.
 *
 * @see Signal algorithms — "Hidden global state"
 * @see Method: `Signal.State.prototype.set`
 * @see Method: `Signal.subtle.Watcher.prototype.watch`
 * @see Method: `Signal.subtle.Watcher.prototype.unwatch`
 */
let frozen = false;
export function setFrozen(value: boolean) {
  frozen = value;
}
export function getFrozen() {
  return frozen;
}


/**
 * A monotonically incrementing integer used to track how current a cached
 * value is, while avoiding circularities in the Signal graph.
 *
 * Incremented every time a `Signal.State` is set to a new value (i.e. when
 * the `equals` check returns `false`). Computed Signals compare their own
 * recorded generation number against this value to cheaply determine whether
 * they may be stale, without re-traversing the entire dependency graph.
 *
 * Starts at `0`.
 *
 * @see Signal algorithms — "Hidden global state"
 */
export let generation = 0;