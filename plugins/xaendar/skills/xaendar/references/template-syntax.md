# Template syntax

The whole template language of `*.xd.component.html` files. Templates are HTML5 plus the constructs below; they are compiled at build time into direct updates of single DOM nodes and type-checked against the component class.

## Text

```html
<!-- Interpolation: any expression, always reactive, always a text node -->
<p>Hello { name() }, you have { count() + 1 } messages</p>
<p>{`${count()} items`}</p>                 <!-- template literal: no space before the backtick -->
<p>{ user()?.name ?? 'anonymous' }</p>

<!-- Characters with a meaning: write them through an interpolation -->
<p>{ '@' } { '<' } { '\x7B' } { '\x7D' }</p>

<!-- Elements without content are self-closed, native ones included; attribute values always in double quotes -->
<input type="text" />
<br />
<div class="spacer" />
```

- Interpolations are single braces `{ expr }`, never `{{ expr }}`.
- Self-close every element without content, native ones included: `<div class="spacer" />`, not `<div class="spacer"></div>`. Void elements require it.
- A literal `@`, `<`, `{` or `}` in text must go through an interpolation (`{ '@' }`, `{ '<' }`, `{ '\x7B' }`, `{ '\x7D' }`). This includes package names in prose (`{'@xaendar/core'}`) and e-mail addresses.
- A brace inside a string still counts for the lexer: `{ '}' }` breaks; use `{ '\x7D' }`.
- HTML entities (`&lt;`, `&amp;`, …) are not decoded and newlines are removed.
- Whitespace-only text is dropped: `{ first } { second }` renders the two values joined. Use `{ ' ' }` between them, or a single expression such as a template literal.
- Template literals: write the backtick right after the brace (`{`…`}`); `{ `…` }` with a space is not parsed. Nested template literals are not supported.

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
- Attribute bindings are reactive only when they name a member the compiler recognizes as a signal (initialized with a function of `@xaendar/core/signals`, annotated with `Signal<T>`, `Computed<T>`, `InputSignal<T>`, …, or initialized with a module-level signal, declared in the file or imported). A method call in an attribute is evaluated once: turn it into a `computed`. Text, `@if`, `@for` and `@switch` are always reactive.
- Listeners call exactly one method of the component or of one of its members (`cart.clear()`, `count.set(0)`). Arguments may be literals (`'a'`, `1`, `true`, `null`), `$event` (whole, in any position), members, `@for` variables and their properties (`item.id`), or a signal without the call (passes the signal itself). No nested calls, assignments, arrow functions, `$event.target`, or several statements: put the logic in the method.
- No event modifiers: `(keydown.enter)` listens to an event literally named `keydown.enter`. Filter the key, call `preventDefault()`/`stopPropagation()` in the method.
- On a component tag only the events it declares with `@Event` can be bound; on native elements only native events. Listen to native events on a wrapper element.
- `$event` is typed by the event name (`MouseEvent` for `click`, the `CustomEvent<T>` of an `Output<T>`). An `Output` without a type argument gives no `$event`.

## Control flow

```html
@if (items().length > 10) {
  <p>Many</p>
} @else if (items().length > 0) {
  <p>A few</p>
} @else {
  <p>None</p>
}

@for (item of items(); track item.id) {
  <li>{ $index() + 1 }. { item.name } { $first() ? '(first)' : '' }</li>
}
@for (row of rows(); track row.id; index = $index) {    <!-- alias -->
  …
}
@for (5) {                                               <!-- a number of times -->
  <span>★</span>
}
@for (step of count(); track step) {                     <!-- 0 … count() - 1 -->
  <span>{ step }</span>
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
- The `@for` context variables `$index`, `$first`, `$last`, `$even`, `$odd` are signals: call them (`$index()`). Aliases are signals too.
- `@for` keeps the item each row was created with: replacing an object with a new one that has the same key does not refresh the row. Change the key, or keep per-item state in signals. Avoid `track $index` on lists that get items inserted or prepended.
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
<p *exVisibleWhen(condition="{ shown() }")>…</p>

<!-- Applied conditionally -->
<p
  @if (highlighted()) {
    @@exTint(color="#fde68a")
  }
>…</p>
```

- A valueless attribute right before a structural directive fails to parse (`<span hidden *exX>`): put it after the directive, or write `hidden=""`.
- A directive can be applied once per element.

## Imports

```html
<!-- Every component and directive used by a template is imported by it: relative paths, named imports -->
@import { CardComponent } from './card/card.xd.component.ts'
@import { AvatarComponent, BadgeComponent } from '../people.xd.component'
@import { TintDirective } from '../../directives/tint.directive.ts'
```

- Only relative paths: package names and tsconfig aliases are not resolved.
- Every tag containing a dash must be an imported Xaendar component; custom elements of other libraries are rejected. Create foreign elements from code (e.g. in `afterRender` through a query).

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
- Shorthand objects (`{ name }`) in an interpolation render nothing: write `{ name: name }`.
- `history` and `location` always resolve to the browser globals.

## What does not exist

| Missing | Instead |
| --- | --- |
| `{{ expr }}` | `{ expr }` |
| `[prop]="…"`, `[(ngModel)]` | `prop="{ … }"` and a listener; a directive writing the property |
| `(keydown.enter)` | A filter in the method |
| `@empty`, `@let`, `@defer` | `@if` around the `@for`; computed signals; dynamic imports |
| Pipes | Methods (in text) and computed signals |
| `ng-template`, `ng-content` | `<slot>` / `<slot name="x">` (native shadow DOM slots) |
