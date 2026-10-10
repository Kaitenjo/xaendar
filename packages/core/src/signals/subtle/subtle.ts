import type { InputSignal } from '../types/input-signal.type';
import type { QuerySignal } from '../types/query-signal.type';
import { toNode, toWrapper } from '../signal-node/signal-node';

/**
 * A signal: a function returned by `signal()`, `computed()`, `input()` or a query, or a node of the TC39 proposal.
 */
type AnySignal = Signal.State<unknown> | Signal.Computed<unknown> | InputSignal<unknown> | QuerySignal<unknown>;

/**
 * A node that reads other signals: a computed signal or a watcher.
 */
type AnySink = Signal.Computed<unknown> | Signal.subtle.Watcher;

/**
 * Tells whether a value is a writable signal: a `Signal.State`, or a function wrapping one,
 * as the ones returned by `signal()`, `input()` and the queries.
 *
 * @param value - The value to check.
 * @returns `true` if the value is, or wraps, a `Signal.State`.
 */
export function isState(value: unknown): boolean {
  return toNode(value) instanceof Signal.State;
}

/**
 * Tells whether a value is a computed signal: a `Signal.Computed`, or a function wrapping one,
 * as the ones returned by `computed()`.
 *
 * @param value - The value to check.
 * @returns `true` if the value is, or wraps, a `Signal.Computed`.
 */
export function isComputed(value: unknown): boolean {
  return toNode(value) instanceof Signal.Computed;
}

/**
 * Returns the signals a computed signal read during its last evaluation, or the ones a watcher watches,
 * as `Signal.subtle.introspectSources` does, accepting and returning the functions returned by `signal()`,
 * `computed()`, `input()` and the queries in place of the nodes they wrap.
 *
 * @param sink - The computed signal or the watcher.
 * @returns Its sources.
 */
export function introspectSources(sink: AnySink): AnySignal[] {
  return Signal.subtle.introspectSources(toNode(sink)).map(toWrapper);
}

/**
 * Returns the computed signals and the watchers depending on a signal, as `Signal.subtle.introspectSinks` does,
 * accepting and returning the functions returned by `signal()`, `computed()`, `input()` and the queries
 * in place of the nodes they wrap.
 *
 * @param signal - The signal.
 * @returns Its sinks.
 */
export function introspectSinks(signal: AnySignal): AnySink[] {
  return Signal.subtle.introspectSinks(toNode(signal) as Signal.State).map(toWrapper);
}

/**
 * Tells whether a computed signal or a watcher depends on some signal, as `Signal.subtle.hasSources` does.
 *
 * @param sink - The computed signal or the watcher.
 * @returns `true` if it has at least one source.
 */
export function hasSources(sink: AnySink): boolean {
  return Signal.subtle.hasSources(toNode(sink));
}

/**
 * Tells whether a signal is live, read by a watcher or by a live computed signal, as `Signal.subtle.hasSinks` does.
 *
 * @param signal - The signal.
 * @returns `true` if it has at least one sink.
 */
export function hasSinks(signal: AnySignal): boolean {
  return Signal.subtle.hasSinks(toNode(signal) as Signal.State);
}

/**
 * Makes a watcher watch some signals, as its `watch` method does, accepting the functions returned
 * by `signal()`, `computed()`, `input()` and the queries.
 *
 * @param watcher - The watcher.
 * @param signals - The signals to watch.
 */
export function watch(watcher: Signal.subtle.Watcher, ...signals: AnySignal[]): void {
  watcher.watch(...signals.map(signal => toNode(signal) as Signal.State));
}

/**
 * Makes a watcher stop watching some signals, as its `unwatch` method does, accepting the functions returned
 * by `signal()`, `computed()`, `input()` and the queries.
 *
 * @param watcher - The watcher.
 * @param signals - The signals to stop watching.
 */
export function unwatch(watcher: Signal.subtle.Watcher, ...signals: AnySignal[]): void {
  watcher.unwatch(...signals.map(signal => toNode(signal) as Signal.State));
}

/**
 * Returns the computed signals a watcher watches whose value may be stale, as its `getPending` method does,
 * returning the functions returned by `computed()` in place of the nodes they wrap.
 *
 * @param watcher - The watcher.
 * @returns The pending computed signals.
 */
export function getPending(watcher: Signal.subtle.Watcher): Signal.Computed<unknown>[] {
  return watcher.getPending().map(toWrapper);
}
