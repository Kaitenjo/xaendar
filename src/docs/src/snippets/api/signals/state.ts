/**
 * A state used directly, as the Signal.subtle API requires.
 */
const count = new Signal.State(0);
/**
 * A watcher told about the changes of count.
 */
const watcher = new Signal.subtle.Watcher(() => console.log('count changed'));

watcher.watch(count);
count.get();       // 0
count.set(1);      // logs "count changed", before set() returns
count.set(2);      // nothing is logged: the watcher notifies once, then waits
watcher.watch();   // re-arms the watcher
count.set(2);      // equal to the current value (Object.is): ignored, nothing is logged
count.set(3);      // logs "count changed"
