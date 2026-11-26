# Public API

Every export applications use, by module. Symbols exported only for the compiled templates (`_Context`, `_if`, `_renderElement`, …) are omitted: never import them.

## `@xaendar/core`

### WebComponent (decorator)

```ts
@WebComponent({ selector: 'x-y', extends?: 'button', hostDirectives?: [Tip, { directive: Tip, properties?: [{ name: 'text', alias: 'hint' }], events?: ['shown'] }], ssr?: { hydrate?: 'load' | 'idle' | 'visible' | 'interaction' | 'hover' | 'never', render?: false, static?: false }, styleUrl?: './x.css', templateUrl: './x.xd.component.html' })
```

Defines a class extending CustomElement as a custom element, with its compiled template and its stylesheet (`.css`, `.scss`, `.sass` or `.less`). The options must be string literals; `hostDirectives` an array literal. The class must be declared in a file ending with `.xd.component.ts`; the decorator is not inherited.

`extends` makes a customized built-in element: the tag of the native element it extends, whose class the component extends through `customElementOf` (`customElementOf(HTMLButtonElement)` for `button`; `CustomElement` for a tag whose class is `HTMLElement`, as `section`, `nav`, `article`). Templates write it with that tag and the selector as a static `is` (`<button is="copy-button">`); `createComponent` creates it so, `@Query(Class)` finds it as `button[is="copy-button"]`, `instanceof CustomElement` holds. `templateUrl` and `styleUrl` are optional, and allowed only on a tag accepting a shadow root (`article`, `aside`, `blockquote`, `body`, `div`, `footer`, `h1`–`h6`, `header`, `main`, `nav`, `p`, `section`, `span`): the template renders into the shadow root. On any other tag the component renders nothing: it adds its inputs, events, host bindings and host directives to the native element, whose content is the one its tag holds. The server writes a template-less one as `<button is="copy-button" data-xd-client="">`, hydrated when its parent is. Safari supports no customized built-in element: the page loads a polyfill (e.g. `@ungap/custom-elements`) first.

`hostDirectives` lists custom directives applied to every instance of the component, on its own element. An entry is the class of the directive, or an object with the class (`directive`) and the `properties` and `events` of the directive the component exposes, each as `'name'` or as `{ name, alias }`: an exposed input is bound from the templates using the component, an exposed output is dispatched on it. The events not exposed are not dispatched. Code outside the templates sets an exposed input as an input of the component (`element.label = …`, an accessor of its class); the templates write it into the directive. A subclass inherits the host directives of its parent, applied before its own. The classes of the chain and their host directives are one: a directive is listed once, an exposed input has no name of an input or member of the component nor of another exposed input, an exposed event no name of an event of the component nor of another exposed event; the build reports it, the class throws it when registered. Templates cannot name the class, so expose the instance as a member (`public readonly tip = this.hostDirectives.get(Tip)`, a field of the subclass) to use it in the template.

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

### Model (decorator)

```ts
@Model<ModelSignal<T>>(defaultValue?, { alias?, equals?, watched?, unwatched?, event?: { bubbles?, cancelable?, composed? } }) accessor name!: ModelSignal<T>
```

Declares a model: an input (bound, assigned and reset as a `@Property`, without `transform`) that the class also writes with `set`/`update`, which dispatch on the host element (a directive: its element) a `CustomEvent` named `nameChange` (`aliasChange` with an `alias`, which the accessor declares: `Aliased<ModelSignal<T>, 'alias'>`), whose `detail` is the new value, only when it differs from the current one by `equals`. Setting it from outside (a binding, `createComponent`, `renderToString`, `element.name = v`) never dispatches. A parent binds both with `[(name)]="signal"`; `(nameChange)` is listened to like any event. `event` holds the options of the change event (by default it neither bubbles nor leaves the shadow root). Not on a structural directive. Costs per instance the memory of a `@Property`, less than `@Property` + `@Event`.

### Model.required (decorator)

```ts
@Model.required({ alias?, equals?, event? }) accessor name!: ModelSignal<T>
```

A model every use must bind, as `@Property.required`: `[(name)]` or `name="{…}"` count.

### Event (decorator)

```ts
@Event({ bubbles?, cancelable?, composed? }) accessor name!: Output<T>
```

Declares an output. dispatch(detail?, options?) dispatches a CustomEvent named after the accessor on the host element. The options of a single dispatch are an EventOptions instance (`new EventOptions({ composed: false })`), and a single argument is taken for the options only when it is one: any other value, a plain object with option keys included, is the detail. The options of the decorator are a plain object.

### Query (decorator)

```ts
@Query('.selector' | ComponentClass | DirectiveClass) accessor name!: QuerySignal<E | null>
```

The first element of the shadow root matching a selector or a component class, kept up to date as a signal. With the class of a custom directive it holds the instance of the directive applied to an element (with `@@selector` or as a host directive), not the element.

With `{ read }` (single-element variants only, not `Query.all`, `Query.refAll`, `Query.contentAll`): `@Query('.help', { read: TooltipDirective })` holds the directive applied to the first matching element that has it, `@Query<HTMLButtonElement>(TooltipDirective, { read: 'element' })` the element a directive is applied to. `Query.required`, `Query.ref`, `Query.refRequired`, `Query.content` and `Query.contentRequired` take the option too (the content ones next to `descendants`).

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
@Query.refRequired<E>('name') accessor name!: QuerySignal<E>
@Query.refAll<E>('name') accessor name!: QuerySignal<E[]>
```

The element of the template named by the element ref `#name`, without the `#`; `refAll` holds one per row of the `@for` declaring it, `refRequired` drops null and throws when no element has the ref. Only the template of the component: never the content passed to it.

