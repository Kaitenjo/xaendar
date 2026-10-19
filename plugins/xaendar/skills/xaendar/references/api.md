# Public API

Every export applications use, by module. Symbols exported only for the compiled templates (`_Context`, `_if`, `_renderElement`, …) are omitted: never import them.

## `@xaendar/core`

### WebComponent (decorator)

```ts
@WebComponent({ selector: 'x-y', hostDirectives?: [Tip, { directive: Tip, properties?: [{ name: 'text', alias: 'hint' }], events?: ['shown'] }], styleUrl?: './x.css', templateUrl: './x.xd.component.html' })
```

Defines a class extending CustomElement as a custom element, with its compiled template and its stylesheet. The options must be string literals; `hostDirectives` an array literal.

`hostDirectives` lists custom directives applied to every instance of the component, on its own element. An entry is the class of the directive, or an object with the class (`directive`) and the `properties` and `events` of the directive the component exposes, each as `'name'` or as `{ name, alias }`: an exposed input is bound from the templates using the component, an exposed output is dispatched on it. The events not exposed are not dispatched. Templates cannot name the class, so expose the instance as a member (`public readonly tip = this.hostDirectives.get(Tip)`, a field of the subclass) to use it in the template.

### Property (decorator)

```ts
@Property(defaultValue, { alias?, transform?, equals? }) accessor name!: InputSignal<T>
```

Declares an input. The accessor holds an InputSignal, set by the bindings of the parent template.

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

### Directive (decorator)

```ts
@Directive({ selector: 'exName' })
```

Registers a class extending CustomDirective or StructuralDirective under a selector, used as @@selector or *selector.

### CustomElement (class)

```ts
class X extends CustomElement { hostDirectives: HostDirectives; onInit?(); afterRender?(); onDestroy?(); effect(fn, options?) }
```

Base class of components: an open shadow root, the lifecycle hooks, and effects disposed at disconnection. `hostDirectives` is a map from the class of each host directive to its instance (`this.hostDirectives.get(Tip)`, typed): the directives start before `onInit` and stop after `onDestroy`.

### CustomDirective (class)

```ts
class X extends CustomDirective<E> { element: E; onInit?(); onDestroy?(); effect(fn, options?) }
```

Base class of the directives acting on the element they are applied to.

### StructuralDirective (class)

```ts
class X extends StructuralDirective { shouldRender(): boolean | Promise<boolean> }
```

Base class of the directives deciding whether the element they are applied to is rendered.

### Output (class)

```ts
class Output<T = void> { emit(detail?: T, options?: EventOptions): void }
```

The class of an @Event accessor: emit(detail?, options?) dispatches the event. Without a type argument the event carries no detail, and templates cannot read $event.

### EventOptions (type)

```ts
{ bubbles?: boolean; cancelable?: boolean; composed?: boolean }
```

The options of an output, given to @Event or to a single emit. At least one key is required.

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
Signal<T> = Signal.State<T> & { (): T; update(fn: (prev: T) => T): void }
```

The type returned by signal(). Annotating a member with it makes the attributes reading the member reactive.

### Computed (type)

```ts
Computed<T> = Signal.Computed<T> & { (): T }
```

The type returned by computed().

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
{ equals?: SignalEqual<T>; [Signal.subtle.watched]?: () => void; [Signal.subtle.unwatched]?: () => void }
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
Watcher, untrack, currentComputed, introspectSources, introspectSinks, hasSources, hasSinks, watched, unwatched
```

The low-level API of the proposal: watchers, introspection, and the symbols of the watched and unwatched callbacks.
