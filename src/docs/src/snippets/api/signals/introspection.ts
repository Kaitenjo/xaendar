/**
 * A source.
 */
const price = new Signal.State(10);
/**
 * Another source.
 */
const quantity = new Signal.State(2);
/**
 * Derived from both.
 */
const total = new Signal.Computed(() => price.get() * quantity.get());
/**
 * A watcher, to make total live.
 */
const watcher = new Signal.subtle.Watcher(() => {});

Signal.subtle.hasSources(total);            // false: total has not been evaluated yet
total.get();
Signal.subtle.introspectSources(total);     // [price, quantity]
Signal.subtle.introspectSinks(price);       // [total]: the evaluation linked total to its sources

watcher.watch(total);
Signal.subtle.hasSinks(total);              // true
Signal.subtle.introspectSources(watcher);   // [total]

watcher.unwatch(total);
Signal.subtle.introspectSinks(price);       // []: total lost its last sink and left its sources