### Query.content (decorator)

```ts
@Query.content('.selector' | ComponentClass | DirectiveClass, { descendants?, read? }) accessor name!: QuerySignal<E | null>
```

The first element of the content passed to the component (its light DOM) that matches a selector or a component class, as Angular's `contentChild`: among the children and their descendants (`descendants: false`: the children only), in document order. The content counts whether a slot renders it or not; `slot` is an attribute like any other (`'[slot="footer"]'`). Never finds the fallback of the slots, nor the content another component forwards through a `<slot>` (it finds the `<slot>` element). Updated when elements are added or removed, not on attribute changes.

### Query.contentRequired (decorator)

```ts
@Query.contentRequired('.selector' | ComponentClass | DirectiveClass, { descendants?, read? }) accessor name!: QuerySignal<E>
```

Like Query.content, for content that is always there: no null in the type, and reading it throws when no element matches.

### Query.contentAll (decorator)

```ts
@Query.contentAll('.selector' | ComponentClass | DirectiveClass, { descendants? }) accessor name!: QuerySignal<E[]>
```

Every child of the component matching a selector or a component class, in document order, as Angular's `contentChildren`; with `descendants: true`, every matching element of the content at any depth.

### Query.contentTemplate (decorator)

```ts
@Query.contentTemplate<[item: Item]>('row') accessor row!: QuerySignal<TemplateRef<[item: Item]> | null>
@Query.contentTemplateRequired<[item: Item]>('row') accessor row!: QuerySignal<TemplateRef<[item: Item]>>
```

The template passed as content under its name, a `<template row(item: Item)>` written among the children of the component's element, as Angular's `contentChild(TemplateRef)`. Passed before the component connects and never changing: available from the first render (server and hydration included). The component's template renders it with `@render row()(item)`; `contentTemplateRequired` drops null and throws when none is passed.

### TemplateRef (type)

```ts
type TemplateRef<Params extends unknown[] = []> = { readonly __template: (...params: Params) => void }
```

A template declared by `<template name(…)>` as a value: read by an expression of the template declaring it (`input="{row}"`) or by `@Query.contentTemplate`, rendered by `@render value(args)` anywhere, its content reading the scope and the component declaring it. Type an input holding one as `@Property<InputSignal<TemplateRef<[item: Item]> | null>>(null)`. `__template` exists only in the types.

### HostAttribute (decorator)

```ts
@HostAttribute('aria-checked' | 'class' | 'class.on' | 'style' | 'style.width.px') field = value | signal(…); get member(): T; accessor name!: InputSignal<T>
```

Binds an attribute, the class string (`'class'`), a class (`'class.name'`), the style string (`'style'`) or a style property (`'style.name'`, with a unit of CSS `'style.width.px'`, or a custom property `'style.--accent'`) of the host element: the component itself, or the element a custom directive is applied to (not on a StructuralDirective: type error). Decorates a non-static field, getter or accessor, `@Property` ones included to reflect an input. The member is read in an effect each time the element connects (a directive: after its onInit; a component: after the render and the query hooks, before afterRender): written again when a signal it reads changes, otherwise once. A member holding a signal or any function is called. `null`, `undefined` are no opinion (removed when nothing else writes the attribute); a boolean adds it empty (`true`) or removes it (`false`), except on `aria-*` and enumerated attributes (`draggable`, `spellcheck`, `contenteditable`, `writingsuggestions`), which get `"true"`/`"false"`; other values `String(value)`. Template bindings follow the same rule. `class` and `style` are merged key by key with the template and the directives (template > directives > component; a single key > the string; `null`/`undefined` no opinion, `false` absent for a class): only this owner's keys are removed at disconnection / destruction, giving back the value below. Typed by the name: `'class'`/`'style'` take `string | null | undefined`, `'style.x.unit'` `number | null | undefined`, `'style.x'` `string | number | null | undefined` (or a signal / function returning them). Any other attribute is merged as a whole the same way, whatever the order the sources write in: the parent template (`attr.x`, or `x` when not an input) > the directives > the component, and at disconnection / destruction only this owner's opinion goes away (an attribute nothing else writes is removed). Throws for an empty name, `'class.'`, `'style.'`, a style property that is not valid, a unit CSS does not have, the same class / property / string bound twice by the class, or a static member.

### HostListener (decorator)

```ts
@HostListener('keydown' | 'window:resize' | 'document:click', { capture?, once?, passive? }) method(event?: KeyboardEvent): void
```

