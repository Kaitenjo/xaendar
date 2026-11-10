/**
 * An effect: the `Signal.Computed` its callback runs in, watched by a `Signal.subtle.Watcher` of its own (see
 * `createEffect`).
 */
export type Effect = Signal.Computed<void> & {
  /**
   * Runs the callback between the hooks: called by the computed signal the effect is, while it tracks the signals read.
   */
  run(): void;
  /**
   * Disposes the effect: it calls `onCleanup`, then stops watching, so the callback never runs again.
   */
  dispose(): void;
};
