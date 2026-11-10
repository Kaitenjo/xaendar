/**
 * The watchers of the effects to run, in the order they were notified: shared by every effect, so that a round of
 * changes schedules a single microtask however many effects it reaches.
 */
const queue = new Array<Signal.subtle.Watcher>();

/**
 * The index of the next watcher of {@link queue} to run.
 */
let position = 0;

/**
 * Whether a microtask running the queue is scheduled.
 */
let scheduled = false;

/**
 * The `notify` callback of the watcher of every effect: the watcher is `this`. It queues the watcher, and schedules the
 * microtask running the queue unless it already is. A watcher notifies once, then waits until it runs and is re-armed,
 * so each effect is queued once however many changes arrive meanwhile; one notified while the queue runs, as by a signal
 * another effect writes, runs in the same round.
 *
 * @param this - The watcher of the effect.
 */
export function queueWatcher(this: Signal.subtle.Watcher): void {
  queue.push(this);
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(runQueue);
  }
}

/**
 * Runs the effects of the queued watchers, in order, the ones queued meanwhile included.
 *
 * An error thrown by an effect escapes the microtask, reaching the global error handler, as it did when each effect had
 * a microtask of its own: the effects after it run in another microtask, scheduled before the error is rethrown.
 *
 * @throws The error thrown by an effect.
 */
function runQueue(): void {
  try {
    while (position < queue.length) {
      runWatcher(queue[position++]);
    }
  } catch (error) {
    position < queue.length ? queueMicrotask(runQueue) : resetQueue();
    throw error;
  }

  resetQueue();
}

/**
 * Runs the effect of a watcher, evaluating its computed signal when it is pending, then re-arms the watcher, so that the
 * next change notifies it again. The computed signal of a disposed effect is no longer watched, so it is not pending.
 *
 * @param watcher - The watcher of the effect.
 * @throws The error thrown by the effect.
 */
function runWatcher(watcher: Signal.subtle.Watcher): void {
  try {
    const pendings = watcher.getPending();
    for (let i = 0; i < pendings.length; i++) {
      pendings[i].get();
    }
  } finally {
    watcher.watch();
  }
}

/**
 * Empties the queue once every watcher in it ran.
 */
function resetQueue(): void {
  queue.length = 0;
  position = 0;
  scheduled = false;
}