Listens to an event of the host element (component, or element of a custom directive; not StructuralDirective) with a non-static method taking no parameter or the event; with the prefix `window:` or `document:` it listens to the window or the document instead, for the same lifetime (any other prefix, as `htmx:load`, is part of the name). The event is typed by the name: `HTMLElementEventMap[name]`, `WindowEventMap`/`DocumentEventMap` after the prefix, `Event` for any other name (outputs: narrow it to `CustomEvent<T>`); a narrower or broader parameter compiles, an unrelated one (`KeyboardEvent` on `click`) is a type error. A key event names its key after a dot, as in templates: `keydown.enter`, `document:keydown.escape`, `window:keyup.control.z`, `keydown.code.keya`: the method is called only for that key with exactly those modifiers, and receives a `KeyboardEvent` (typed by `keydown`/`keyup`). Window and document listeners are not in the event contract of `renderToString`. Added at connection / directive start (same timing as HostAttribute), removed at disconnection / destruction. Hears native events, events dispatched on the element (the outputs of the component and of its directives included) and events bubbling from its content; from the shadow root only composed events (`click`, `keydown`, not `change` or child outputs). Replaces `addEventListener` in onInit + `removeEventListener` in onDestroy for the host, the window and the document. Throws for an empty name, nothing after the prefix (`window:`), a key event naming no key or a modifier that does not exist (`@HostListener('keydown.ctrl.s'): "ctrl" is not a modifier…`) or a static method.

### Directive (decorator)

```ts
@Directive({
  selector: 'exName'
})
```

Registers a class extending CustomDirective or StructuralDirective under a selector, used as @@selector or *selector.

### CustomElement (class)

```ts
class X extends CustomElement { hostDirectives: HostDirectives; onInit?(); afterRender?(); onDestroy?(); effect(fn, options?): () => void; createComponent(Class, options?): ComponentRef<Class> }
```

Base class of components: an open shadow root, the lifecycle hooks, and effects disposed at disconnection. `hostDirectives` is a map from the class of each host directive to its instance (`this.hostDirectives.get(Tip)`, typed): the directives start before `onInit` and stop after `onDestroy`. `connectedCallback` and `disconnectedCallback` belong to the base class: never declare them. Disconnection runs `onDestroy`, disposes the effects, removes the template and destroys the components created with `createComponent`.


### customElementOf (function)

```ts
function customElementOf<Element extends HTMLElement>(base: Constructor<Element>): Constructor<CustomElement & Element>
```

The class a customized built-in element extends (`extends` of `@WebComponent`): `class CopyButtonComponent extends customElementOf(HTMLButtonElement)`. The class of the native element with the members of `CustomElement` (the same code), created once per native class and shared; `customElementOf(HTMLElement)` is `CustomElement`. The class the component extends must be the class of the tag it declares in `extends`: the build reports another one.

### createComponent (method of CustomElement and CustomDirective)

```ts
this.createComponent(ToastComponent, { target?: Element, properties?: [{ input: () => value, condition?: () => boolean }], events?: [{ output: (event: CustomEvent<T>) => void, valueChange: (event: CustomEvent<T>) => void /* of a model */, click: (event: MouseEvent) => void, condition? }], directives?: [Directive | { directive, condition?, properties?, events? }], content?: Node[] })
```

Creates a component in code and appends it to `target`, or to the host element when `target` or the options are missing (the element of the component, the element the directive is applied to), bound as a tag of a template is: the inputs are set before the element is appended (its `onInit` reads them), then the directives are applied and the content appended (projected through its slots; a `DocumentFragment` gives its nodes). Getters and conditions run in effects. A group with a `condition` is bound only while it holds; when it stops, its inputs go back to their defaults and its listeners stop. Throws for a class without `@WebComponent`, an input bound by two groups, a structural directive, or a directive that is already a host directive of the component. The component belongs to its creator: it is destroyed when the creator is disconnected (a directive: stops), after `onDestroy`. Callable from the constructor, a field or `onInit`; the creation is not tracked by an enclosing effect. In a directive, call it from `onInit`. A getter returning a string literal for a union-typed input of a *directive* needs `as const`.

### ComponentRef (type)

```ts
{ readonly element: Component; destroy(): void }
```

The result of createComponent: the element, already in the DOM, and the function destroying it earlier (removes the element, unbinds its inputs and events, destroys its directives; the content nodes leave with the element). Calling it again, or after the creator is gone, does nothing. Removing the element with the DOM APIs leaves its bindings alive: call `destroy()`.

### CreateComponentOptions, CreateComponentOptionsWithOptionalTarget (types)

```ts
CreateComponentOptions<Component, Directives> = { target: Element; properties?; events?; directives?; content?: Node[] }
CreateComponentOptionsWithOptionalTarget<Component, Directives> // the same, target optional
```

The options of `createComponent`: `target` is required in the generic form and optional in the one of the methods of `CustomElement`/`CustomDirective` and of `@@componentOutlet`. Type a field holding options with them (`public readonly options: CreateComponentOptionsWithOptionalTarget<CardComponent> = { … }`). The groups of the component suggest and type the inputs, outputs, model change events and native events it declares, and accept any other name (a getter of any value, a listener taking an `Event`): TypeScript cannot see what its `hostDirectives` expose, so those are bound by the name they are exposed with, from the documentation of the component, and an exposed event's listener annotates its parameter (`(event: CustomEvent<string>) => …`). A name in `properties` that is neither an input of the class nor an exposed one throws when the component is created, as in a template (`X does not declare a property named "name"`): a group sets inputs, never other members of the element; a misspelled name in `events` is not reported, since any event can be listened to. The groups of a directive in `directives` accept only what the directive declares. `renderToString` takes and checks its `inputs` the same way.

### HostDirectives (type)

```ts
ReadonlyMap<Constructor<CustomDirective>, CustomDirective> & { get<D>(directive: Constructor<D>): D | undefined }
```

The type of `hostDirectives`: the instances exist with the element, so a field initializer can read them. A template cannot name a class: expose the instance in a public field.

