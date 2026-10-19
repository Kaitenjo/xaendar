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

<!-- A class, on native elements and components: present while the value is truthy -->
<li class="task" [class.done]="{ task().done }">…</li>

<!-- Components: inputs, set as InputSignals -->
<x-card heading="Static string" count="{ 3 }" user="{ user() }" />

<!-- Events: one method call; arguments are literals, members, loop variables, property accesses or $event -->
<button (click)="save()">Save</button>
<input (input)="type($event)" />
<x-picker (valueChange)="pick($event)" />
```

- An attribute value is either fully static or one expression. `class="btn { kind() }"` is the literal string `btn { kind() }`; write `class="{`btn ${kind()}`}"`.
- `[class.name]="{ expr }"` toggles one class by the truthiness of a value of any type; it works inside conditional bindings (the class is removed with its branch) and survives a bound `class`, winning over it. Its value is always an expression in braces. Brackets only toggle classes (`[style.x]`, `[attr]` are errors), a class is toggled once per element, and never inside the parentheses of a directive.
- On native elements a binding calls `setAttribute`: the value becomes a string (an object becomes `[object Object]`), and a boolean attribute counts by presence (`disabled="{ false }"` still disables, `checked="false"` is still checked). Add or remove boolean attributes with a conditional binding. `value`/`checked` attributes are only the initial state once the user interacts: write the DOM property from code (a directive or a query).
- Static values are type-checked as `string`: a numeric input needs `count="{ 3 }"`, not `count="3"`.
- Attribute bindings are reactive only when they name a member the compiler recognizes as a signal (initialized with a function of `@xaendar/core/signals`, annotated with `Signal<T>`, `Computed<T>`, `InputSignal<T>`, …, or initialized with a module-level signal, declared in the file or imported), or a method or getter of the class whose body reads one of those members, a module signal or another such method. A call the compiler cannot trace back to a signal, as one to a function outside the class, is evaluated once: declare the reactivity with a `computed`. Text, `@if`, `@for` and `@switch` are always reactive.
- Listeners call exactly one method of the component, of one of its members (`cart.clear()`, `count.set(0)`) or of an element ref (`dialog.showModal()`). Arguments are expressions: literals (`'a'`, `1`, `true`, `null`), `$event` (in any position) and its properties (`$event.key`; `$event.target` is `EventTarget | null`, so read a field through an element ref instead), members, `@for` variables, called, and their properties (`item().id`), element refs and their properties (`field.value`), a signal or a `@for` variable without the call (passes the signal itself), calls and operators (`format(item().id)`, `count() + 1`). No assignments, arrow functions or several statements: put the logic in the method.
- No event modifiers: `(keydown.enter)` listens to an event literally named `keydown.enter`. Filter the key, call `preventDefault()`/`stopPropagation()` in the method.
- On a component tag, an event it does not declare with `@Event` is a native event of its element (`(click)`), typed through `HTMLElementEventMap`; only composed native events leave its shadow root. A name that is neither is a build error.
- `$event` is typed by the event name (`MouseEvent` for `click`, the `CustomEvent<T>` of an `Output<T>`). An `Output` without a type argument gives a `CustomEvent<null>`.

## Element refs

```html
<button (click)="field.focus()">Focus</button>  <!-- a handler can use a ref declared after it -->
<label>Name <input #field /></label>            <!-- field: HTMLInputElement, visible in the whole scope -->
<p>{ field.placeholder }</p>                   <!-- other expressions only after the element -->
<ex-counter #counter />                         <!-- a component: the instance of its class -->
<button (click)="counter.reset()">Reset</button>
```

- `#name`, an element ref (or ref), names the element, as the first item of its tag. Not to be confused with the template variables, declared with `@let`. Its type is the DOM interface of the tag (the SVG or MathML one inside `<svg>`/`<math>`), or the class of an imported component, instantiated when it is generic. It is not a signal: reading a DOM property through it is not reactive.
- It is visible in the whole of its scope, inside other elements too: the template, an `@if`/`@switch` branch, a `@for` row (one per row), or the content of an element a structural directive is applied to. Only event handlers can read it before its element; any other expression reading it before is a build error.
- One per element, without a value, never inside a conditional binding or a directive, never on an element with a structural directive. Not readable by the `track` of a `@for`. `root`, `$event`, `__*` and `$$*` are reserved.

## Templates

```html
@import { Row } from './row.ts'

@render row(rows()[0], 0)                        <!-- before the declaration too -->
@for (item of rows(); track item().id) {
  @render row(item(), $index())                  <!-- arguments checked like a call -->
}

<template row(row: Row, index: number)>         <!-- renders nothing where declared -->
  <li>{ index() + 1 }. { row().name }</li>       <!-- parameters are signals -->
</template>
```

- `<template name(params)>` declares a template: only `name(…)` on the tag, parentheses also without parameters. Each parameter needs a type (imported types too) or a default value typing it: `name?: Type`, `name: Type = value`, `name = value`, only after the required ones. The default applies only to an argument left out (an explicit `undefined` stays), reads like JS (content names, earlier parameters) and is reactive. No rest or destructuring.
- `@render name(args)` renders a new instance wherever content goes. A changed argument updates only the nodes reading its parameter. No spread arguments.
- Visible in the whole of its scope, like an element ref. The content reads the names of its declaration (closure, `@for` items included), not of the `@render`: pass them as arguments. Recursion works.
- Content created in the namespace of the declaration: a `@render` in another namespace is an error. An element ref the content reads must come before every `@render`. Only the declaring template renders it.

