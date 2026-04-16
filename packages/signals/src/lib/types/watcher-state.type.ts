/**
 * Type of the state of a watcher.
 * - `waiting`: The watcher is waiting for its dependencies to change.
 * - `watching`: The watcher is currently watching its dependencies for changes.
 * - `pending`: The watcher has been notified of a change and is pending re-evaluation.
 */
export type WatcherState = 'waiting' | 'watching' | 'pending';