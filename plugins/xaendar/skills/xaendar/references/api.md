# Public API

Every export applications use, by module. Symbols exported only for the compiled templates (`_Context`, `_if`, `_renderElement`, …) are omitted: never import them.

## `@xaendar/core`

### WebComponent (decorator)

```ts
@WebComponent({ selector: 'x-y', hostDirectives?: [Tip, { directive: Tip, properties?: [{ name: 'text', alias: 'hint' }], events?: ['shown'] }], ssr?: { hydrate?: 'load' | 'idle' | 'visible' | 'interaction' | 'hover' | 'never', render?: false, static?: false }, styleUrl?: './x.css', templateUrl: './x.xd.component.html' })
```

Defines a class extending CustomElement as a custom element, with its compiled template and its stylesheet (`.css`, `.scss`, `.sass` or `.less`). The options must be string literals; `hostDirectives` an array literal. The class must be declared in a file ending with `.xd.component.ts`; the decorator is not inherited.

`hostDirectives` lists custom directives applied to every instance of the component, on its own element. An entry is the class of the directive, or an object with the class (`directive`) and the `properties` and `events` of the directive the component exposes, each as `'name'` or as `{ name, alias }`: an exposed input is bound from the templates using the component, an exposed output is dispatched on it. The events not exposed are not dispatched. They belong to the class declaring them: a subclass with its own @WebComponent does not inherit the ones of its parent. Templates cannot name the class, so expose the instance as a member (`public readonly tip = this.hostDirectives.get(Tip)`, a field of the subclass) to use it in the template.

`ssr.hydrate` decides when the elements of the component rendered on the server hydrate: `load` (default) as soon as they can, `idle`, `visible` (in the viewport), `interaction` (first event on them), `hover` (pointer over them, or focus entering them), `never` (they stay the HTML of the server for good, no event recorded; instances the browser creates render as usual). Until then they show the HTML of the server and the events on them are recorded, then replayed. A `@hydrate` block holding the element decides in its place; a component rendered in the browser renders at once. `ssr.static: false` keeps a component in the bundle of the browser where the build would find it static; `true` is not a value. `ssr.render: false` renders the component only in the browser, as a `@client` around each of its elements: the server writes its empty element, runs none of its code and does not evaluate its module for the templates rendering it; it takes no `hydrate: 'never'`. `ssr` must be an object literal and `render` the literal `false`, since the plugin reads them from the source code. Declaring any of these keeps the component in the bundle.

### Property (decorator)

```ts
@Property<InputSignal<T, In>>(defaultValue?, { alias?, transform?: (value: In) => T, equals?, watched?, unwatched? }) accessor name!: InputSignal<T, In>
```

Declares an input. The accessor holds an InputSignal, set by the bindings of the parent template (or by `createComponent`) and by assignments to the property of the element from outside (`element.name = value`, also before the element is defined), never by attributes. Templates, `createComponent` and `renderToString` bind an input declaring `alias` only by its alias, which the accessor declares in its type (`Aliased<InputSignal<T>, 'alias'>`, or the decorator does not compile); `element.name` from outside uses the name of the property. `transform` converts every bound or assigned value, not the default; templates, `createComponent` and `renderToString` take the type it accepts, `In`, which the accessor declares (`InputSignal<number, string>`) when it differs from `T`, or the decorator does not compile. `equals` compares the transformed value with the current one (`Object.is` by default). A conditional binding that stops holding resets the input to its default.

### Property.required (decorator)

```ts
@Property.required({ alias?, transform?, equals? }) accessor name!: InputSignal<T, In>
```

Declares an input that every use of the component must bind, in every branch of a conditional binding. Checked at compile time in the templates; `createComponent` throws when no group without `condition` binds it, `renderToString` when its `inputs` leave it out.

### Event (decorator)

```ts
@Event({ bubbles?, cancelable?, composed? }) accessor name!: Output<T>
```

Declares an output. emit(detail?, options?) dispatches a CustomEvent named after the accessor on the host element. The options of an emission are an EventOptions instance (`new EventOptions({ composed: false })`), and a single argument is taken for the options only when it is one: any other value, a plain object with option keys included, is the detail. The options of the decorator are a plain object.

### Query (decorator)

