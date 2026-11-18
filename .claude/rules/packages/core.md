---
paths:
  - "packages/core/**"
---

# @xaendar/core

Runtime primitives for authoring components, plus the runtime of compiled templates (`src/utils/`, see `template-runtime.md`). Depends on `common`, `signals`, `types`: **not** on `compiler`.

## Components and directives

- `CustomElement` attaches Shadow DOM and keeps `connectedCallback`/`disconnectedCallback`/`connectedMoveCallback` private (no `attributeChangedCallback`: inputs are not attributes). It and `CustomDirective` have `effect()` and `createComponent()` (options typed `CreateComponentOptionsWithOptionalTarget`: without `target` the component goes into the host element), bound to their lifecycle through `_getComponentRuntime()`, which `@xaendar/ssr` swaps with `_setComponentRuntime()` on the server (effects off, components constructed without rendering): never call `effect`/`_createComponent` directly.
- Stage-3 `accessor` decorators, not `experimentalDecorators`. `@Property`, `@Event` and every `@Query` (`lazyQuery`) create an instance's signal or `Output` lazily, in the `get` they return, and keep it in the accessor's private storage (`target.get`/`target.set`): never in a decorator variable, which runs once per class and would be shared by every instance. `@Property`'s `init` allocates only for an own property assigned before the upgrade (moved into the input, since it would shadow the accessor). `@Model` creates its model in `init`.
- A query signal registers its connection hooks when created, and starts at once when created after the element ran them (`[IS_RENDERED]()`).
- A model (`signals/model`) shares prototypes instead of fields (per-accessor prototype from `createModelPrototype` → `MODEL_PROTOTYPE` → the input prototype), so it costs what an input costs; `set` dispatches `<name>Change` (`toModelChangeEvent` of `@xaendar/common`, shared with the compiler) only when the value changes, quiet with `INPUT_SIGNAL_SET_SYMBOL`.
- `@HostListener` reads key events with `parseKeyEvent` of `@xaendar/common`; `_isKey` (`utils/key-event`, also called by the compiled handlers) matches `event.key`/`event.code` in lowercase and the modifiers exactly. `createComponent` types model change events with `ModelChangeListeners`, a mapped type over event names (an `as` clause over `keyof Target` loses the listener types).
- `onLeave(element, handler)` goes through `_ComponentRuntime.onLeave` (`registerLeave` in the browser, no-op on the server), sets `LEAVE_HANDLER` and marks the scope of the starting directive (`startDirective`); see `template-runtime.md`. `CustomDirective.afterRender` goes through `[DIRECTIVE_AFTER_RENDER]` (same `startDirective` wrapping): `CustomElement` calls it on its host directives at the end of `_connect`, after `_bindHost` and before its own `afterRender`; `bindDirectives` calls it right after `DIRECTIVE_CONNECT`, the element having rendered by then.
- The directive registry lets a class with the same name replace the registered one (modules re-evaluated by the dev server).

## Contract with `@xaendar/ssr`

- `@xaendar/ssr` imports `_`-prefixed internals (`_Context`, `_PARENT`/`_COMPONENT`, `_selectBranch`, `_resolveDirective`, `_applyHostAttributes`, `_ComponentRuntime`, `_SSR_MARKERS`, the `_*_ATTRIBUTE` constants, `_RECORDED_EVENTS`, `_EVENT_CONTRACT_KEY`, `_stringifyState`, `_encodeTrackKey`) and the `Render*` types: the two versions are pinned together (exact peerDependency).
- `CustomElement` assigns `data-xd-inputs` before `onInit`; `getTransferState` reads through `_ComponentRuntime` (page scripts in the browser, request state on the server).
- Hydration: a declarative shadow root is kept (never `attachShadow` on it, never `attachInternals`) and rendered with `claimShadowRoot`. An element inside another component's shadow root waits for that component's `ClaimNodes.mount` to call its `[HYDRATE]`, unless it holds `data-xd-inputs` (interactive child of a static component); both wait for a `data-xd-hydrate` trigger (`utils/hydration-triggers`), recording and then replaying events. `data-xd-client` (`ssr: { render: false }`) has no shadow root and creates its content after waiting.
- `CustomElement` connects through `runConnection`, so a component's error inside a `@try` is thrown by the template. `_defer` works in any project, with `@hydrate`'s triggers.
- `@xaendar/core/testing` (`src/testing/index.ts`, a `secondaryEntryPoints` sharing core's state) exports `getDeferBlocks`, `setDeferBlockBehavior` and their types; importing it sets `playthrough`, so pages outside tests register no block.
