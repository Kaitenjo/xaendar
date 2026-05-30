# @xaendar/signals

A complete implementation of the [TC39 Signals proposal](https://github.com/tc39/proposal-signals) — reactive primitives (`State`, `Computed`, `Watcher`) plus a high-level `effect` helper, exposed as the `Signal` global namespace.

[![npm version](https://img.shields.io/npm/v/@xaendar/signals)](https://www.npmjs.com/package/@xaendar/signals)
[![license](https://img.shields.io/npm/l/@xaendar/signals)](https://opensource.org/licenses/MIT)

---

## Installation

```bash
npm install @xaendar/signals
```

---

## Overview

| Primitive | Description |
|-----------|-------------|
| `Signal.State` | Mutable reactive value — the source of truth |
| `Signal.Computed` | Lazy derived value — recomputed only when stale and read |
| `Signal.subtle.Watcher` | Low-level push observer — notified synchronously on change |
| `effect(fn)` | High-level helper — re-runs `fn` on every dependency change |
| `loadSignals()` | Bootstraps the `Signal` global — call once at application startup |

> **Granular updates** — signals form a fine-grained reactive graph. When a `State` value changes, **only the `Computed` nodes and `Watcher`s that transitively depend on that exact signal** are marked stale or notified. Every other node in the graph is left completely untouched, making updates **O(changed signals)** rather than O(application size).

---

## Initialization

Call `loadSignals()` **once** before using any signal primitive. It installs the `Signal` namespace on `globalThis`.

```ts
import { loadSignals } from '@xaendar/signals';

loadSignals();                      // production
loadSignals({ devMode: true });     // enables additional runtime checks
```

---

## `Signal.State`

The fundamental mutable reactive value.

```ts
const count = new Signal.State(0);

count.get();        // 0 — registers as a dependency if inside a Computed
count.set(1);       // propagates change to all dependents
count.set(1);       // no-op — Object.is(1, 1) === true, no propagation
```

### Options

```ts
const price = new Signal.State(9.99, {
  // Custom equality — prevent propagation when change is negligible
  equals(oldVal, newVal) {
    return Math.abs(oldVal - newVal) < 0.001;
  },
  // Called when the first Watcher/Computed subscribes to this signal
  watched() {
    console.log('price is now observed');
  },
  // Called when the last subscriber unsubscribes
  unwatched() {
    console.log('price is no longer observed');
  },
});
```

---

## `Signal.Computed`

A **lazy**, **cached** derived value. The callback is executed only when:
1. The computed value is explicitly read via `.get()`, **and**
2. At least one of its dependencies has changed since the last evaluation.

Between reads, the cached result is reused with zero cost.

```ts
const firstName = new Signal.State('Ada');
const lastName  = new Signal.State('Lovelace');

const fullName = new Signal.Computed(() =>
  `${firstName.get()} ${lastName.get()}`
);

fullName.get(); // 'Ada Lovelace'   — computed and cached

lastName.set('Byron');
fullName.get(); // 'Ada Byron'      — recomputed (lastName changed)
fullName.get(); // 'Ada Byron'      — served from cache
```

Dependencies are tracked **dynamically**: if a branch is not entered during an evaluation, signals inside that branch are not tracked.

```ts
const showTitle = new Signal.State(false);
const title     = new Signal.State('Dr.');

const label = new Signal.Computed(() =>
  showTitle.get() ? `${title.get()} ${firstName.get()}` : firstName.get()
);
// While showTitle is false, title is NOT a dependency of label.
```

---

## `effect(fn)`

Runs a side-effectful function and **automatically re-runs it** whenever any signal read inside it changes. Re-execution is scheduled as a **microtask**, so multiple synchronous signal writes are batched into a single re-run.

Returns a disposer that permanently stops the effect and releases all subscriptions.

```ts
import { effect } from '@xaendar/signals';

const count = new Signal.State(0);

const stop = effect(() => {
  console.log('count is', count.get());
});
// → logs: "count is 0"  (runs synchronously on creation)

count.set(1); // → microtask logs: "count is 1"
count.set(2); // → microtask logs: "count is 2"

stop();       // disposer — unsubscribes everything
count.set(3); // → silent
```

---

## `Signal.subtle.Watcher`

The low-level primitive used by frameworks to implement scheduling. The `notify` callback fires **synchronously** the first time a watched dependency changes after each `watch()` call.

```ts
const sig = new Signal.State(0);

const watcher = new Signal.subtle.Watcher(() => {
  // Called synchronously when sig (or any watched computed) changes.
  // No signal reads or writes are allowed here.
  console.log('something changed — schedule a re-read');
  queueMicrotask(() => {
    watcher.getPending().forEach(s => s.get()); // pull new value
    watcher.watch();                             // re-arm
  });
});

const derived = new Signal.Computed(() => sig.get() * 2);
watcher.watch(derived);
derived.get(); // initial evaluation

sig.set(5); // → "something changed — schedule a re-read"
```

---

## `Signal.subtle` utilities

| Function | Description |
|----------|-------------|
| `untrack(fn)` | Executes `fn` without registering any dependency |
| `currentComputed()` | Returns the `Computed` currently being evaluated, or `null` |
| `introspectSources(node)` | Lists the signals a `Computed` or `Watcher` depends on |
| `introspectSinks(node)` | Lists the dependents of a `State` or `Computed` |
| `hasSources(node)` | `true` if a `Computed` or `Watcher` has at least one source |
| `hasSinks(node)` | `true` if a `State` or `Computed` has at least one sink |

```ts
const a = new Signal.State(1);
const b = new Signal.Computed(() => a.get() + 1);

// Read b without tracking it as a dependency
const value = Signal.subtle.untrack(() => b.get());

Signal.subtle.introspectSources(b); // [a]
Signal.subtle.introspectSinks(a);   // [b]
Signal.subtle.hasSinks(a);          // false — b is not yet watched
```

---

## How the reactive graph works

```
Signal.State  ──────────►  Signal.Computed  ──────────►  Signal.subtle.Watcher
   (source)                   (derived)                      (observer)
     │                            │                               │
  .set(v)                    lazy .get()                    notify() callback
     │                            │                               │
     └── marks dependents stale ──┘     schedules microtask ──────┘
```

1. `State.set()` marks all direct `Computed` dependents as **dirty** and all reachable `Watcher`s as **pending**, invoking their `notify` callback synchronously.
2. A `Computed` is only re-evaluated when `.get()` is called on a stale node — **pull-based**, not push-based.
3. `Watcher.notify` is push-based and fires synchronously; the actual value read happens separately, in a microtask or scheduler tick.
4. Signals with no active `Watcher` are not tracked and can be garbage-collected independently.

---

## TypeScript

`SignalOptions` and `SignalEqual` are exported for use in custom signal subclasses.

```ts
import type { SignalOptions, SignalEqual } from '@xaendar/signals';

const myEquals: SignalEqual<number> = (a, b) => Math.abs(a - b) < 0.01;

const opts: SignalOptions<number> = {
  equals: myEquals,
  watched()   { /* ... */ },
  unwatched() { /* ... */ },
};
```

---

## Related packages

| Package | Description |
|---------|-------------|
| [`@xaendar/core`](https://www.npmjs.com/package/@xaendar/core) | Web Component base class, decorators, and `InputSignal` |
| [`@xaendar/types`](https://www.npmjs.com/package/@xaendar/types) | Shared TypeScript utility types |
| [`@xaendar/compiler`](https://www.npmjs.com/package/@xaendar/compiler) | Template compiler |

---

## License

MIT © [Kaitenjo](https://github.com/kaitenjo)
