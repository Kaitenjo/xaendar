import { signal } from '@xaendar/core/signals';

/**
 * A function wrapping a Signal.State: typed as one, but not one.
 */
const count = signal(0);
/**
 * A Signal.State.
 */
const total = new Signal.State(0);
/**
 * A watcher.
 */
const watcher = new Signal.subtle.Watcher(() => {});

// ✗ Type-checks, then throws TypeError: signal.addSink is not a function
watcher.watch(count);

// ✓
watcher.watch(total);
