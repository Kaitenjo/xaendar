import { Computed } from '../models/computed/computed';

export type GlobalState = {
  /**
   * The innermost `Signal.Computed` (or effect Signal) currently being
   * re-evaluated as a side-effect of a `.get()` call.
   *
   * All Signal reads that occur while this is non-null will register
   * themselves as sources of this computed, enabling automatic dependency
   * tracking.
   *
   * Set to `null` when no computed is being evaluated (i.e. a 'root' read).
   *
   * @see Signal algorithms — 'Hidden global state'
   */
  computing: Computed | null;
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
 * @see Signal algorithms — 'Hidden global state'
 * @see Method: `Signal.State.prototype.set`
 * @see Method: `Signal.subtle.Watcher.prototype.watch`
 * @see Method: `Signal.subtle.Watcher.prototype.unwatch`
 */
  frozen: boolean;
  /**
   * Incremented each time a `Signal.State` changes value.
   *
   * A `Computed` records it at the end of each evaluation: when it gains its first sink, a different value means that
   * a State may have changed while nothing was watching it, so its cached value may be stale. The check is conservative:
   * a change of an unrelated State only costs one more evaluation, a stale value is never kept.
   */
  version: number;
};
