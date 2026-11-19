---
paths:
  - "packages/common/**"
---

# @xaendar/common

General utilities with no `@xaendar/*` dependency, for the packages and for the applications: the `Stack` model, `SmallSet` and its functions, object helpers (`keys`, `entries`, `values`, `isEmpty`, `isNonEmpty`), `removeItem`, `slice`, `toKebabCase`/`toPascalCase`, `indent`, `toSameOriginPath` (path and query of a URL, which no base can move to another origin; imported by the `server.ts` that `xd new --ssr` writes). Every export is documented on the site.

`SmallSet` holds the sources and sinks of the `signals` nodes: the item alone, an array of 2–32 items, a `Set` beyond. Its functions return the value to store; read it with `forEachInSmallSet`, `findInSmallSet`, `smallSetToArray`. Items (`SmallSetItem`) are objects that are neither arrays nor `Set`s.

Logic belonging to Xaendar itself (rules of the templates, of the runtime or of the build that several packages must apply alike) goes in `@xaendar/internals`, never here.
