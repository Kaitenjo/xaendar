---
paths:
  - "packages/core/**"
  - "packages/compiler/**"
---

# Template runtime model

Compiled templates don't produce a virtual tree: they produce imperative JS that mounts real DOM nodes through `core`'s `_Context`/`mountNode`/`createAnchor` (`packages/core/src/utils/context/context.util.ts`).

- Each `_Context` is one lexical scope (root component, or a nested scope from `@for`/`@if`). It holds its declared identifiers, owned DOM nodes and cleanup callbacks, and looks up identifiers/event handlers in parent scopes via `_root`/`_parent`.
- `createAnchor` places a `Comment` node as a stable insertion point for structural directives: dynamic content is always inserted via `insertBefore(node, anchor)`, independently of sibling constructs.
- `unlisten()` destroys a context: recursively disposes children, detaches listeners, removes owned nodes. This is what makes per-signal DOM updates surgical without a virtual-DOM diff.
