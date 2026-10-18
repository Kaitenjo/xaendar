/**
 * A state used directly, as the Signal.subtle API requires.
 */
const count = new Signal.State(0);
/**
 * A watcher told about every change of count.
 */
const watcher = new Signal.subtle.Watcher(() => console.log('count changed'));

watcher.watch(count);
count.get();    // 0
count.set(1);   // logs "count changed", before set() returns
count.set(1);   // equal to the current value (Object.is): ignored, nothing is logged