```ts
@Query('.selector' | ComponentClass | DirectiveClass) accessor name!: QuerySignal<E | null>
```

The first element of the shadow root matching a selector or a component class, kept up to date as a signal. With the class of a custom directive it holds the instance of the directive applied to an element (with `@@selector` or as a host directive), not the element.

With `{ read }` (single-element variants only, not `.all`): `@Query('.help', { read: TooltipDirective })` holds the directive applied to the first matching element that has it, `@Query<HTMLButtonElement>(TooltipDirective, { read: 'element' })` the element a directive is applied to. `Query.required`, `Query.ref`, `Query.ref.required`, `Query.content` and `Query.content.required` take the option too (the content ones next to `descendants`).

### Query.required (decorator)

```ts
@Query.required('.selector' | ComponentClass | DirectiveClass) accessor name!: QuerySignal<E>
```

Like Query, for an element that is always there: no null in the type, and reading it throws when no element matches.

### Query.all (decorator)

```ts
@Query.all('.selector' | ComponentClass | DirectiveClass) accessor name!: QuerySignal<E[]>
```

Every element of the shadow root matching a selector or a component class, or every instance of a directive class.

### Query.ref (decorator)

```ts
@Query.ref<E>('name') accessor name!: QuerySignal<E | null>
@Query.ref.required<E>('name') accessor name!: QuerySignal<E>
@Query.ref.all<E>('name') accessor name!: QuerySignal<E[]>
```

The element of the template named by the element ref `#name`, without the `#`; `.all` holds one per row of the `@for` declaring it, `.required` drops null and throws when no element has the ref. Only the template of the component: never the content passed to it.

### Query.content (decorator)

```ts
@Query.content('.selector' | ComponentClass | DirectiveClass, { descendants?, read? }) accessor name!: QuerySignal<E | null>
```

The first element of the content passed to the component (its light DOM) that matches a selector or a component class, as Angular's `contentChild`: among the children and their descendants (`descendants: false`: the children only), in document order. The content counts whether a slot renders it or not; `slot` is an attribute like any other (`'[slot="footer"]'`). Never finds the fallback of the slots, nor the content another component forwards through a `<slot>` (it finds the `<slot>` element). Updated when elements are added or removed, not on attribute changes.

### Query.content.required (decorator)

```ts
@Query.content.required('.selector' | ComponentClass | DirectiveClass, { descendants?, read? }) accessor name!: QuerySignal<E>
```

Like Query.content, for content that is always there: no null in the type, and reading it throws when no element matches.

### Query.content.all (decorator)

```ts
@Query.content.all('.selector' | ComponentClass | DirectiveClass, { descendants? }) accessor name!: QuerySignal<E[]>
```

Every child of the component matching a selector or a component class, in document order, as Angular's `contentChildren`; with `descendants: true`, every matching element of the content at any depth.

### HostProperty (decorator)

```ts
@HostProperty('aria-checked' | 'class.on') field = value | signal(…); get member(): T; accessor name!: InputSignal<T>
```

Binds an attribute, or a class (`'class.name'`), of the host element: the component itself, or the element a custom directive is applied to (not on a StructuralDirective: type error). Decorates a non-static field, getter or accessor, `@Property` ones included to reflect an input. The member is read in an effect each time the element connects (a directive: after its onInit; a component: after the render and the query hooks, before afterRender): written again when a signal it reads changes, otherwise once. A member holding a signal or any function is called. `null`, `undefined`, `false` remove the attribute, `true` writes it empty, other values `String(value)`: ARIA states need `String(bool)`. `class.name` toggles the class while the value is truthy and survives writes of `class`. Removed at disconnection / destruction. The parent binding the same attribute: last write wins. Throws for an empty name, `'class.'` or a static member.

### HostEvent (decorator)

```ts
@HostEvent('keydown', { capture?, once?, passive? }) method(event?: KeyboardEvent): void
```

Listens to an event of the host element (component, or element of a custom directive; not StructuralDirective) with a non-static method taking no parameter or the event, typed as the method declares it. Added at connection / directive start (same timing as HostProperty), removed at disconnection / destruction. Hears native events, events dispatched on the element (the outputs of the component and of its directives included) and events bubbling from its content; from the shadow root only composed events (`click`, `keydown`, not `change` or child outputs). Replaces `addEventListener` in onInit + `removeEventListener` in onDestroy for the host. Throws for an empty name or a static method.

