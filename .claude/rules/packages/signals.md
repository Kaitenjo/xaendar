---
paths:
  - "packages/signals/**"
---

# @xaendar/signals

Full implementation of the TC39 Signals proposal (`Signal.State`, `Signal.Computed`, `Signal.subtle.Watcher`, `effect()`), installed as the global `Signal` namespace via `loadSignals()`. The reactivity primitive everything else builds on. Depends on `common`, `types` and the peer `internals` (`SmallSet`).

It follows the proposal and knows nothing of core: change it only for bugs of the polyfill. When the signals of core (`signal()`, `computed()`, inputs, models, queries) do not fit `Signal.subtle` or `instanceof`, adapt them in `packages/core/src/signals`.
