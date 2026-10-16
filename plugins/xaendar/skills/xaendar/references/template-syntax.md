# Template syntax

The whole template language of `*.xd.component.html` files. Templates are HTML5 plus the constructs below; they are compiled at build time into direct updates of single DOM nodes and type-checked against the component class.

## Text

```html
<!-- Interpolation: any expression, always reactive, always a text node -->
<p>Hello { name() }, you have { count() + 1 } messages</p>
<p>{`${count()} items`}</p>                 <!-- template literal -->
<p>{ user()?.name ?? 'anonymous' }</p>

<!-- Characters with a meaning: write a character reference, as in HTML, or an interpolation -->
<p>&commat; &lt; &lbrace; &rbrace;</p>
<p>{ '@' } { '<' } { '{' } { '}' }</p>

<!-- Elements without content are self-closed, native ones included; attribute values always in double quotes -->
<input type="text" />
<br />
<div class="spacer" />
```

- Interpolations are single braces `{ expr }`, never `{{ expr }}`.
- Self-close every element without content, native ones included: `<div class="spacer" />`, not `<div class="spacer"></div>`. Void elements require it.
- A literal `@`, `<`, `{` or `}` in text must be written as a character reference (`&commat;`, `&lt;`, `&lbrace;`, `&rbrace;`) or an interpolation (`{ '@' }`, `{ '<' }`, `{ '{' }`, `{ '}' }`). This includes package names in prose (`&commat;xaendar/core`) and e-mail addresses.
- Character references (`&lt;`, `&amp;`, `&#64;`, …) are decoded in text and static attribute values, as in HTML. Line breaks inside a text are kept, as in HTML.
- Whitespace-only text holding a line break is dropped: elements or interpolations on separate lines render joined (write `{ ' ' }` between them). A space between them on the same line stays: `{ first } { second }`.

## Bindings and events

```html
<!-- Native elements: attributes, set with setAttribute -->
<a href="/home" title="{ tooltip() }" class="{`link ${active() ? 'on' : ''}`}">Home</a>

<!-- Components: inputs, set as InputSignals -->
<x-card heading="Static string" count="{ 3 }" user="{ user() }" />

<!-- Events: one method call; arguments are literals, members, loop variables, property accesses or $event -->
<button (click)="save()">Save</button>
<input (input)="type($event)" />
<x-picker (valueChange)="pick($event)" />
```

- An attribute value is either fully static or one expression. `class="btn { kind() }"` is the literal string `btn { kind() }`; write `class="{`btn ${kind()}`}"`.
- On native elements a binding calls `setAttribute`: the value becomes a string (an object becomes `[object Object]`), and a boolean attribute counts by presence (`disabled="{ false }"` still disables, `checked="false"` is still checked). Add or remove boolean attributes with a conditional binding. `value`/`checked` attributes are only the initial state once the user interacts: write the DOM property from code (a directive or a query).
- Static values are type-checked as `string`: a numeric input needs `count="{ 3 }"`, not `count="3"`.
- Attribute bindings are reactive only when they name a member the compiler recognizes as a signal (initialized with a function of `@xaendar/core/signals`, annotated with `Signal<T>`, `Computed<T>`, `InputSignal<T>`, …, or initialized with a module-level signal, declared in the file or imported), or a method or getter of the class whose body reads one of those members, a module signal or another such method. A call the compiler cannot trace back to a signal, as one to a function outside the class, is evaluated once: declare the reactivity with a `computed`. Text, `@if`, `@for` and `@switch` are always reactive.
- Listeners call exactly one method of the component or of one of its members (`cart.clear()`, `count.set(0)`). Arguments may be literals (`'a'`, `1`, `true`, `null`), `$event` (whole, in any position), members, `@for` variables, called, and their properties (`item().id`), or a signal or a `@for` variable without the call (passes the signal itself). No nested calls, assignments, arrow functions, `$event.target`, or several statements: put the logic in the method.
- No event modifiers: `(keydown.enter)` listens to an event literally named `keydown.enter`. Filter the key, call `preventDefault()`/`stopPropagation()` in the method.
- On a component tag, an event it does not declare with `@Event` is a native event of its element (`(click)`), typed through `HTMLElementEventMap`; only composed native events leave its shadow root. A name that is neither is a build error.
- `$event` is typed by the event name (`MouseEvent` for `click`, the `CustomEvent<T>` of an `Output<T>`). An `Output` without a type argument gives a `CustomEvent<null>`.

## Control flow

```html
@if (items().length > 10) {
  <p>Many</p>
} @else if (items().length > 0) {
  <p>A few</p>
} @else {
  <p>None</p>
}

@for (item of items(); track item().id) {
  <li>{ $index() + 1 }. { item().name } { $first() ? '(first)' : '' }</li>
}
@for (row of rows(); track row().id; index = $index) {  <!-- alias -->
  …
}
@for (5) {                                               <!-- a number of times -->
  <span>★</span>
}
@for (step of count(); track step()) {                   <!-- 0 … count() - 1 -->
  <span>{ step() }</span>
}

@switch (status()) {
  @case ('draft')
  @case ('review') {
    <p>In progress</p>
  }
  @case ('done') {
    <p>Done</p>
  }
  @default {
    <p>Unknown</p>
  }
}
```