## @let

```html
@let address = user().address;                   <!-- reads a signal: a signal, read as address() -->
@let country = defaults.country;                 <!-- reads none: a value, computed once -->
<p>{ address().street }, { address().city }, { country }</p>
```

- `@let name = value;`, also called a template variable, goes wherever content goes, with the `;` required; the value may span lines. Use it to name a part of a signal read several times (`@let address = user().address;`), not for computations, which stay in the class.
- A signal when the value reads one (a signal or reactive member, an imported signal, a `@for` variable, a template parameter, a signal `@let`), decided at compile time; otherwise a value computed once. Typed by its value, never assigned.
- Scope like an element ref: visible in the whole scope, but only event handlers read it before its `;`, and a template reading it must be rendered after it. Not readable by the `track` of a `@for`. Same reserved names.

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
<!-- Every component and directive a template uses, and every value or type of a module it reads, is imported by it -->
@import { CardComponent } from './card/card.xd.component.ts'
@import { AvatarComponent, BadgeComponent } from '../people.xd.component'
@import { TintDirective } from '../../directives/tint.directive.ts'
@import { formatPrice, Currency, quantity } from '../cart.ts'
@import { format as formatDate, default as shout, * as utils } from '../utils.ts'
```

- A relative path is resolved against the template (extension optional, a folder means its `index.ts`). Any other path, the name of a package (`@scope/pkg`, through the `exports` of its `package.json`) or an alias of the `paths` of `tsconfig.json`, is resolved as the TypeScript files of the project resolve it; the generated code imports a package by its name, so the bundler shares one instance with the application. The imports come first in the template.
- The components and directives of a package compiled to JavaScript cannot be imported yet: its `.d.ts` keeps no decorator. Its functions, constants, enums, classes and types can; the components of a package publishing its TypeScript sources, of the same monorepo, or reached through an alias, are imported like local ones.
- Any export can be imported: functions, constants, enums, classes, module signals, types, interfaces; `default as name` for the default export, `* as name` for the whole module. The expressions read them by their local name, like members: `{ formatPrice(price, Currency.Euro) }`, `@if (value instanceof Shape)`, `(click)="addItem()"`; a type can be a type argument (`<ex-list(Row)>`). Only the names the expressions read are imported at runtime, so a type costs nothing.
- A module signal stays reactive (`{ quantity() }`, `value="{quantity()}"`), and so does a binding calling an exported function that reads one. A signal of a compiled package is recognized from its type in the declarations, but the body of its functions is not there: an attribute binding calling one is evaluated once (wrap it in a `computed` member).
- Import what belongs to another module: types for the type arguments of generic components and directives, enums and classes for particular conditions (`@if (task().status === Status.Archived)`, `@if (shape() instanceof Circle)`), helpers shared by many templates, the signals of a store. The state of the component and the logic reading or changing it stay in its class (signals, computed signals, methods): never import a function or a constant only because it is possible.
- The variables of the template (`@for` items and aliases) hide an import named like them. Importing a name that is also a member of the component (inherited and DOM ones included, e.g. `title`) is an error: import it `as` another name. `root`, `$event` and the names starting with `__` are reserved.
- A `const enum` is erased at runtime: use a regular `enum` or an object `as const`.
- Every tag containing a dash must be an imported Xaendar component, or match a pattern of `customElements` in `xaendar.json` (`["sl-*"]`; `xaendarPlugin({ customElements })` with plain Vite). Those custom elements of other libraries are used like native elements: bindings write attributes (strings only; set object properties from code), and `$event` is typed through `HTMLElementEventMap`, or `any` for events it does not declare.

## Expressions

```
Allowed      members and methods of the class, literals, arithmetic and comparisons, && || ?? ?: !,
             typeof, instanceof, ?. and optional calls, indexes, array and object literals, spread, template literals,
             globals such as Math, JSON and String, the variables of @for, $event in listeners,
             the functions, constants, enums, classes and signals imported with @import

Forbidden    assignments, new, arrow and function expressions, this, as, regular expressions,
             the comma operator, more than one expression, private and protected members,
             the names of a module that the template doesn't import
```

- Members used by the template must be `public`. A module constant, function or signal the template reads is imported (`@import { LIMIT } from './limits.ts'`) rather than copied into a member that only aliases it; what is state of the component stays in its class.
- A member named like a global (`name`, `location`, `history`), inherited ones included, hides the global in the template. Read the global as `window.location` or `globalThis.location`.

## What does not exist

| Missing | Instead |
| --- | --- |
| `{{ expr }}` | `{ expr }` |
| `[prop]="…"`, `[(ngModel)]` | `prop="{ … }"` and a listener; a directive writing the property |
| `(keydown.enter)` | A filter in the method |
| `@empty`, `@defer` | `@if` around the `@for`; dynamic imports |
| Pipes | Methods (in text) and computed signals |
| `ng-template` + `ngTemplateOutlet` | `<template name(…)>` + `@render name(…)`, in the same template |
| `ng-content` | `<slot>` / `<slot name="x">` (native shadow DOM slots) |
