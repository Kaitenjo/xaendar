---
paths:
  - "packages/core/**"
  - "packages/compiler/**"
  - "packages/ssr/**"
  - "packages/ssr-compiler/**"
---

# Template runtime model

Compiled templates don't produce a virtual tree: they produce imperative JS that mounts real DOM nodes through `core`'s `_Context`/`mountNode`/`createAnchor` (`packages/core/src/utils/context/context.util.ts`).

- Each `_Context` is one lexical scope (root component, or a nested scope from `@for`/`@if`). It holds its declared identifiers, owned DOM nodes and cleanup callbacks, and looks up identifiers in parent scopes via `_parent`. Event listeners are closures emitted by the compiler, which make the whole call of the template.
- `createAnchor` places a `Comment` node as a stable insertion point for structural directives: dynamic content is always inserted via `insertBefore(node, anchor)`, independently of sibling constructs.
- `unlisten()` destroys a context: recursively disposes children, detaches listeners, removes owned nodes. This is what makes per-signal DOM updates surgical without a virtual-DOM diff.

The templates compiled for the server (`ssr-compiler`, run by `ssr`) keep the same scopes, one `_Context` per function, but write strings instead of nodes: each function takes `out`, the output buffer (`Array<string | Promise<ServerOutput>>`, the promises standing for the asynchronous structural directives), reads every signal once, and binds no listener. A construct the client renders must render the same HTML on the server: change both generators together.