- A space is required between the keyword and its parenthesis: `@if (x)`, never `@if(x)`.
- The `@for` item and context variables `$index`, `$first`, `$last`, `$even`, `$odd` are signals: call them (`item().id`, `$index()`), in `track` too. Aliases are signals too. Each call reads the signal again, so `@if (item().page)` does not narrow `item().page` inside the block: use `?.` or a method.
- A row reused for a new item with the same key shows the new item and keeps its DOM state (typed text, focus): with `track $index()` that state stays at its position. Track a stable id when rows hold state.
- Write control-flow blocks on multiple lines, one block per line, with the content indented.

## Conditional bindings

```html
<!-- Inside a tag: attributes, inputs, listeners and directives present while a condition holds -->
<button
  @if (locked()) {
    disabled
    title="Locked"
  } @else {
    title="Edit"
    (click)="edit()"
  }
  @switch (size()) {
    @case ('large') {
      data-size="large"
    }
  }
>
  Edit
</button>
```

A `@Property.required` input must be bound in every branch. By convention, a block sits in the position of the first group it holds (directives, attributes, events), and a condition and its negation share one `@if`/`@else` block (see the template conventions in SKILL.md).

## Directives

```html
@import { TintDirective } from './tint.directive.ts'
@import { VisibleWhenDirective } from './visible-when.directive.ts'

<!-- Custom directive: acts on the element -->
<p @@exTint(color="{ color() }" (painted)="log($event)")>…</p>

<!-- Structural directive: decides whether the element exists; AND between several -->
<p *exVisibleWhen(condition="{shown()}")>…</p>

<!-- Applied conditionally -->
<p
  @if (highlighted()) {
    @@exTint(color="#fde68a")
  }
>…</p>
```

- A directive whose class has type parameters (`class List<Item, Key = string>`) takes its type arguments right after the selector: `@@exList<Row, number>(items="{ rows() }")`, `*exEach<Row>(…)`. They follow the order of the type parameters. As in a TypeScript call, type parameters are either all given or all inferred: without type arguments they are inferred from the values bound to the inputs (`items="{ rows() }"` gives `Item` the type of the rows), then take their default type (`Key = string`), or `any`; with type arguments nothing is inferred, the ones left out take their default type and leaving out one without a default is an error. The constraint of a type parameter is checked on its argument or on the inferred type. They are only for the type-check, with no effect at runtime. More arguments than type parameters, or arguments on a directive that is not generic, is an error.
- A component whose class has type parameters (`class Picker<Item, Key = string>`) takes its type arguments between parentheses right after the tag name, with no space: `<ex-picker(Row, number) items="{ rows() }">` (the closing tag stays `</ex-picker>`). They work exactly like the ones of a directive: without them the type parameters are inferred from the values bound to the inputs, with them nothing is inferred and the ones left out take their default type; the constraint is checked on the argument (reported on the type arguments) or on the inferred type (reported on the tag name). Type arguments on a component that is not generic, more than its type parameters, or on a native element or a custom element of another library, are an error.
- A directive can be applied once per element, and cannot be applied in the template of an element that already declares it as a host directive.

## Imports

```html
<!-- Every component and directive used by a template is imported by it: relative paths, named imports -->
@import { CardComponent } from './card/card.xd.component.ts'
@import { AvatarComponent, BadgeComponent } from '../people.xd.component'
@import { TintDirective } from '../../directives/tint.directive.ts'
```

- Only relative paths: package names and tsconfig aliases are not resolved.
- Every tag containing a dash must be an imported Xaendar component, or match a pattern of `customElements` in `xaendar.json` (`["sl-*"]`; `xaendarPlugin({ customElements })` with plain Vite). Those custom elements of other libraries are used like native elements: bindings write attributes (strings only; set object properties from code), and `$event` is typed through `HTMLElementEventMap`, or `any` for events it does not declare.

## Expressions

```
Allowed      members and methods of the class, literals, arithmetic and comparisons, && || ?? ?: !,
             typeof, ?. and optional calls, indexes, array and object literals, spread, template literals,
             globals such as Math, JSON and String, the variables of @for, $event in listeners

Forbidden    assignments, new, arrow and function expressions, this, as, regular expressions,
             the comma operator, more than one expression, private and protected members,
             module constants (expose them as members)
```

- Members used by the template must be `public`. Module constants must be exposed as members (`public readonly limit = LIMIT;`).
- A member named like a global (`name`, `location`, `history`), inherited ones included, hides the global in the template. Read the global as `window.location` or `globalThis.location`.

## What does not exist

| Missing | Instead |
| --- | --- |
| `{{ expr }}` | `{ expr }` |
| `[prop]="…"`, `[(ngModel)]` | `prop="{ … }"` and a listener; a directive writing the property |
| `(keydown.enter)` | A filter in the method |
| `@empty`, `@let`, `@defer` | `@if` around the `@for`; computed signals; dynamic imports |
| Pipes | Methods (in text) and computed signals |
| `ng-template`, `ng-content` | `<slot>` / `<slot name="x">` (native shadow DOM slots) |
