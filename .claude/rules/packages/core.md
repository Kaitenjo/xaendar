---
paths:
  - "packages/core/**"
---

# @xaendar/core

Runtime primitives for authoring components. Depends on `common`, `signals`, `types`: **not** on `compiler`.

- `CustomElement`: attaches Shadow DOM and keeps `connectedCallback`/`disconnectedCallback`/`connectedMoveCallback` private (no `attributeChangedCallback`: inputs are not attributes). It and `CustomDirective` have `effect()` and `createComponent()`, bound to their lifecycle.
- Decorators `@WebComponent`/`@Directive`/`@Property`/`@Event`/`@Query`/`@HostProperty`/`@HostEvent`, and `InputSignal`. Uses stage-3 (`accessor`) decorators, not `experimentalDecorators`.
- Template-runtime helpers under `src/utils/` (`context`, `for`, `if`, `switch`, `render-*`) called by *compiler-generated* render code. The compiler targets this runtime shape without any build-time dependency edge.