### CustomDirective (class)

```ts
class X extends CustomDirective<E> { element: E; onInit?(); afterRender?(); onDestroy?(); effect(fn, options?): () => void; createComponent(Class, options?): ComponentRef<Class>; dispatchEvent(event: CustomEvent): boolean }
```

Base class of the directives acting on the element they are applied to. `element` is set after the constructor: use it from `onInit`, which runs once the inputs are bound and the element is in the document, before its children are rendered. `afterRender` runs once the element has rendered: right after `onInit` for a directive of a template, and for a host directive (started before its component) at the end of the render of the component, with its Shadow DOM built and before the `afterRender` of the component: use it to reach `this.element.shadowRoot`. `onDestroy` runs when the element leaves the template or a conditional branch applying the directive is left (a new instance is created when it is taken again). Outputs are dispatched on the element; `dispatchEvent` returns `false` when a listener canceled a cancelable event.

### StructuralDirective (class)

```ts
class X extends StructuralDirective { shouldRender(): boolean | Promise<boolean> }
```

Base class of the directives deciding whether the element they are applied to is rendered. `shouldRender` runs in an effect: it is evaluated again when a signal read before its first `await` changes, and the element exists while every structural directive on it returns `true`. A pending promise keeps the current state, and only the latest evaluation decides. No element, no outputs, no hooks, no `@HostAttribute`/`@HostListener`, and no conditional inputs.

### Output (class)

```ts
class Output<T = void> { dispatch(...args: T extends void ? [options?: EventOptions] : [detail: T, options?: EventOptions]): void }
```

The class of an @Event accessor: dispatch dispatches a CustomEvent named after the accessor on the host element. Without a type argument the event carries no detail: `$event` is a `CustomEvent<null>`.

### EventOptions (class)

```ts
new EventOptions({ bubbles?: boolean, cancelable?: boolean, composed?: boolean })
```

The options of an output: a plain object in @Event, an EventOptions instance in a single dispatch (merged over the ones of the decorator). By default an event neither bubbles nor leaves the shadow root.

### WebComponentOptions (type)

```ts
{ selector: string; hostDirectives?: Array<Constructor<CustomDirective> | HostDirectiveOptions>; ssr?: { hydrate?: 'load' | 'idle' | 'visible' | 'interaction' | 'hover' | 'never'; render?: false; static?: false }; styleUrl?: string; templateUrl: string }
```

The options of @WebComponent.

### HostDirectiveOptions (type)

```ts
{ directive: Constructor<CustomDirective>; properties?: HostDirectiveMember[]; events?: HostDirectiveMember[] }
```

A host directive of a component, with the properties and the events of the directive it exposes: a model is exposed as a property (`'value'`) and its change event as an event (`'valueChange'`).

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

### onLeave (function)

```ts
onLeave(element: Element, handler: (element: Element) => Promise<void> | void): void
```

Registers the function called when an `@if`, `@switch`, `@for` or structural directive is about to remove the element: the element stays in the DOM until the promise settles (at most 5 s), then it is removed; no promise, a throw or a rejection remove it at once (the error reported). Call it in the `onInit` of a directive, on `this.element`. Everything else of the block is disposed at once, queries stop finding the element at once, and the block goes on without it (new branch at its place, `@for` rows placed ignoring it, a returning key gets a new row). Only elements at the top of the removed block wait; a destroyed component, or a block removed with its parent, removes them at once without calling the function. A second call replaces the first. No-op on the server. The built-in `@@animation(leave=…)` uses it.

### createComponent (function)

```ts
createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options: CreateComponentOptions<Component, Directives>): ComponentRef<Component>
```

Creates a component outside of any component or directive (the root of an application in `main.ts`, a component mounted from a service), with the same options as the method but `target` required. The component belongs to nothing: it lives until `ref.destroy()`, which removes it and disposes the effects binding its inputs. Inside a component or a directive use `this.createComponent`, which destroys it along with them. On the server it constructs the component without rendering it.

### trustUrl (function)

```ts
trustUrl(url: string): SafeUrl
```

Angular's `bypassSecurityTrustUrl`: bound to an attribute holding URLs (`href`, `src`, `srcset`…), in a template or by a `@HostAttribute`, the URL is written as it is, even `javascript:`, without the check of `security.urls` of `xaendar.json`. Where it loads a resource (`<iframe src>`, `<object data>`, `<link href>`…) it is still checked as `security.resourceUrls` asks: use `trustResourceUrl` there. Call it where the application builds the URL, only for URLs it controls.

### trustResourceUrl (function)

```ts
trustResourceUrl(url: string): SafeResourceUrl
```

Angular's `bypassSecurityTrustResourceUrl`: the URL passes both `security.urls` and `security.resourceUrls`, whatever its origin. An origin always loaded from is better listed once in `security.trustedOrigins`.

### sanitizeUrl, sanitizeResourceUrl (functions)

```ts
sanitizeUrl(url: string | SafeUrl): string | null
sanitizeResourceUrl(url: string | SafeUrl): string | null
```

Angular's `sanitize(SecurityContext.URL | RESOURCE_URL, url)`, for URLs the code uses itself (`location.href`, `window.open`, a frame it creates): the URL, or `null` when it runs code (`javascript:`, `vbscript:`, non-media `data:`); `sanitizeResourceUrl` also gives `null` for an absolute URL whose origin is not in `security.trustedOrigins`. Always checked, whatever `security.urls`/`resourceUrls` ask. A `trustUrl` value passes `sanitizeUrl`, a `trustResourceUrl` value both.

