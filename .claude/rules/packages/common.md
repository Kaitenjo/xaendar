---
paths:
  - "packages/common/**"
---

# @xaendar/common

Runtime utilities with no `@xaendar/*` dependency, used by `signals`, `core`, `compiler`, `ssr`, `ssr-compiler`, `build-tools`, `cli`: string/indent/tag utils, a `stack` model, the HTML serialization rules (escaping, void and raw text elements), `toSameOriginPath` (path and query of a URL, which no base can move to another origin), `parseKeyEvent`/`KEY_MODIFIERS` (shared by the compiler, `@HostListener` and language-core).

`SmallSet` holds the sources and sinks of the `signals` nodes: the item alone, an array of 2–32 items, a `Set` beyond. Its functions return the value to store; read it with `forEachInSmallSet`, `findInSmallSet`, `smallSetToArray`. Items (`SmallSetItem`) are objects that are neither arrays nor `Set`s.