### Directive (decorator)

```ts
@Directive({ selector: 'exName' })
```

Registers a class extending CustomDirective or StructuralDirective under a selector, used as @@selector or *selector.

### CustomElement (class)

```ts
class X extends CustomElement { hostDirectives: HostDirectives; onInit?(); afterRender?(); onDestroy?(); effect(fn, options?): () => void; createComponent(Class, options): ComponentRef<Class> }
```

Base class of components: an open shadow root, the lifecycle hooks, and effects disposed at disconnection. `hostDirectives` is a map from the class of each host directive to its instance (`this.hostDirectives.get(Tip)`, typed): the directives start before `onInit` and stop after `onDestroy`. `connectedCallback` and `disconnectedCallback` belong to the base class: never declare them. Disconnection runs `onDestroy`, disposes the effects, removes the template and destroys the components created with `createComponent`.

### createComponent (method of CustomElement and CustomDirective)

```ts
this.createComponent(ToastComponent, { target: Element, properties?: [{ input: () => value, condition?: () => boolean }], events?: [{ output: (event: CustomEvent<T>) => void, click: (event: MouseEvent) => void, condition? }], directives?: [Directive | { directive, condition?, properties?, events? }], content?: Node[] })
```

Creates a component in code and appends it to `target`, bound as a tag of a template is: the inputs are set before the element is appended (its `onInit` reads them), then the directives are applied and the content appended (projected through its slots; a `DocumentFragment` gives its nodes). Getters and conditions run in effects. A group with a `condition` is bound only while it holds; when it stops, its inputs go back to their defaults and its listeners stop. Throws for a class without `@WebComponent`, an input bound by two groups, a structural directive, or a directive that is already a host directive of the component. The component belongs to its creator: it is destroyed when the creator is disconnected (a directive: stops), after `onDestroy`. Callable from the constructor, a field or `onInit`; the creation is not tracked by an enclosing effect. In a directive, call it from `onInit`. A getter returning a string literal for a union-typed input of a *directive* needs `as const`.

### ComponentRef (type)

```ts
{ readonly element: Component; destroy(): void }
```

The result of createComponent: the element, already in the DOM, and the function destroying it earlier (removes the element, unbinds its inputs and events, destroys its directives; the content nodes leave with the element). Calling it again, or after the creator is gone, does nothing. Removing the element with the DOM APIs leaves its bindings alive: call `destroy()`.

### HostDirectives (type)

```ts
ReadonlyMap<Constructor<CustomDirective>, CustomDirective> & { get<D>(directive: Constructor<D>): D | undefined }
```

The type of `hostDirectives`: the instances exist with the element, so a field initializer can read them. A template cannot name a class: expose the instance in a public field.

### CustomDirective (class)

```ts
class X extends CustomDirective<E> { element: E; onInit?(); onDestroy?(); effect(fn, options?): () => void; createComponent(Class, options): ComponentRef<Class>; dispatchEvent(event: CustomEvent): boolean }
```

Base class of the directives acting on the element they are applied to. `element` is set after the constructor: use it from `onInit`, which runs once the inputs are bound and the element is in the document, before its children are rendered. `onDestroy` runs when the element leaves the template or a conditional branch applying the directive is left (a new instance is created when it is taken again). Outputs are dispatched on the element; `dispatchEvent` returns `false` when a listener canceled a cancelable event.

### StructuralDirective (class)

```ts
class X extends StructuralDirective { shouldRender(): boolean | Promise<boolean> }
```

Base class of the directives deciding whether the element they are applied to is rendered. `shouldRender` runs in an effect: it is evaluated again when a signal read before its first `await` changes, and the element exists while every structural directive on it returns `true`. A pending promise keeps the current state, and only the latest evaluation decides. No element, no outputs, no hooks, no `@HostProperty`/`@HostEvent`, and no conditional inputs.

### Output (class)

```ts
class Output<T = void> { emit(...args: T extends void ? [options?: EventOptions] : [detail: T, options?: EventOptions]): void }
```

The class of an @Event accessor: emit dispatches a CustomEvent named after the accessor on the host element. Without a type argument the event carries no detail: `$event` is a `CustomEvent<null>`.