### SafeUrl, SafeResourceUrl (types)

```ts
interface SafeUrl { readonly url: string; readonly resource: boolean; toString(): string }
interface SafeResourceUrl extends SafeUrl { readonly resource: true }
```

The values `trustUrl`/`trustResourceUrl` return, written as the URL they hold. The runtime recognizes only the values they create (`instanceof`), never an object with the same shape.

## `@xaendar/directives`

The built-in directives, imported by the templates (`@import { AnimationDirective } from '@xaendar/directives'`), and the sanitizer of HTML. `@xaendar/core` and `@xaendar/internals` are peers, installed with it.

### AnimationDirective (`@@animation`)

```html
<li @@animation(enter="fade-in" leave="fade-out")>…</li>
<section @@animation(enter="{slideIn}" leave="{slideOut}")>…</section>
```

`enter` and `leave` are each a CSS class or a function (`ElementAnimation`), `''` by default (no animation on that side); `ignoreReducedMotion="{true}"` animates even with `prefers-reduced-motion: reduce`, which otherwise disables both.

- `enter`: once the element is rendered, applies the class and removes it when the CSS animations or transitions it runs on the element itself end (`@keyframes` run at once; a transition needs `@starting-style`), or calls the function with the element. On the server the class is written into the HTML (the browser runs the animation on load) and the hydration does not restart it, only removes the class at its end; a function runs at the hydration.
- `leave`: through `onLeave`, registered only when `leave` holds an animation as the directive starts: makes the element `inert`, applies the class and waits for the end of its CSS animations or transitions on the element itself (at most their CSS times plus a margin), or waits for the promise of the function (`element.animate(…).finished`). Leaves at once without animations. While both branches are in the DOM the layout grows: take the leaving one out of the flow in CSS (`.stage > [inert] { position: absolute; inset: 0 }`). Its `id` and positional selectors (`:first-child`, `+`, `:nth-child`) still see it until it is removed.

### ElementAnimation (type)

```ts
type ElementAnimation = string | ((element: HTMLElement) => Promise<unknown> | void)
```

The `enter` and the `leave` of `@@animation`: a CSS class, or a function animating the element.

### ClassDirective (`@@class`)

```html
<li @@class(value="{ ({ active: item.id === selected(), done: item.done }) }")>…</li>
<div class="card" @@class(value="{theme().classes}")>…</div>
```

Angular's `[ngClass]`: `value` (`ElementClasses`, none by default) is a string of classes, a list or a set of classes, or an object whose keys are classes (several separated by spaces) given while their value is truthy. On a change the classes it no longer holds are removed. Its classes are a source of `class` at the level of the directives: the template's `class` and `class.x` win over it, it wins over the component's `@HostAttribute`, and a class it does not give is left to the others. Written into the page on the server. For a few classes known in advance, `class.x="{…}"` is lighter.

### StyleDirective (`@@style`)

```html
<div @@style(value="{ ({ 'width.px': width(), backgroundColor: color(), '--accent': accent() }) }")>…</div>
```

Angular's `[ngStyle]`: `value` (`ElementStyles`, none by default) is an object of properties, in kebab-case or camelCase, followed by their unit if any (`'width.px'`), or custom properties (`'--accent'`), set to a string or a number, with `!important` when the value ends with it; `null`, `undefined` and `''` set nothing. A key that is not a property, or a unit CSS does not have, throws; a value holding a `;` outside parentheses and quotes is left out. On a change the properties it no longer sets are removed. Merged with the other sources of `style` as `@@class` is with `class`; written into the page on the server. For a few properties known in advance, `style.x="{…}"` is lighter.

### ElementClasses, ElementStyles (types)

```ts
type ElementClasses = string | readonly string[] | ReadonlySet<string> | Readonly<Record<string, unknown>> | null | undefined
type ElementStyles = Readonly<Record<string, string | number | null | undefined>> | null | undefined
```

The `value` of `@@class` and of `@@style`.

### ComponentOutlet (`@@componentOutlet`)

```html
@import { ComponentOutlet } from '@xaendar/directives'

<div @@componentOutlet(component="{card()}") />
<div @@componentOutlet(component="{card()}" options="{cardOptions}") />
```

Angular's `ngComponentOutlet`: creates the component of the class `component` (required, a class decorated with `@WebComponent`, usually the value of a signal) with `createComponent` and appends it to its element, after its content, or to the `target` of `options` (`CreateComponentOptionsWithOptionalTarget`, the element of the directive then staying empty). When the class or the `options` object changes, the component is destroyed and created again; the directive destroys it when it is destroyed. Keep `options` in a field of the class and bind what changes through the getters of its `properties`: an object literal in the template, or a `computed` returning a new object, recreates the component at every run. The classes it creates are imported by the TypeScript module giving them to the template, which never names them.

### InnerHtmlDirective (`@@innerHtml`)

```html
<article @@innerHtml(html="{post().body}") />
<article @@innerHtml(html="{post().body}" options="{withImages}" (sanitized)="log($event.detail)") />
<span @@innerHtml(html="{icon}") />
```

