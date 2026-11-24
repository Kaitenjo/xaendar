---
paths:
  - "packages/core/**"
  - "packages/compiler/**"
  - "packages/ssr/**"
  - "packages/ssr-compiler/**"
---

# Template runtime model

Compiled templates produce imperative JS mounting real DOM nodes through the scopes of core (`packages/core/src/utils/context/context.util.ts`). N.B. Most choices below save memory per instance (see `code-style.md`): keep them.

## Scopes

- A scope (`_Context`) is a plain array of the exact length of its layout (`_ScopeLayout`, a module constant shared by every instance), created by `_scope(parent, layout, nodeStrategy?, component?)`. Slots, in order: the header (`HEADER` = 5: `PARENT`, `PARENT_NODE`, `COMPONENT`, `CLEANUP`, `LAYOUT`; equal to the compiler's `SCOPE_HEADER`), variables (`@let`, `@for` variables, template parameters, element refs, a `@catch` error), top nodes (`layout.nodes`), binding sites (`layout.bindings`), inline-branch areas, then one container of `CONTAINER_SLOTS` (3) per block (`layout.containers`).
- `CLEANUP` holds what the compiler does not know (listeners, directives, components created by code, bindings of runtime scopes): one item, an array from the second.
- A block (`@if`, `@switch`, `@for`, `@defer`, `@try`, `@hydrate`, `@client`, `@render`, an element with structural directives) keeps its state in its container, with no object of its own: `CONTENT` (scope shown, rows of a `@for`, or the inline branch), `BRANCH` (branch index, `-1` before the first run, `null` for none) or `KEYS` (the `@for` keys; an array there tells a `@for`), `POSITION` (anchor, or the parent node for a last block). The `NodeBlock` of a strategy lives only during the synchronous first run.
- Never add a slot or a per-scope flag: the strategy of a scope being adopted lives in a `WeakMap` during hydration, the scopes visited by a refresh in a `Set` emptied at its end.
- An `@if`/`@switch` branch with no variables, blocks, directives or conditional bindings renders inline (`InlineBranch`): no scope, its nodes, bindings and cleanups in an area of the holding scope, emptied by `clearInline` in the order `clear` disposes a scope.
- No list of children: `clear`, `refresh` and `setNodeStrategy` walk the containers (`forEachChild(scope, visit, argument)`, `visit` a module function). Scopes the runtime creates outside containers (a conditional-binding branch, the scope of a `createComponent` component) are held by a `ScopeHolder` cleanup.
- Every function of `utils/context` takes the scope first: no methods, no lookup by name. Variables are `_read(context, depth, slot)`, `_set(context, depth, slot, value)`; `_declare` puts an `UNINITIALIZED` symbol in the slot of a ref or `@let` declared before its value, and `_read` then throws a `ReferenceError` naming it.
- An event handler is a module function bound by a `TemplateListener` with its context: it reads the variables' current values when the event fires.

## Bindings and refresh

- Bindings go through `_bindSite(scope, site, target?)` or, in runtime scopes, `_bindEffect(context, callback, …args, reads?)`: a module-level callback plus arguments, never a closure; the template expression is called `expression.call(context[COMPONENT], context)`. Configuration constants (`RenderElement`, `BlockConfig`, `ForConfig`, `RenderTemplateConfig`, `_Template`) are never written: state lives in run objects. A template takes no slot: its `@render` carries `depth`.
- First run, synchronous, in the `Computed` of an `EffectNode` (`_runBinding`): if it read a signal the node becomes the binding's effect, with its own `Watcher`, and is read again at once (a source may have changed during the run); otherwise it is dropped.
- A binding site's constant carries `update` (`(scope, target, site)` callback rerunning it), `effect` (slot of the effect, `null` while it reads no signal) and `target` (slot of its node, only when it reads variables). Bindings of runtime scopes stay `Binding` objects in `CLEANUP`.
- Variables are plain values, never signals. A scope whose variables change writes them with `update(scope, slot, value)` (`Object.is`) and calls `refresh(scope, ids)`: every binding of the scope and its descendants reading one of the identifiers reruns, deciding again whether it is an effect; errors are reported in a microtask; nested refreshes merge their ids; no scope is refreshed twice per pass. `_for` refreshes a reused item before moving its nodes, `_renderTemplate` an instance with its changed parameters, `_let` its scope. A signal change runs only the effects reading it, never a refresh.

## Nodes

- An element opens no context: its children render in its context (cleared with it); a child context exists only when their strategy differs or the compiler creates one.
- A scope tracks only its top nodes, all in one parent node (`PARENT_NODE`), each in the slot the compiler gave it (`trackNode`). `_for`, `_defer` and `createComponent` read those slots: never give a slot to a node inside an element. The server nodes a `@hydrate` keeps go in a scope of their exact count. `trackNode` throws in development (`DEV_MODE`) for another parent.
- `createAnchor` places a `Comment` before which dynamic content is inserted. The last block of its parent has none (`last: true`): it appends, and `ClaimNodes` adopts it from its opening marker alone (no closing marker). Only the compiler decides it, never in a `@for` body or template content.
- Helpers never create nodes: they ask `getNodeStrategy(context)` (`CREATE_NODES`, or `ClaimNodes` adopting the server HTML in a component's first render), and never branch on hydration: the strategy is chosen once per component and once per block (`adopt`/`adoptItems`), and `ClaimNodes.end` gives `CREATE_NODES` to the whole tree (`setNodeStrategy`). Elements are created in their constant's namespace (`createNamespacedElement`), a customized built-in element with its `is` (`RenderElement.is`, passed to `NodeStrategy.element`): created with `{ is }` plus the `is` attribute, adopted only where the server node has the same tag and `is`.
- Effects write the DOM only when the value differs (`writeAttribute`, the text compare), so adopted nodes are not written again.

## Clearing

- `clear(scope, detach = true)` removes the nodes, runs cleanups, disposes bindings, clears held scopes (a `ScopeHolder` always removes its nodes) and the scopes of its containers. Only the highest scope cleared removes nodes.
- `clear(scope, true, holder)` (only `_if`, `_for`, structural elements) keeps the top nodes registered with `onLeave` until their promise settles (`LeavingNode` in the holder, `LEAVE_TIMEOUT`); the rest is disposed at once. Leaving scopes are marked in a `WeakSet` (`markLeavingScope`), never a slot. Leaving nodes (`leavingNodes`) are skipped by `_for` and the queries.
- `CustomElement` clears its root with `clear(false)`: a component removed from the DOM is destroyed; reinserted, it empties its shadow root and renders again.

## Templates

- `_templateRef(context, depth, template)` is a frozen `{ template, context }`, one per template and scope (a `WeakMap`), so an input bound to it is not set again.
- `@render` of an expression (`ref`): `_runRender` keeps the template in `BRANCH`, replaces the instance when it changes, renders none for `null`/`undefined`, and passes over the server `<!---->`.
- Content templates are given to the element by `_setContentTemplates` (a `WeakMap`) before `connectChild`, like the inputs, so `@Query.contentTemplate` (a getter) sees them from the first render; `_ssrComponent` does the same, `_ssrIsland` rejects them. A standard `<template>` gets its static `content` only when empty.

## Hydration and SSR blocks

- `_hydrate`: with server HTML, the content stays inert (events recorded) until a trigger fires, then a `ClaimNodes(host, true)` adopts it and the events are replayed. Without server HTML the triggers do not count: the content renders once its modules load. `never` returns before arming and recording, for good; the template wins over the decorator (`ClaimNodes.mount`). A hydration that waited for a trigger is quiet (no mismatch warnings). An element with `data-xd-hydrate` waits for its trigger (`deferElementHydration`) unless inside a `@hydrate`.
- Prefetch loads are memoized and silent on failure; `hover` listens in the capture phase, armed before the recording stops events.
- Event contract: `eventContract` (`packages/ssr/src/utils/event-contract`) is an inline script needing no runtime, recording on the document and every shadow root, its queue on `window` under `_EVENT_CONTRACT_KEY` (declared in `packages/core/src/window.d.ts`: no cast). The first use stops it (`takeContractEvents`), or events would replay twice; `replayContractEvents` runs in a microtask after a hydration. `data-xd-submit` is the only mark in the HTML (preventing a submission cannot wait).
- `_client`: `replace` removes the server `@placeholder` and the content is created with `CREATE_NODES`, without warnings (`CREATE_NODES.replace` does nothing, so no helper branches).
- `data-xd-client` (`ssr: { render: false }`, and a customized built-in element without a template): no declarative shadow root; it waits for its parent like an adopted element, then renders with `CREATE_NODES` (nothing, without a template). A static component has no class in the browser; the interactive components it renders hold `data-xd-inputs` and hydrate as roots.
- A mismatch is recovered per block or element with `console.warn`, never by rendering the page again.

## `@try` and `@defer`

- `_try` renders its content inside a scope (`openTryScope`) collecting every context created meanwhile, components included; if the first render throws they are cleared in creation order and the `@catch` renders outside the scope. Only the first render is caught, the code of the components it creates included: inside the scope `_createElement` constructs with `new` and `connectChild` rethrows the component's connection error (`runConnection`). Not caught: components inserted by other code, constructors run during hydration. With server HTML: content adopted; a throw empties the rest with a warning; a server `@catch` is removed silently and the block renders from scratch.
- `_defer` renders the `@placeholder` (adopting the server one), arms the triggers in a microtask after the template renders (refs read then), then swaps parts with `CREATE_NODES`: `@loading` while `load()` runs, then the content, the `@error`, or the placeholder again with the error logged. `load` is memoized. Times: `placeholderMinimum`, `loadingAfter`, `loadingMinimum`. Targetless `visible`/`interaction`/`hover` watch the placeholder's elements. `interaction` listens in the bubbling phase, so placeholder listeners run first. Tests: blocks register a `DeferBlockFixture` once `@xaendar/core/testing` is imported; `manual` arms nothing.

## Inputs, attributes and styling

- Inputs are set by property name, never alias (`_setInput`, `_setExpressionInput`, `_setReactiveInput`, `_resetProperty`, all through `_updateInput`/`inputOf`, as `createComponent` and `renderToString` are: one check of the names); on an undefined element (or one of another library) the property is assigned and read at upgrade, while a directive or a constructed component not declaring the input throws. Inputs of host directives are set by the name they are exposed with into the directive (`_setExposedInput` and variants, `_resetExposedInput`); on an undefined element the value waits in a `WeakMap`, never on the element. `_setProperty` and variants only write attributes (`_attributeValue`: `null`/`undefined` remove, a boolean adds empty or removes, `"true"`/`"false"` on `aria-*` and enumerated attributes, else `String(value)`); an input found there throws.
- `@for` reads items via `_forItems` and passes `$count` to the track. With no items and an `@empty`, its container holds the `@empty` scope in `CONTENT` with `KEYS = null`.
- `class`/`style` merge key by key (`utils/styling-state`): template (level 0), directives (level 1, `DIRECTIVE_ORDER`: host directives in declaration order, then template ones by `order`, later wins), component (level 2). Per key the strongest source with an opinion wins; single keys beat strings within a level; `null`/`undefined` are no opinion, `false` an absent class.
- Sources writing different keys write directly, only changed keys, with no state. Each element keeps its sources in one record (`ElementSources`, a single `WeakMap` of `utils/element-sources`; a lone host run is kept as it is; none for an element its template alone writes): `_prepareStyling(element, config)` marks `class`/`style` when another source is possible (structural directives, a branch's `styling`, host class/style of the component or of the directives of the element and its branches, an undefined custom element or unregistered directive), so the template binding keeps itself there (`StylingSlot`: the binding, or `TemplateStyling` with its values), and host runs register there (`addHostRun`). A `StylingState` is created only when two sources have an opinion on the same key (`sharesNewKey`), or at once for a branch binding (no slot), and stays: an exact array, strongest first, `[binding, rank, values]` for the template, `[run, rank]` for a host run (`HostStylingRun.values`), rank `toRank(tier, order)`; opinions are computed from the values, never kept. Every write compares the DOM first (hydration writes nothing); a key loses its value only if the sources made it present before the change. The strings the slots keep are interned (`internStyling`, at most 512 texts), so equal compositions share one copy.
- Other attributes merge whole with the same levels (`utils/attribute-state`, `insertEntry`/`toRank` shared with styling): an `AttributeState` (`[name, attribute, rank, value…, run, rank…]` in the record) exists only for an attribute two levels write (`_prepareAttributes(element, config)` for `RenderElement.shared` names the component, the directives or, with `sharedAlways`, the directives of the branches declare, resolved at render; or a second host run); `false` is a value; an attribute is removed without opinions only if the sources gave it a text before. Only `shared` attributes look a state up; `attr.x` never looks an input up.
- Server: `_ssrStartTag` and the component writers create both styling states before the bindings (`_createStylingState`) and merge every attribute (`_mergeAttributes`: the template values wait in the record, a state is created only for an attribute a second level writes); host runs applied once are registered too; `ServerStyleDeclaration` parses and serializes like a browser.

## On the server

Templates compiled by `ssr-compiler` use the same scopes and layouts and core's functions, but write strings into `out` (`Array<string | Promise<ServerOutput>>`, promises for async structural directives), read every signal once and bind no listener. What the client renders must render the same HTML on the server: change both generators together.