### EventOptions (class)

```ts
new EventOptions({ bubbles?: boolean, cancelable?: boolean, composed?: boolean })
```

The options of an output: a plain object in @Event, an EventOptions instance in a single emit (merged over the ones of the decorator). By default an event neither bubbles nor leaves the shadow root.

### WebComponentOptions (type)

```ts
{ selector: string; hostDirectives?: Array<Constructor<CustomDirective> | HostDirectiveOptions>; ssr?: { hydrate?: 'load' | 'idle' | 'visible' | 'interaction' | 'hover' | 'never'; render?: false; static?: false }; styleUrl?: string; templateUrl: string }
```

The options of @WebComponent.

### HostDirectiveOptions (type)

```ts
{ directive: Constructor<CustomDirective>; properties?: HostDirectiveMember[]; events?: HostDirectiveMember[] }
```

A host directive of a component, with the properties and the events of the directive it exposes.

### HostDirectiveMember (type)

```ts
string | { name: string; alias: string }
```

A property or an event of a host directive exposed on its component: its name, or the name with the alias it is exposed with.

### DirectiveOptions (type)

```ts
{ selector: string }
```

The options of @Directive.

### getTransferState (function)

```ts
getTransferState<Value>(key: string): Value | undefined
```

Reads a value of the transfer state of a page rendered on the server, with the same code on both sides: on the server, the one of the key in the `state` `renderToString` renders the page with (it belongs to the request); in the browser, the one the server wrote into the page. `undefined` when the page was not rendered on the server (a navigation in the browser) or the key is missing: the code then loads the data itself. The values stay until the page reloads.

## `@xaendar/core/signals`

### signal (function)

```ts
signal<T>(value: T, { equals? }?): Signal<T>
```

A writable signal: read it by calling it, write it with set or update.

### computed (function)

```ts
computed<T>(fn: () => T, { equals? }?): Computed<T>
```

A signal derived from others, evaluated lazily and cached until a dependency changes.

### effect (function)

```ts
effect(fn: () => void, { onBeforeRun?, onAfterRun?, onCleanup? }?): () => void
```

Runs a function now, and again in a microtask after the signals it read change. Returns the function disposing it.

### untracked (function)

```ts
untracked<T>(fn: () => T): T
```

Runs a function without tracking the signals it reads.

### Signal (type)

```ts
Signal<T> = { (): T; get(): T; set(value: T): void; update(fn: (prev: T) => T): void }
```

The type returned by signal(). Annotating a member with it makes the attributes reading the member reactive. `update` reads the current value untracked. It is a function, not a `Signal.State`: never pass it to `Signal.subtle` APIs or a `Watcher`.

### Computed (type)

```ts
Computed<T> = { (): T; get(): T }
```

The type returned by computed(). A thrown error is cached like a value until a dependency changes.

### InputSignal (type)

```ts
InputSignal<T, In = T> = { (): T; get(): T } // In: the type it accepts from outside, before its transform
Aliased<InputSignal<T>, 'alias'> // an input declaring an alias, bound by it
```

The type of an input: read-only for the component, set by the bindings of the parent.

### QuerySignal (type)

```ts
QuerySignal<T> = { (): T; get(): T }
```

The type of a query: a read-only signal updated a microtask after the DOM changes.

### EffectOptions (type)

```ts
{ onBeforeRun?: () => void; onAfterRun?: () => void; onCleanup?: () => void }
```

Hooks of an effect. onCleanup runs once, when the effect is disposed.

### InputSignalOptions (type)

```ts
SignalOptions<T> & { transform?: (value: In) => T }
```

The options of @Property, together with alias.

### QueryTarget, QueryElement, QueryContentOptions (type)

```ts
QueryTarget = string | Constructor<HTMLElement> | Constructor<CustomDirective>; QueryOptions = { read?: QueryRead }; QueryRead = 'element' | Constructor<CustomDirective>; QueryContentOptions = { descendants?: boolean }
```

The target of a query, the element type it resolves to, and the options of the content queries.

## `@xaendar/core/testing`

Importing it makes the `@defer` blocks rendered from then on findable by the specs.

### getDeferBlocks (function)

```ts
getDeferBlocks(host: Element): DeferBlockFixture[]
```

