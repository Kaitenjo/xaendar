---
paths:
  - "packages/common/**"
---

# @xaendar/common

Shared runtime utilities/models with no framework dependency (string/indent/tag utils, a `stack` model, `SmallSet` and its functions (the item alone, an array of 2 to 32 items, a `Set` beyond, changed by functions returning the value to store and read through `forEachInSmallSet`, `findInSmallSet` and `smallSetToArray`, its items objects that are neither arrays nor `Set`s (`SmallSetItem`): the sources and sinks of the nodes of `signals`), the HTML serialization rules: escaping, void and raw text elements, `toSameOriginPath`: the path and query of a URL, which no base moves to another origin). No `@xaendar/*` dependencies. Used by `signals`, `core`, `compiler`, `ssr`, `ssr-compiler`, `build-tools`, `cli`.
