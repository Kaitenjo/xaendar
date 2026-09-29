---
paths:
  - "packages/core/**"
---

# @xaendar/core

Runtime primitives for authoring components. Depends only on `signals`, `types`: **not** on `compiler`.

- `CustomElement`: attaches Shadow DOM, wires `attributeChangedCallback`/`connectedCallback`/`disconnectedCallback`.
- Decorators `@WebComponent`/`@Property`/`@Event`, and `InputSignal`. Uses stage-3 (`accessor`) decorators, not `experimentalDecorators`.
- Template-runtime helpers under `src/utils/` (`context`, `for`, `if`, `switch`, `render-*`) called by *compiler-generated* render code. The compiler targets this runtime shape without any build-time dependency edge.
