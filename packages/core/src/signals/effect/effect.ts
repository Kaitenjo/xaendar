import { NoArgsVoidFunction } from '@xaendar/types';
import { createEffect } from '../../models/effect/effect';
import type { EffectCallback } from '../../types/effect-callback.type';
import type { _Context } from '../../utils/context/context.util';
import { EffectOptions } from '../types/effect-options.type';

/**
 * Runs a side-effectful function and automatically re-runs it whenever any
 * Signal read during its execution changes.
 *
 * Internally, the function runs in an `Effect`: a `Computed` node (for dependency
 * tracking) observed by a `Watcher` of its own (for push notifications). When any
 * tracked dependency changes, the `Watcher` queues itself in the queue shared by
 * every effect, which re-evaluates the queued effects in a single microtask:
 * multiple synchronous signal updates are batched into a single re-run, which
 * re-registers the new set of dependencies.
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
 * re-run escapes the microtask (reaching the global error handler), the other
 * effects running in another one, and the effect keeps re-running when its
 * dependencies change.
 *
 * @param fn - The side-effectful function to run. Any Signal read inside it
 *   is tracked as a dependency.
 * @param options - The hooks called around each run and on disposal.
 * @returns A disposer function that, when called, permanently stops the effect.
 * @throws The exception thrown by `fn` on the initial execution.
 */
export function effect(fn: NoArgsVoidFunction, options?: EffectOptions): NoArgsVoidFunction {
  const node = createEffect(fn, options);
  return () => node.dispose();
}

/**
 * Runs an effect disposed with a context, for the bindings of the templates: the callback is declared once, and receives
 * the data of each binding as arguments, so that an effect allocates no closure, and the context keeps the effect itself
 * as its cleanup, disposing it with its `dispose()`.
 *
 * @param context - The context disposing the effect when it is cleared.
 * @param callback - The callback of the effect, run at once and again whenever a signal it read changes.
 * @param first - The first argument of the callback.
 * @param second - The second argument of the callback.
 * @param third - The third argument of the callback.
 * @throws The exception thrown by the first run.
 */
export function _bindEffect<First, Second, Third>(context: _Context, callback: EffectCallback<First, Second, Third>, first: First, second?: Second, third?: Third): void {
  context.addUnlistener(createEffect(callback, undefined, first, second, third));
}
