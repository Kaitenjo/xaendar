import { NoArgsVoidFunction } from '@xaendar/types';
import { EffectOptions } from '../types/effect-options.type';

/**
 * Runs a side-effectful function and automatically re-runs it whenever any
 * Signal read during its execution changes.
 *
 * Internally, `effect` wraps the user callback inside a `Computed` node
 * (for dependency tracking) and observes it with a `Watcher` (for push
 * notifications). When any tracked dependency changes, the `Watcher`
 * schedules a microtask that re-evaluates the `Computed`, which in turn
 * re-runs the user callback and re-registers the new set of dependencies.
 *
 * The returned disposer function stops the effect: it unwatches the internal
 * `Computed` from the `Watcher`, severing all dependency subscriptions so
 * the callback is never called again and the graph nodes can be
 * garbage-collected.
 *
 * @example
 * ```ts
 * const count = new State(0);
 *
 * const stop = effect(() => {
 *   console.log('count is', count.get());
 * });
 * // logs: "count is 0"
 *
 * count.set(1); // logs: "count is 1"
 * count.set(2); // logs: "count is 2"
 *
 * stop();       // no more logs
 * count.set(3); // silent
 * ```
 *
 * An exception thrown by `fn` on the initial execution escapes `effect`, and
 * the effect is torn down since no disposer could be returned. One thrown by a
 * re-run escapes the microtask (reaching the global error handler), and the
 * effect keeps re-running when its dependencies change.
 *
 * @param fn - The side-effectful function to run. Any Signal read inside it
 *   is tracked as a dependency.
 * @returns A disposer function that, when called, permanently stops the effect.
 * @throws The exception thrown by `fn` on the initial execution.
 */
export function effect(fn: NoArgsVoidFunction, options?: EffectOptions): NoArgsVoidFunction {
  /**
   * Wrap the user callback in a Computed so that automatic dependency
   * tracking (via pushComputed / popComputed) works for free.
   * The Computed always returns `undefined` — we only care about the
   * side-effects and the tracked sources, not the value.
   */
  const computed = new Signal.Computed<void>(() => fn());

  let needsEnqueue = true;

  /**
   * The Watcher is notified synchronously as soon as any tracked dependency
   * changes. Its job is purely to schedule the re-execution; the actual
   * re-evaluation happens asynchronously in a microtask so that multiple
   * synchronous signal updates are batched into a single re-run.
   */
  const watcher = new Signal.subtle.Watcher(() => {
    if (needsEnqueue) {
      needsEnqueue = false;
      queueMicrotask(() => {
        needsEnqueue = true;
        options?.onBeforeRun?.();
        try {
          const pendings = watcher.getPending();
          for (let i = 0; i < pendings.length; i++) {
            pendings[i].get();
          }
        } finally {
          options?.onAfterRun?.();
          watcher.watch();
        }
      });
    }
  });

  // Initial synchronous execution + first subscription.
  options?.onBeforeRun?.();
  watcher.watch(computed);
  try {
    computed.get();
  } catch (error) {
    // The caller gets no disposer: stop watching, or the effect would re-run forever
    watcher.unwatch(computed);
    throw error;
  } finally {
    options?.onAfterRun?.();
  }

  /**
   * Disposer — call this to permanently stop the effect.
   *
   * Unwatching the Computed tears down the entire live dependency chain
   * (Watcher → Computed → all sources), preventing any further
   * notifications and allowing GC.
   */
  return () => {
    options?.onCleanup?.();
    watcher.unwatch(computed)
  };
}