Renders an HTML as the content of its element (Angular's `[innerHTML]`), replacing what the template puts there, again at each change; on the server it is written into the page. `html` (`HtmlContent`: `string | SafeHtml | null | undefined`, `''` by default; `null`/`undefined` empty the element) is sanitized with `sanitizeHtml` and `options` (`HtmlSanitizerOptions`, read once per object: a constant or a field, never an object literal in the template). `sanitizer` (`HtmlSanitizer`, `(html: string) => string`, as `DOMPurify.sanitize`) replaces the sanitizer, `options` aside; an HTML wrapped by `trustHtml` is rendered as it is. `(sanitized)` fires, in the browser, when the built-in sanitizer removed something: `detail` is an `HtmlSanitizeReport` (`{ removedElements: string[], removedAttributes: string[] }`, attributes as `img[onerror]`). With Trusted Types the HTML is written through the policy `xaendar#inner-html` (sanitized here) or `xaendar#inner-html-unsafe` (trusted, or from `sanitizer`): list the ones allowed in the `trusted-types` of the CSP. The HTML is not a template: no bindings, listeners or directives; the stylesheet of the component styles it. A `div` or a `ul` of the HTML closes a host `p` in a page rendered on the server: use a `div` or an `article` as host.

### sanitizeHtml (function)

```ts
sanitizeHtml(html: string, options?: HtmlSanitizerOptions): string
```

The sanitizer of `@@innerHtml` (Angular's `DomSanitizer.sanitize(SecurityContext.HTML, …)`), without DOM: the same result on the server and in the browser. Keeps by default what Angular keeps: text-level and block elements, lists, tables, media (`img`, `picture`, `audio`, `video`, `source`, `track`), with their presentational attributes, `class`, `title`, `lang`, the URLs and `aria-*`. Removes forms, SVG, MathML, custom elements, comments, `id`, `name`, `style`, `data-*` and `on*`. A removed element leaves its content, except `script`, `style`, `template`, `noscript`, `iframe`, `noembed`, `noframes`, `object` and `plaintext`, removed with it. URLs (`href`, `src`, every URL of `srcset` and `ping`, `action`, `poster`, `xlink:href`, …) are decoded as the browser does and kept when relative, of an allowed scheme, or `data:` image/audio/video in base64; otherwise the attribute is removed. The output is well formed: texts and values encoded, every element closed, end tags without start tag dropped, implied ends (`li`, `p`, cells) written.

### HtmlSanitizerOptions (type)

```ts
interface HtmlSanitizerOptions { allowElements?: string[]; allowAttributes?: string[]; removeElements?: string[]; removeAttributes?: string[]; urlSchemes?: string[] }
```

`allow…` add to the defaults, `remove…` take off them (a removed element keeps its content) and win over `allow…`; names are case-insensitive, `'data-*'`/`'x-*'` are prefixes. Attributes apply to every kept element, or to one only when written `element[attribute]` (`allowAttributes: ['span[style]', 'img[data-*]']`, `removeAttributes: ['a[target]']`). `urlSchemes` replaces `['http', 'https', 'mailto', 'tel', 'ftp', 'sms']`. Options keeping what always runs code throw: `script`, `base`, `meta` in `allowElements`, `on*` or `srcdoc` in `allowAttributes` (a prefix like `o*` too), `javascript`/`vbscript` in `urlSchemes`; use `trustHtml` or a `sanitizer` for such HTML. A kept SVG `animate`/`set` never animates `href` (its `attributeName` is removed). The resource URLs of allowed elements (`iframe`/`embed`/`frame` `src`, `object` `data`/`codebase`, `link` `href`) are kept only for the app's origin or `security.trustedOrigins` of `xaendar.json` (all of them with `resourceUrls: "off"`), as in templates. `setHtmlSanitizerOptions(options)` sets options for every sanitized HTML of the application: a use's lists are added to them, its `urlSchemes` replace theirs; it throws when they keep what always runs code, `undefined` restores the defaults. Allowing `object`, `embed`, `form`, defined custom elements or `style` still lets code or arbitrary CSS through.

### setHtmlSanitizerOptions (function)

```ts
setHtmlSanitizerOptions(options: HtmlSanitizerOptions | undefined): void
```

Sets the options of the sanitizer of `@@innerHtml` and `sanitizeHtml` for the whole application (Angular has no equivalent: its `DomSanitizer` cannot be configured). Call it once, before the first HTML is sanitized, in `main.ts` and, with SSR, in code the server runs too (each has its own module state); HTML already rendered is not sanitized again. Uses without options sanitize with these; a use's options are joined with them. Throws on options keeping what always runs code; `undefined` restores the defaults.

### trustHtml (function)

```ts
trustHtml(html: string): SafeHtml
```

Angular's `bypassSecurityTrustHtml`: bound to the `html` of `@@innerHtml`, the HTML is rendered without sanitizing it. Only for HTML the application builds or has already sanitized.

## `@xaendar/forms`

### FormControlDirective (host directive)

```ts
@WebComponent({ selector: 'x-rating', hostDirectives: [FormControlDirective], templateUrl: './x-rating.html' })
class Rating extends CustomElement {
  @Model(0) public accessor value!: ModelSignal<number>;
  public readonly control = this.hostDirectives.get(FormControlDirective)!;
  public onInit(): void {
    this.control.setValue(this.value, value => value ? String(value) : null);
    this.control.setValidators([() => this.value() ? undefined : { valueMissing: 'Required' }], () => this.firstStar() ?? undefined);
  }
}
```

Angular's `ControlValueAccessor`, on the native form-associated custom elements: the component becomes a control of any `<form>` (`FormData` under its `name`, validation blocking the submission, `reset()`, `<fieldset disabled>`). Only as a host directive: it declares the native form callbacks, so `@WebComponent` sets the static `formAssociated` (a host directive declaring any of them makes the component form-associated; no option) and forwards them to it; applied from a template it has no form callbacks, and `attachInternals()` throws. `setValue(signal, transform?)`: once (a second call throws; connected again, `onInit` calls it again), convert anything not `string | File | FormData | null`. `setValidators(validators, anchor?)`: `FormValidator` returns `ValidityState` flags with messages (`customError` for custom errors) or `undefined`; signals followed; each call replaces the previous ones, `[]` removes them; the anchor returns `HTMLElement | undefined`, never `null`. States are read-only signals (fields, read `control.untouched()`; the opposite is `!`): `untouched` (focusout, as Angular's blur; a submission or `checkValidity()` does not touch it, the form keeps its own `submitted` flag), `pristine`, `valid` (the validators find no error), `disabled` (bind `disabled="{control.disabled()}"`). Dirty is set by the user, never derived from the value: an `input` or `change` event on the host (a native field inside the shadow root already crosses it with `input`; `change` does not cross, so a component of its own dispatches `input` and `change` when the user changes the value, as a native control does), even with the same value, and it stays dirty if the value goes back; the code writing the signal does not count; only the reset of the form clears it. Custom states `:state(touched)`, `:state(dirty)` (`:host(:state(touched):invalid)`). `internals` is the element's `ElementInternals` (never call `attachInternals()` yourself; `null` on the server). The callbacks keep their native names on the directive (`formResetCallback` writes back the initial value and clears touched and dirty, `formDisabledCallback`, `formStateRestoreCallback` writes back an unconverted value): a component declaring its own replaces the forwarding (declare `formStateRestoreCallback` when converting the value). Not with `extends`: a native field is a control already (`value`, `setCustomValidity()`).

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
Signal<T> = { (): T; get(): T; set(value: T): void; update(fn: (prev: T) => T): void; asReadonly(): ReadonlySignal<T> }
```

The type returned by signal(). Annotating a member with it makes the attributes reading the member reactive. `update` reads the current value untracked. `asReadonly()` returns the same signal typed as `ReadonlySignal` (no `set`, no `update`): no copy and no run-time check, the protection is the type-check's; keep the writable one private (`public readonly count = this._count.asReadonly()`). It is a function, not a `Signal.State`: never pass it to `Signal.subtle` APIs or a `Watcher`.

### ReadonlySignal (type)

```ts
ReadonlySignal<T> = { (): T; get(): T }
```

What `signal.asReadonly()` returns: a view of a writable signal without `set` and `update` (not derived, unlike Computed). Recognized as a signal member by the template compiler.

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

### ModelSignal (type)

```ts
ModelSignal<T> = InputSignal<T> & { set(value: T): void; update(fn: (previous: T) => T): void }
Aliased<ModelSignal<T>, 'alias'> // a model declaring an alias, bound by it, its event named aliasChange
```

The type of a model: an input the class writes, dispatching its change event. Assignable where a `Signal<T>` is expected, so a component can pass its own model to a child: `[(value)]="value"`.

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
xaendarPlugin({ customElements?: readonly string[]; strictEvents?: boolean; security?: { urls?: 'off' | 'warn' | 'remove'; resourceUrls?: 'off' | 'warn' | 'remove'; trustedOrigins?: readonly string[]; rejectUnsafeBindings?: boolean }; ssr?: { entry: string }; libraries?: XaendarLibraryOptions[] }?): Plugin
```

The Vite plugin `xd start`/`build`/`test` add themselves, with `customElements`, `strictEvents`, `security`, `ssr` and `libraries` read from `xaendar.json`. `strictEvents` (default `true`) makes the type check warn about the events the elements of a template do not declare (`$event` is then an `Event`); `false` turns the warning off, in the editor too. `security.rejectUnsafeBindings` (default `true`) makes an expression bound to an `on*` attribute or to `srcdoc`, to the restrictions of an `<iframe>` (`sandbox`, `allow`…), to the `attributeName` of an SVG animation (or its values when it animates `href`), to the `http-equiv` of a `<meta>` or the `content` of its refresh a type-check error (static values and inputs allowed); `security.urls` (default `'remove'`) checks the URLs bound to `href`, `src`, `srcset`, `ping`, `action`, `formaction`, `xlink:href`… on the client and on the server: `'warn'` writes a `javascript:`/`vbscript:`/non-media `data:` URL with a warning, `'remove'` leaves it out (warning in development), `'off'` writes it silently; `security.resourceUrls` (default `'remove'`) checks the same way an absolute URL loading a resource (`<iframe src>`, `<embed src>`, `<object data>`, `<link href>`, `<base href>`) whose origin is not in `security.trustedOrigins` (as `URL.origin` writes them). `security` is the project's alone, for every component it renders, the ones of its libraries included: a library declares none, its templates are type-checked with the defaults, and the compiler only flags the attributes holding URLs. The plugin defines `__XAENDAR_SECURITY__`, the project's options, which the runtime applies to those URLs and to `@HostAttribute`. A project running Vite directly lists it after the decorators transform:

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

`libraries: [{ name, root, entry?, ssr?, customElements?, strictEvents? }]` are the libraries of the workspace the project imports from its sources: the name of the package leads to `entry` (default `src/public-api.ts`, relative to `root`) and `name/<path>` to the files beside it, as the `paths` of `tsconfig.json` do for TypeScript; the files under `root` are compiled with the `ssr` (default `false`) and the `customElements` of the library. The CLI passes the `libs` of `xaendar.json`.

### buildLibrary (function)

```ts
buildLibrary({ name: string; root: string; entry?: string; outDir: string; ssr?: boolean; customElements?: readonly string[]; strictEvents?: boolean; plugins?: readonly PluginOption[]; xaendarVersion: string; dependencies?: Record<string, string> }): Promise<void>
```

What `xd build` runs for each library of a workspace: it compiles the library ahead of time into `outDir` (emptied first), a package ready for `npm publish`. It writes an ES module for the entry (`public-api.js`) and one for each module declaring a component or a directive, the shared code in `chunks/`, not minified, with `@xaendar/*` and the dependencies of the library left as imports; the declarations, emitted by TypeScript with the `tsconfig.json` of `root`, their paths relative with `.js`; `xaendar-manifest.json` (the components and directives, their selectors, inputs and events); the `package.json` (`exports` of the entry and of each module the entry exports, `sideEffects`, `@xaendar/core` `^xaendarVersion` as a peer dependency); the README and the license. With `ssr: true`, it also writes the code of the server into `server/` (the condition `xaendar-server` of `exports`), with `@xaendar/ssr` as an optional peer dependency. `plugins` run before the Xaendar plugin (the Babel transform of the decorators). A library has no `security`: its templates are type-checked with the defaults, and the URLs they bind are checked at runtime with the `security` of the application using it. `dependencies` maps the libraries of the workspace it depends on to the folders of their builds, written before: it reads them from their declarations and manifests, as an application does, and imports them by name. It fails before writing on a component or a directive outside the folder of `entry`, a selector declared twice, or the type of an input or of an event reading a name its module does not export.

## `@xaendar/ssr`

### renderToString (function)

```ts
renderToString<Component extends CustomElement>(component: Constructor<Component>, inputs?: RenderInputs<Component>, options?: RenderOptions): Promise<string>
```

Renders a component to HTML on the server: its element with the attributes of its `@HostAttribute`, a `<template shadowrootmode="open">` holding its stylesheet and its template, and its end tag; the components it renders are written the same way, and a custom element the server does not define (`@import lazy`, other libraries) without shadow root. The component is constructed, `inputs` are assigned to their properties (by property name, not alias; the `transform` applies), `onInit` runs and the template is rendered once. Effects, `afterRender`, `onDestroy`, listeners, `@HostListener`, custom and host directives and queries do not run; `createComponent` constructs without rendering; element refs are `undefined`. Structural directives run, the asynchronous ones are awaited, and a rejected one renders nothing.

Comments mark the dynamic parts for the browser (`<!---->` before interpolations, `<!--xd-if:0-->…<!--/xd-if-->`, `xd-switch`, `xd-for` with `<!--xd-item:KEY-->` per item, `xd-s` for structural directives; the last block of an element or of a shadow root has no closing comment, the browser appending its content): never strip them. `inputs` are written as JSON into `data-xd-inputs` on the element, which the browser assigns before the component renders; `options.state` into a `<script type="application/json" data-xd-state>` after it, read by `getTransferState`. Both carry JSON plus `undefined`, `NaN`, `±Infinity`, `bigint`, `Date`, `Map`, `Set`. No `style` attribute is written (a strict `Content-Security-Policy` blocks them): the inline style of each element becomes a rule of a `<style data-xd-style>` of its shadow root, after the stylesheet (the root's own, in one right before the root), the element holding `data-xd-style="<index>"`; a declaration whose value could end the rule is dropped, and the browser moves the declarations back into the elements when it hydrates them. Never match `style="` in the server HTML. The promise rejects when the class is not defined, when its module was not built for the server, when an input or a state value is a function, a symbol, an instance of another class or contains itself (the error names its path, e.g. `inputs.product.onSave`), or when the code of a component throws.

### RenderInputs (type)

```ts
RenderInputs<Component> = { [input of Component]?: its value }
```

The inputs `renderToString` sets, named like the properties declaring them with `@Property`: a wrong name or value fails the type check.

### RenderOptions (type)

```ts
{ readonly state?: Readonly<Record<string, unknown>>, readonly nonce?: string }
```

The options of `renderToString`: `state` is the transfer state of the page, a value per key, read by `getTransferState(key)` on the server during the render and in the browser from the page; `nonce` is the nonce of the `Content-Security-Policy` of the response, written on the inline script of the event contract and on every `<style>` (stylesheets and inline styles), a new one for each response: the same one goes in `script-src` and `style-src`, which then need no `'unsafe-inline'`.

## `@xaendar/ssr/dom`

### loadServerDom (function)

```ts
loadServerDom(): void
```

Installs the `HTMLElement` and the `customElements` of the server DOM on `globalThis`, keeping the ones already there. It must run before `@xaendar/core` and the components are evaluated: the entry of the server calls `loadSignals()` and `loadServerDom()`, then loads `@xaendar/ssr` and the components with `import()`. The server DOM has no `document` and no `window`. A class defined again with the tag and the name of the previous one replaces it (module re-evaluated by the dev server).