The `@defer` blocks the component of `host` renders in its shadow root, in render order (nested ones once rendered, destroyed ones left out).

### setDeferBlockBehavior (function)

```ts
setDeferBlockBehavior(value: 'playthrough' | 'manual'): void
```

For the blocks rendered after the call: `'playthrough'` (default) as in the browser; `'manual'` never arms their triggers, `when` or `prefetch`, the spec shows each part with `render`. Set `'playthrough'` again in `afterEach`.

### DeferBlockFixture (type)

```ts
DeferBlockFixture = { readonly state: DeferBlockState; render(state: DeferBlockState, error?: unknown): Promise<void> }
```

`state` is the part shown. `render` shows a part at once, stopping the triggers and the times: `'complete'` awaits the modules of the content, `'error'` passes the error to the `@error`; it rejects when the block declares no such part.

### DeferBlockState (type)

```ts
DeferBlockState = 'placeholder' | 'loading' | 'complete' | 'error'
```

### DeferBlockBehavior (type)

```ts
DeferBlockBehavior = 'playthrough' | 'manual'
```

## `@xaendar/signals`

### loadSignals (function)

```ts
loadSignals({ devMode?: boolean }?): void
```

Installs the global Signal polyfill. It must run before @xaendar/core is loaded: call it in the entry point, then load the application with a dynamic import.

### SignalOptions (type)

```ts
{ equals?: SignalEqual<T>; watched?: () => void; unwatched?: () => void }
```

The options of signal() and of Signal.State. computed() only uses equals.

### SignalEqual, ExtractSignalType (type)

```ts
SignalEqual<T> = (a, b) => boolean; ExtractSignalType<Signal.State<T>> = T
```

The type of an equality function, and the type of the value of a signal.

### Signal.State, Signal.Computed (global)

```ts
new Signal.State(value, options?); new Signal.Computed(fn, options?)
```

The classes of the TC39 proposal, installed globally by loadSignals. signal() and computed() wrap them.

### Signal.subtle (global)

```ts
Watcher, untrack, currentComputed, introspectSources, introspectSinks, hasSources, hasSinks
```

The low-level API of the proposal: watchers and introspection. It works on `Signal.State` / `Signal.Computed` nodes only, not on the functions returned by `signal()` and `computed()`.

## `@xaendar/build-tools`

### xaendarPlugin (function)

```ts
xaendarPlugin({ customElements?: readonly string[]; ssr?: { entry: string }; libraries?: XaendarLibraryOptions[] }?): Plugin
```

The Vite plugin `xd start`/`build`/`test` add themselves, with `customElements`, `ssr` and `libraries` read from `xaendar.json`. A project running Vite directly lists it after the decorators transform:

```ts
// vite.config.ts
import babel from '@rolldown/plugin-babel';
import { xaendarPlugin } from '@xaendar/build-tools';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    babel({ presets: [{ preset: () => ({ plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]] }), rolldown: { filter: { code: '@' } } }] }),
    xaendarPlugin({ customElements: ['sl-*'] })
  ]
});
```

It compiles the `*.xd.component.ts` files (template, stylesheet, selector), type-checks the templates with the `tsconfig.json` of the folder Vite is started from, and in a build type-checks the whole project at the end.

`ssr: { entry }` renders the pages on the server. The modules evaluated by the server environments of Vite register templates compiled into HTML (no type check there); the dev server renders every page with the `render(url)` exported by `entry` (absolute, or relative to the root of Vite) in place of `<!--xd-ssr-->` in `index.html`, `url` being the path of the request with its query string, starting with a single slash (`toSameOriginPath` of `@xaendar/common`), and sets the Vite application type to `custom`. The build of the server is `vite build --ssr <entry>`. The CLI passes the `ssr` of `xaendar.json`, its entry resolved against the project.

`libraries: [{ name, root, entry?, ssr?, customElements? }]` are the libraries of the workspace the project imports from its sources: the name of the package leads to `entry` (default `src/public-api.ts`, relative to `root`) and `name/<path>` to the files beside it, as the `paths` of `tsconfig.json` do for TypeScript; the files under `root` are compiled with the `ssr` (default `false`) and the `customElements` of the library. The CLI passes the `libs` of `xaendar.json`.

### buildLibrary (function)

