---
paths:
  - "packages/core/**"
---

# @xaendar/core

Runtime primitives for authoring components. Depends on `common`, `signals`, `types`: **not** on `compiler`.

- `CustomElement`: attaches Shadow DOM and keeps `connectedCallback`/`disconnectedCallback`/`connectedMoveCallback` private (no `attributeChangedCallback`: inputs are not attributes). It and `CustomDirective` have `effect()` and `createComponent()`, bound to their lifecycle. Both go through `_getComponentRuntime()`, which `@xaendar/ssr` swaps with `_setComponentRuntime()` while it renders on the server (effects off, components constructed without rendering): never call `effect`/`_createComponent` directly from them.
- Decorators `@WebComponent`/`@Directive`/`@Property`/`@Event`/`@Query`/`@HostProperty`/`@HostEvent`, and `InputSignal`. Uses stage-3 (`accessor`) decorators, not `experimentalDecorators`.
- Template-runtime helpers under `src/utils/` (`context`, `for`, `if`, `switch`, `render-*`) called by *compiler-generated* render code. The compiler targets this runtime shape without any build-time dependency edge.
- `@xaendar/ssr` imports some `_`-prefixed internals (`_Context`, `_selectBranch`, `_resolveDirective`, `_applyHostProperties`, `_ComponentRuntime`) and the `Render*` binding types: they are part of the contract between the two packages, whose versions are pinned together (exact peerDependency). The directive registry lets a class with the same name replace the registered one, as a module evaluated again by the dev server defines it.
