# Public API

Every export applications use, by module. Symbols exported only for the compiled templates (`_Context`, `_if`, `_renderElement`, …) are omitted: never import them.

## `@xaendar/core`

### WebComponent (decorator)

```ts
@WebComponent({ selector: 'x-y', hostDirectives?: [Tip, { directive: Tip, properties?: [{ name: 'text', alias: 'hint' }], events?: ['shown'] }], styleUrl?: './x.css', templateUrl: './x.xd.component.html' })
```

Defines a class extending CustomElement as a custom element, with its compiled template and its stylesheet (`.css`, `.scss`, `.sass` or `.less`). The options must be string literals; `hostDirectives` an array literal. The class must be declared in a file ending with `.xd.component.ts`; the decorator is not inherited.

`hostDirectives` lists custom directives applied to every instance of the component, on its own element. An entry is the class of the directive, or an object with the class (`directive`) and the `properties` and `events` of the directive the component exposes, each as `'name'` or as `{ name, alias }`: an exposed input is bound from the templates using the component, an exposed output is dispatched on it. The events not exposed are not dispatched. They belong to the class declaring them: a subclass with its own @WebComponent does not inherit the ones of its parent. Templates cannot name the class, so expose the instance as a member (`public readonly tip = this.hostDirectives.get(Tip)`, a field of the subclass) to use it in the template.

### Property (decorator)

```ts
@Property<InputSignal<T>, In = T>(defaultValue?, { alias?, transform?: (value: In) => T, equals?, watched?, unwatched? }) accessor name!: InputSignal<T>
```

Declares an input. The accessor holds an InputSignal, set by the bindings of the parent template (or by `createComponent`) and by assignments to the property of the element from outside (`element.name = value`, also before the element is defined), never by attributes. `transform` converts every bound or assigned value, not the default; templates bind the type it accepts: the second type argument, else the annotation of its parameter, else `T`. `equals` compares the transformed value with the current one (`Object.is` by default). A conditional binding that stops holding resets the input to its default.

### Property.required (decorator)

```ts
@Property.required({ alias?, transform?, equals? }) accessor name!: InputSignal<T>
```

Declares an input that every use of the component must bind, in every branch of a conditional binding. Checked at compile time.

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

With `{ read }` (single-element variants only, not `.all`): `@Query('.help', { read: TooltipDirective })` holds the directive applied to the first matching element that has it, `@Query<HTMLButtonElement>(TooltipDirective, { read: 'element' })` the element a directive is applied to. `Query.required`, `Query.ref`, `Query.ref.required`, `Query.content` and `Query.content.required` take the option too (the content ones next to `slots`/`lightDom`).

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

The element of the template named by the element ref `#name`, without the `#`; `.all` holds one per row of the `@for` declaring it, `.required` drops null and throws when no element has the ref. Only the template of the component: never the projected content.

### Query.content (decorator)

```ts
@Query.content('.selector' | ComponentClass | DirectiveClass, { slots?, lightDom? }) accessor name!: QuerySignal<E | null>
```

The first element projected into the slots of the component that matches a selector or a component class.

### Query.content.required (decorator)

```ts
@Query.content.required('.selector' | ComponentClass | DirectiveClass, { slots?, lightDom? }) accessor name!: QuerySignal<E>
```

Like Query.content, for projected content that is always there: no null in the type, and reading it throws when no element matches.

### Query.content.all (decorator)

```ts
@Query.content.all('.selector' | ComponentClass | DirectiveClass, { slots?, lightDom? }) accessor name!: QuerySignal<E[]>
```

Every projected element matching a selector or a component class, in the order of the slots.

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
{ selector: string; hostDirectives?: Array<Constructor<CustomDirective> | HostDirectiveOptions>; styleUrl?: string; templateUrl: string }
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
InputSignal<T> = { (): T; get(): T }
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

### QueryTarget, QueryElement, QuerySlotOptions (type)

```ts
QueryTarget = string | Constructor<HTMLElement> | Constructor<CustomDirective>; QueryOptions = { read?: QueryRead }; QueryRead = 'element' | Constructor<CustomDirective>; QuerySlotOptions = { slots?: string | string[]; lightDom?: false } | { lightDom: true }
```

The target of a query, the element type it resolves to, and the options of the content queries.

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
xaendarPlugin({ customElements?: readonly string[] }?): Plugin
```

The Vite plugin `xd start`/`build`/`test` add themselves, with `customElements` read from `xaendar.json`. A project running Vite directly lists it after the decorators transform:

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
