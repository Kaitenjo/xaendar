/**
 * Runs a function now, and again in a microtask after the signals it read change.
 *
 * @param run - The function to run.
 * @returns A function stopping it.
 */
function watchEffect(run: () => void): () => void {
  const computed = new Signal.Computed(run);
  let scheduled = false;
  const watcher = new Signal.subtle.Watcher(() => {
    // Signals are frozen here: schedule the work, once however many changes arrive
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        const pending = watcher.getPending();
        for (let i = 0; i < pending.length; i++) {
          pending[i].get();
        }
        // A watcher notifies once: watch() re-arms it for the next change
        watcher.watch();
      });
    }
  });

  watcher.watch(computed);
  // A computed signal records its sources when it is evaluated: until then, nothing can make it stale
  computed.get();

  return () => watcher.unwatch(computed);
}

/**
 * A source.
 */
const count = new Signal.State(0);
/**
 * Stops the effect, when called.
 */
const stop = watchEffect(() => console.log('count is', count.get()));   // logs "count is 0" now

count.set(1);
count.set(2);   // one run for both, in a microtask: logs "count is 2"