```ts
buildLibrary({ name: string; root: string; entry?: string; outDir: string; ssr?: boolean; customElements?: readonly string[]; plugins?: readonly PluginOption[]; xaendarVersion: string; dependencies?: Record<string, string> }): Promise<void>
```

What `xd build` runs for each library of a workspace: it compiles the library ahead of time into `outDir` (emptied first), a package ready for `npm publish`. It writes an ES module for the entry (`public-api.js`) and one for each module declaring a component or a directive, the shared code in `chunks/`, not minified, with `@xaendar/*` and the dependencies of the library left as imports; the declarations, emitted by TypeScript with the `tsconfig.json` of `root`, their paths relative with `.js`; `xaendar-manifest.json` (the components and directives, their selectors, inputs and events); the `package.json` (`exports` of the entry and of each module the entry exports, `sideEffects`, `@xaendar/core` `^xaendarVersion` as a peer dependency); the README and the license. With `ssr: true`, it also writes the code of the server into `server/` (the condition `xaendar-server` of `exports`), with `@xaendar/ssr` as an optional peer dependency. `plugins` run before the Xaendar plugin (the Babel transform of the decorators). `dependencies` maps the libraries of the workspace it depends on to the folders of their builds, written before: it reads them from their declarations and manifests, as an application does, and imports them by name. It fails before writing on a component or a directive outside the folder of `entry`, a selector declared twice, or the type of an input or of an event reading a name its module does not export.

## `@xaendar/ssr`

### renderToString (function)

```ts
renderToString<Component extends CustomElement>(component: Constructor<Component>, inputs?: RenderInputs<Component>, options?: RenderOptions): Promise<string>
```

Renders a component to HTML on the server: its element with the attributes of its `@HostProperty`, a `<template shadowrootmode="open">` holding its stylesheet and its template, and its end tag; the components it renders are written the same way, and a custom element the server does not define (`@import lazy`, other libraries) without shadow root. The component is constructed, `inputs` are assigned to their properties (by property name, not alias; the `transform` applies), `onInit` runs and the template is rendered once. Effects, `afterRender`, `onDestroy`, listeners, `@HostEvent`, custom and host directives and queries do not run; `createComponent` constructs without rendering; element refs are `undefined`. Structural directives run, the asynchronous ones are awaited, and a rejected one renders nothing.

Comments mark the dynamic parts for the browser (`<!---->` before interpolations, `<!--xd-if:0-->…<!--/xd-if-->`, `xd-switch`, `xd-for` with `<!--xd-item:KEY-->` per item, `xd-s` for structural directives; the last block of an element or of a shadow root has no closing comment, the browser appending its content): never strip them. `inputs` are written as JSON into `data-xd-inputs` on the element, which the browser assigns before the component renders; `options.state` into a `<script type="application/json" data-xd-state>` after it, read by `getTransferState`. Both carry JSON plus `undefined`, `NaN`, `±Infinity`, `bigint`, `Date`, `Map`, `Set`. The promise rejects when the class is not defined, when its module was not built for the server, when an input or a state value is a function, a symbol, an instance of another class or contains itself (the error names its path, e.g. `inputs.product.onSave`), or when the code of a component throws.

### RenderInputs (type)

```ts
RenderInputs<Component> = { [input of Component]?: its value }
```

The inputs `renderToString` sets, named like the properties declaring them with `@Property`: a wrong name or value fails the type check.

### RenderOptions (type)

```ts
{ readonly state?: Readonly<Record<string, unknown>> }
```

The options of `renderToString`: `state` is the transfer state of the page, a value per key, read by `getTransferState(key)` on the server during the render and in the browser from the page; `nonce` is the nonce of the `Content-Security-Policy` of the response, written on the inline script of the event contract, a new one for each response.

## `@xaendar/ssr/dom`

### loadServerDom (function)

```ts
loadServerDom(): void
```

Installs the `HTMLElement` and the `customElements` of the server DOM on `globalThis`, keeping the ones already there. It must run before `@xaendar/core` and the components are evaluated: the entry of the server calls `loadSignals()` and `loadServerDom()`, then loads `@xaendar/ssr` and the components with `import()`. The server DOM has no `document` and no `window`. A class defined again with the tag and the name of the previous one replaces it (module re-evaluated by the dev server).
