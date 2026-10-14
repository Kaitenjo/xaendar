# Public API

Every export applications use, by module. Symbols exported only for the compiled templates (`_Context`, `_if`, `_renderElement`, …) are omitted: never import them.

## `@xaendar/core`

### WebComponent (decorator)

```ts
@WebComponent({ selector: 'x-y', styleUrl?: './x.css', templateUrl: './x.xd.component.html' })
```

Defines a class extending CustomElement as a custom element, with its compiled template and its stylesheet. The options must be string literals.

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
@Query('.selector' | ComponentClass) accessor name!: QuerySignal<E | null>
```

The first element of the shadow root matching a selector or a component class, kept up to date as a signal.

### Query.all (decorator)

```ts
@Query.all('.selector' | ComponentClass) accessor name!: QuerySignal<E[]>
```

Every element of the shadow root matching a selector or a component class.

### Query.content (decorator)

```ts
@Query.content('.selector' | ComponentClass, { slots?, lightDom? }) accessor name!: QuerySignal<E | null>
```

The first element projected into the slots of the component that matches a selector or a component class.

### Query.content.all (decorator)

```ts
@Query.content.all('.selector' | ComponentClass, { slots?, lightDom? }) accessor name!: QuerySignal<E[]>
```

Every projected element matching a selector or a component class, in the order of the slots.

### Directive (decorator)

```ts
@Directive({ selector: 'exName' })
```

Registers a class extending CustomDirective or StructuralDirective under a selector, used as @@selector or *selector.

### CustomElement (class)

```ts
class X extends CustomElement { onInit?(); afterRender?(); onDestroy?(); effect(fn, options?) }
```

Base class of components: an open shadow root, the lifecycle hooks, and effects disposed at disconnection.

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

### Output (type)

```ts
Output<T = void> = { emit(detail?: T, options?: EventOptions): void }
```

The type of an @Event accessor. Without a type argument the event carries no detail, and templates cannot read $event.

### EventOptions (type)

```ts
{ bubbles?: boolean; cancelable?: boolean; composed?: boolean }
```

The options of an output, given to @Event or to a single emit. At least one key is required.

### WebComponentOptions (type)

```ts
{ selector: string; styleUrl?: string; templateUrl: string }
```

The options of @WebComponent.

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
QueryTarget = string | Constructor<HTMLElement>; QuerySlotOptions = { slots?: string | string[]; lightDom?: false } | { lightDom: true }
```

The target of a query, the element type it resolves to, and the options of the content queries.

## `@xaendar/signals`

### loadSignals (function)

```ts
loadSignals({ devMode?: boolean }?): void
```

Installs the global Signal polyfill. It must run before @xaendar/core is loaded, from a module of its own.

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
