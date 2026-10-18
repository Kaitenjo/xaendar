/**
 * A source.
 */
const price = new Signal.State(10);
/**
 * Another source.
 */
const quantity = new Signal.State(2);
/**
 * Derived from both: the callback runs at the first get(), not here.
 */
const total = new Signal.Computed(() => price.get() * quantity.get());
/**
 * Gives total a sink, so that it caches its value between reads.
 */
const watcher = new Signal.subtle.Watcher(() => {});

watcher.watch(total);
total.get();     // 20: runs the callback, which records price and quantity as its sources
total.get();     // 20: cached, the callback does not run
price.set(15);   // marks total stale and notifies the watcher, without running the callback
total.get();     // 30: runs the callback again
