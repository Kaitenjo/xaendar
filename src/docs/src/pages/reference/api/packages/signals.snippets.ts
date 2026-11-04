import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet `computed.ts`, shown by the API reference of signals.
 */
export const COMPUTED: SourceFile = {
  name: 'computed.ts',
  lang: 'ts',
  code: `/**
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
total.get();     // 30: runs the callback again`
};

/**
 * The snippet `equals.ts`, shown by the API reference of signals.
 */
export const EQUALS: SourceFile = {
  name: 'equals.ts',
  lang: 'ts',
  code: `import { signal } from '@xaendar/core/signals';
import type { User } from './user';

/**
 * The selected user: another object with the same id is not a change.
 */
const selected = signal<User>({ id: 1, name: 'Ada' }, {
  equals: (current: User, next: User) => current.id === next.id
});

selected.set({ id: 1, name: 'Ada Lovelace' });  // equal: ignored, selected() is still the first object
selected.set({ id: 2, name: 'Grace Hopper' });  // a change: stored, and the dependents are told`
};

/**
 * The snippet `extract-signal-type.ts`, shown by the API reference of signals.
 */
export const EXTRACT_SIGNAL_TYPE: SourceFile = {
  name: 'extract-signal-type.ts',
  lang: 'ts',
  code: `import { computed, signal } from '@xaendar/core/signals';
import type { ExtractSignalType } from '@xaendar/signals';

/**
 * The filters of a list.
 */
const filters = signal({ query: '', done: false });
/**
 * How many filters are set.
 */
const active = computed(() => Number(filters().query !== '') + Number(filters().done));

/**
 * { query: string; done: boolean }, taken from the signal instead of written again.
 */
type Filters = ExtractSignalType<typeof filters>;
/**
 * never: a computed signal has no set(), so it is not a Signal.State.
 */
type Active = ExtractSignalType<typeof active>;

/**
 * Creates the filters showing every item.
 *
 * @returns The default filters.
 */
function defaultFilters(): Filters {
  return { query: '', done: false };
}

filters.set(defaultFilters());`
};

/**
 * The snippet `introspection.ts`, shown by the API reference of signals.
 */
export const INTROSPECTION: SourceFile = {
  name: 'introspection.ts',
  lang: 'ts',
  code: `/**
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
Signal.subtle.introspectSinks(price);       // []: nothing watches total, so it is not a sink of its sources

watcher.watch(total);
Signal.subtle.hasSinks(total);              // true
Signal.subtle.introspectSinks(price);       // [total]: watched, total is linked to its sources
Signal.subtle.introspectSources(watcher);   // [total]

watcher.unwatch(total);
Signal.subtle.introspectSinks(price);       // []: total lost its last sink and left its sources`
};

/**
 * The snippet `signal-equal.ts`, shown by the API reference of signals.
 */
export const SIGNAL_EQUAL: SourceFile = {
  name: 'signal-equal.ts',
  lang: 'ts',
  code: `import { signal } from '@xaendar/core/signals';
import type { SignalEqual } from '@xaendar/signals';
import type { User } from './user';

/**
 * Two users are equal when they have the same id. SignalEqual types the values as any: the annotations check them.
 */
export const sameUser: SignalEqual<User> = (current: User, next: User) => current.id === next.id;

/**
 * The user being edited.
 */
const edited = signal<User>({ id: 1, name: 'Ada' }, { equals: sameUser });`
};

/**
 * The snippet `signals-setup.ts`, shown by the API reference of signals.
 */
export const SIGNALS_SETUP: SourceFile = {
  name: 'signals-setup.ts',
  lang: 'ts',
  code: `// Listed in the setupFiles of the Vitest configuration: it runs before every spec file, and before its imports
import { loadSignals } from '@xaendar/signals';

loadSignals();`
};

/**
 * The snippet `state-wrapper.ts`, shown by the API reference of signals.
 */
export const STATE_WRAPPER: SourceFile = {
  name: 'state-wrapper.ts',
  lang: 'ts',
  code: `import { signal } from '@xaendar/core/signals';

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
watcher.watch(total);`
};

/**
 * The snippet `state.ts`, shown by the API reference of signals.
 */
export const STATE: SourceFile = {
  name: 'state.ts',
  lang: 'ts',
  code: `/**
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
count.set(3);      // logs "count changed"`
};

/**
 * The snippet `watched-clock.ts`, shown by the API reference of signals.
 */
export const WATCHED_CLOCK: SourceFile = {
  name: 'watched-clock.ts',
  lang: 'ts',
  code: `import { signal } from '@xaendar/core/signals';

/**
 * The timer refreshing the clock, while something depends on it.
 */
let timer: ReturnType<typeof setInterval> | undefined;

/**
 * The current time, refreshed every second only while something depends on it.
 */
export const now = signal(new Date(), {
  watched() {
    // Signals are frozen here: the timer writes later, never during the callback
    timer ??= setInterval(() => now.set(new Date()), 1000);
  },
  unwatched() {
    // Nothing depends on the clock any more: the timer stops until watched runs again
    clearInterval(timer);
    timer = undefined;
  }
});`
};

/**
 * The snippet `watcher-effect.ts`, shown by the API reference of signals.
 */
export const WATCHER_EFFECT: SourceFile = {
  name: 'watcher-effect.ts',
  lang: 'ts',
  code: `/**
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
count.set(2);   // one run for both, in a microtask: logs "count is 2"`
};
