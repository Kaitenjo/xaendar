# Template syntax

The whole template language of `*.xd.component.html` files. Templates are HTML5 plus the constructs below; they are compiled at build time into direct updates of single DOM nodes and type-checked against the component class.

## Text

```html
<!-- Interpolation: any expression, always reactive, always a text node -->
<p>Hello { name }, you have { count() + 1 } messages</p>
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
<a href="/home" title="{ tooltip() }" class="link">Home</a>

<!-- A class, on native elements and components: present while the value is truthy -->
<li class="task" [class.done]="{ task().done }">…</li>
<div [style.width.%]="{ progress() }" [style.--accent]="{ color() }"></div>

<!-- Components: inputs, set as InputSignals -->
<x-card heading="Static string" count="{ 3 }" user="{ user() }" />

<!-- Events: one method call; arguments are literals, members, loop variables, property accesses or $event -->
<button (click)="save()">Save</button>
<input (input)="type($event)" />
<x-picker (valueChange)="pick($event)" />

<!-- Two-way binding of a model (@Model): a writable signal, named without braces and without () -->
<x-stepper [(value)]="quantity" />
<x-toggle @@tracked([(on)]="enabled") />
```

- An attribute value is either fully static or one expression. `class="btn { kind() }"` is the literal string `btn { kind() }`; write `class="{`btn ${kind()}`}"`.
- `[class.name]="{ expr }"` toggles one class by the truthiness of a value of any type (`null`/`undefined`: no opinion); it works inside conditional bindings (the class is removed with its branch) and wins over the `class` string. Its value is always an expression in braces. A class is toggled once per element, and never inside the parentheses of a directive.
- `[style.name]="{ expr }"` sets one style property: kebab-case or camelCase (`[style.background-color]`, `[style.backgroundColor]`), optionally followed by a unit the value receives (`[style.width.px]="{ 120 }"` writes `120px`, `[style.height.%]`), or a custom property (`[style.--accent]`). The value is a string or a number (a number with a unit: the unit must be one of CSS, `[style.width.foo]` is an error); `null`, `undefined` and `''` are no opinion; a value ending with `!important` is set with that priority. Same rules as class bindings: inside conditional bindings, winning over the `style` string, once per element, never inside a directive. Brackets bind only classes, style properties and two-way bindings (`[attr]` is an error).
- `class` and `style` are merged key by key (a class, a property) among all the sources writing them: the template rendering the element, its directives (host directives first, in declaration order, then the template ones in order of appearance; the later wins) and the component (`@HostProperty`). Per key the strongest source with an opinion wins: template > directives > component, and within each level a key bound alone (`[class.x]`, `[style.x]`) > the string (`class="…"`, `style="…"`, `class="{expr}"`). `null`/`undefined` mean no opinion (the key falls back to the level below); for classes `false`/`0`/`''` is an opinion (absent, beats lower levels). Only changed keys are written (`classList`, `style.setProperty`), never the whole attribute; keys written by other code are never touched. No `[class]`/`[style]` object bindings: bind the string with `class="{`a ${b()}`}"`.
- On native elements a binding calls `setAttribute`: the value becomes a string (an object becomes `[object Object]`), `null` and `undefined` remove the attribute (the server leaves it out), and a boolean adds the attribute empty (`true`) or removes it (`false`), so `disabled="{ busy() }"` works; on `aria-*` and enumerated attributes (`draggable`, `spellcheck`, `contenteditable`, `writingsuggestions`) a boolean is written as `"true"`/`"false"`, as `@HostProperty` does. A static value is a string: `checked="false"` is still checked. `value`/`checked` attributes are only the initial state once the user interacts: write the DOM property from code (a directive or a query).
- Static values are type-checked as `string`: a numeric input needs `count="{ 3 }"`, not `count="3"`.
- `[(value)]="target"` binds a model of a component or of a directive (an input `value` with an event `valueChange`: `@Model`, or `@Property` + `@Event` so named; aliased models by their alias) to a writable signal of the template: a member (`count`), a variable of the template or a property of one (`item.quantity`, `form.name`, `rows[0].count`), holding a `signal()` or a model of the component. It is exactly `value="{target()}" (valueChange)="target.set($event.detail)"`: no braces, no call, no optional chaining. It goes with the attributes in the order of the tag, works in conditional bindings and in the parentheses of a directive, counts as binding a required input, and cannot be combined with `value="…"` on the same element. Not on native elements: write the DOM property from a directive (patterns.md, Forms).
- Every binding follows the signals it reads while it runs, wherever they are read (a signal or computed member, an input, a query, a method, a getter, a function of another module or of a compiled package): it runs again when one of them changes, in attributes as in text, `@if`, `@for` and `@switch`, and follows what its last run read (a signal behind a condition only while the condition leads to it). A binding reading no signal is set once and creates no effect. A binding reading the variables of the template (`@for` items, `$index`, `@let`, template parameters) runs again when its scope changes them.
- Listeners call exactly one method of the component, of one of its members (`cart.clear()`, `count.set(0)`) or of an element ref (`dialog.showModal()`). Arguments are expressions: literals (`'a'`, `1`, `true`, `null`), `$event` (in any position) and its properties (`$event.key`; `$event.target` is `EventTarget | null`, so read a field through an element ref instead, or pass `$event.target as HTMLInputElement`), members, called, and their properties, the variables of the template and their properties (`item.id`, `$index`), read when the event fires, element refs and their properties (`field.value`), a signal without the call (passes the signal itself), calls and operators (`format(item.id)`, `count() + 1`). No assignments, arrow functions or several statements: put the logic in the method.
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
@for (item of rows(); track item.id) {
  @render row(item, $index)                  <!-- arguments checked like a call -->
}

<template row(row: Row, index: number)>         <!-- renders nothing where declared -->
  <li>{ index + 1 }. { row.name }</li>       <!-- parameters are values -->
</template>
```

- `<template name(params)>` declares a template: only `name(…)` on the tag, parentheses also without parameters. Each parameter needs a type (imported types too) or a default value typing it: `name?: Type`, `name: Type = value`, `name = value`, only after the required ones. The default applies only to an argument left out (an explicit `undefined` stays), reads like JS (content names, earlier parameters) and is computed again when what it reads changes. No rest or destructuring.
- `@render name(args)` renders a new instance wherever content goes. A changed argument updates only the nodes reading its parameter. No spread arguments.
- Visible in the whole of its scope, like an element ref. The content reads the names of its declaration (closure, `@for` items included), not of the `@render`: pass them as arguments. Recursion works.
- Content created in the namespace of the declaration: a `@render` in another namespace is an error. An element ref the content reads must come before every `@render`.

### Passing a template to a component

```html
<!-- the parent: a template as content, and one as the value of an input -->
<user-list users="{users()}" emptyTemplate="{nothing}">
  <template row(user: User)>
    <b>{ user.name }</b> { greeting() }      <!-- reads the parent, where it is declared -->
  </template>
</user-list>
<template nothing()>
  <em>Nobody</em>
</template>

<!-- user-list: @render calls an expression giving a TemplateRef, then the arguments -->
@for (user of users(); track user.id) {
  <li>@render row()(user)</li>
}
@if (!users().length) {
  @render emptyTemplate()()
}
```

```ts
@Query.contentTemplate<[user: User]>('row')               // or @Query.contentTemplateRequired
public accessor row!: QuerySignal<TemplateRef<[user: User]> | null>;
@Property<InputSignal<TemplateRef<[]> | null>>(null)
public accessor emptyTemplate!: InputSignal<TemplateRef<[]> | null>;
```

- A template read in an expression (`emptyTemplate="{nothing}"`) is a `TemplateRef` (from `@xaendar/core`), typed with its parameters as a labeled tuple; one declared among the children of a component's element is passed as content, read by `@Query.contentTemplate('name')`. Its content reads the scope and the component declaring it, wherever it is rendered (as `ngTemplateOutlet`).
- `@render expression(args)`: a name that is not a template declared in scope is read as an expression (a member, a `@let`), and any chain (`row()`, `templates.row`, `pick(kind)`) followed by the arguments works: `@render row()(item)` reads the query, then passes `item`. `null`/`undefined` renders nothing; a different template replaces the instance. The type-check checks the arguments against `TemplateRef<Params>`.
- The instance belongs to the component rendering it (inside its shadow root, with its styles). Not allowed: content templates on an element a structural directive is applied to (wrap it), and on an interactive component a static one renders (an island).

### Standard `<template>` elements

```html
<template #row id="row" title="{ title() }">   <!-- no name(…): a real HTMLTemplateElement -->
  <li class="row">New row</li>                <!-- static content, in .content, cloned by code -->
</template>
```

- A `<template>` without `name(…)` is the HTML element: attributes (bound too), class bindings and a ref are allowed; its content is static HTML (elements with static attributes, texts). Interpolations, events, refs, directives, blocks and `<template name()>` in the content are compile errors; `shadowrootmode` and the other `shadowroot*` attributes are rejected. Clone it with `template.content.cloneNode(true)`. The server writes it as is, the browser adopts it.

## @let

```html
@let address = user().address;                   <!-- reads a signal: computed again when it changes -->
@let country = defaults.country;                 <!-- reads no signal: computed once -->
<p>{ address.street }, { address.city }, { country }</p>
```

- `@let name = value;`, also called a template variable, goes wherever content goes, with the `;` required; the value may span lines. Use it to name a part of a signal read several times (`@let address = user().address;`), not for computations, which stay in the class.
- A value, read as `name`, typed by its value, never assigned; calling it is a compile error, unless the value is a function. Computed when the render reaches it, again when a signal it read changes or when its scope changes a variable it reads (a reused `@for` row, a template parameter), otherwise once; what reads it is updated only when the value changes.
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

@for (item of items(); track item.id) {
  <li>{ $index + 1 } of { $count }. { item.name } { $first ? '(first)' : '' }</li>
} @empty {                                               <!-- while there are no items -->
  <li>Nothing yet</li>
}
@for (entry of scores(); track entry[0]) {               <!-- any iterable: Map entries, Set values -->
  <li>{ entry[0] }: { entry[1] }</li>
}
@for (row of rows(); track row.id; index = $index) {  <!-- alias -->
  …
}
@for (5) {                                               <!-- a number of times -->
  <span>★</span>
}
@for (step of count(); track step) {                   <!-- 0 … count() - 1 -->
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

@hydrate (visible, when ready()) {                       <!-- load, idle, timer(2s), visible, interaction, hover, never, when expr; none: idle -->
  <app-reviews />
}

@client {                                                <!-- only the browser renders it -->
  <app-notify-button />
} @placeholder {                                         <!-- optional: the server renders it instead -->
  <p>Loading…</p>
}

@try {                                                   <!-- its first render only -->
  <p>{ settings().theme.name }</p>
} @catch (error) {                                       <!-- or @catch { … }; error is a value, unknown -->
  <p>{ error instanceof Error ? error.message : 'Error' }</p>
}

@defer (interaction, prefetch hover) {                   <!-- load, idle(2s), timer(2s), visible, interaction, hover(ref), when expr; none: idle -->
  <app-comments />                                       <!-- its components load in a chunk of their own -->
} @placeholder (minimum 500ms) {                         <!-- optional: until a trigger fires; SSR renders it -->
  <button (click)="track()">Show comments</button>
} @loading (after 100ms, minimum 1s) {                   <!-- optional: while the modules load -->
  <p>Loading…</p>
} @error (error) {                                       <!-- optional: the modules failed to load -->
  <p>Comments are not available.</p>
}
```

- A space is required between the keyword and its parenthesis: `@if (x)`, never `@if(x)`. There is no `as` on `@if`: read the value again inside the block.
- `@hydrate (triggers) { … }` delays the hydration of content the server rendered until the first trigger fires (comma-separated: `load`, `idle`, `idle(2s)` at the latest after the time, `timer(500ms)`, `visible`, `visible({ rootMargin: '200px' })`, `interaction`, `hover` (pointer over it, or focus entering it), `when <expression>`; `never`, alone, leaves it as the HTML of the server for good; without parentheses, `@hydrate { … }`, it waits for `idle`), loading first the modules of the components and directives only the content renders, which the build splits into chunks of their own. A trigger after `prefetch` (`@hydrate (interaction, prefetch idle)`) loads those modules without hydrating. Its triggers take no element ref: they watch the content. Meanwhile the events are recorded, then replayed; the components inside hydrate with it, whatever their `@WebComponent({ ssr: { hydrate } })`. In a page rendered in the browser it is as if it were not there: the triggers do not count, and the content renders once its modules are loaded. The content is a scope of its own.
- `@client { … }` leaves its content out of the rendering on the server: the server writes only its markers and the `@placeholder { … }` following it, if any, and the browser creates the content while the component hydrates, in place of the placeholder, without warnings (`afterRender` and the queries find it). In the content of a `@hydrate`, or in a component with a `hydrate` trigger, the placeholder stays until the trigger fires. In a page rendered in the browser the content renders at once, the placeholder never. The content and the placeholder are scopes of their own. `@placeholder` comes right after the `}` of a `@client`, once, and holds no listener (a compile error): the browser removes it without running its code. `@client` does not split chunks. On the server the template does not import the modules of the components and directives only the content renders.
- `@try { … } @catch (error) { … }` works as `try`/`catch` in JavaScript: when the content throws while it is first rendered (its expressions, `@let`, `@render`, directives, nested blocks, and the components it renders: their constructor, `onInit`, first render and `afterRender`), what it rendered is removed, its components with it, and the `@catch` renders in its place. `error` is a value (`{ error }`, not a signal), typed `unknown` with `strict`: narrow it (`error instanceof Error ? error.message : …`). The name is optional (`@catch { … }`), `@catch` must follow the `}` of its `@try` (a `@try` without it is a compile error), and there is no `@finally`. Not caught: an update throwing after the first render (it goes to the console), event handlers, promises, a component inserted by code (`appendChild` in `onInit`), and the errors of the `@catch` itself (they reach an outer `@try`). In a page rendered on the server, a constructor throwing only in the browser is not caught either: the browser constructs the components when their class is defined, before the template runs. The `@catch` stays until a block holding the `@try` creates it again (an `@if`, a new `@for` item). With SSR the browser runs the block again: a `@catch` the server rendered is removed and the content rendered from scratch, and content the server rendered that throws in the browser is replaced by the `@catch` with a warning.
- `@defer (triggers) { … }` renders its content once the first trigger fires (the triggers of `@hydrate` but `never`; without parentheses, `@defer { … }`, it waits for `idle`), loading first the modules of the components and directives only the content renders, split into chunks of their own. It works in any project, with or without SSR. `visible`, `interaction` and `hover` watch the element an element ref names (`hover(more)`, `visible(frame, { rootMargin: '300px' })`, the options of the `IntersectionObserver` but `root`, as an object literal, also alone), read once the template holding the block is rendered (the element can follow the block). A trigger after `prefetch` (`@defer (interaction, prefetch hover)`, `prefetch when expr`) loads the modules without rendering the content, which then waits for the same load. Each block following it is optional, written once, in any order: `@placeholder { … }` until a trigger fires (its listeners work: `visible`, `interaction` and `hover` without an element ref watch its elements, so with those triggers a `@placeholder` holding an element is required, a compile error otherwise; `@placeholder (minimum 500ms)` keeps it at least that long), `@loading { … }` while the modules load (never shown when there is nothing to load; `@loading (after 100ms, minimum 1s)` shows it only once the modules have loaded for `after`, then at least for `minimum`), `@error (error) { … }` when they fail to load (the name is optional, the value `unknown`; without `@error` the error is logged and the `@placeholder` comes back). Times are a number with `ms` or `s` (milliseconds without a unit). The content renders once: `when` going falsy again keeps it. With SSR the server renders only the `@placeholder`, which the browser adopts. Errors of the content's render are caught by a `@try` inside the `@defer`, not around it (the content renders after the first render). Each part is a scope of its own.
- `@for` iterates arrays, numbers and any other iterable (`Map` entries `[key, value]`, `Set` values, generators), never a string (a type error: `Argument of type 'string' is not assignable to parameter of type 'never'`) nor `null`/`undefined` (the runtime throws). Track a `Map` by its key (`track entry[0]`). Without `track` the item itself is the key; a negative number renders nothing. `$count` is the number of the items. `} @empty { … }` right after the block renders while there are no items, reading the enclosing scope, not the loop variables.
- `@switch` compares with `===`; `@case` values are literals (no members of the component); `@default` applies only when no case matches, wherever it is written.
- The `@for` item and context variables `$index`, `$first`, `$last`, `$even`, `$odd`, and their aliases, are values: read them without parentheses (`item.id`, `$index`), in `track` too; calling one is a compile error telling to remove the parentheses. A row reused for another item with the same key, or moved, gets the new values in place: only the bindings reading them run again, and an event handler reads them when the event fires. `@if (item.page)` narrows `item.page` inside the block.
- A row reused for a new item with the same key shows the new item and keeps its DOM state (typed text, focus): with `track $index` that state stays at its position. Track a stable id when rows hold state.
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

- The inputs and listeners of a directive go between the parentheses after its selector; without them the parentheses can be left out (`<ex-button @@exSubmit />`). Several directives of both kinds can share an element.
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
@import lazy { ReportComponent } from './report/report.xd.component.ts'
```

- The module of the template imports the modules of its `@import`s, which defines the components and directives it uses before it renders. `@import lazy` only type-checks: something else loads the module (`import()`); a tag rendered before its class is defined shows nothing until then, and keeps the bindings set meanwhile in the properties of its element, which its inputs read once it is defined. A directive whose module is never loaded throws `No directive registered for selector`.
- A relative path is resolved against the template (extension optional, a folder means its `index.ts`). Any other path, the name of a package (`@scope/pkg`, through the `exports` of its `package.json`) or an alias of the `paths` of `tsconfig.json`, is resolved as the TypeScript files of the project resolve it; the generated code imports a package by its name, so the bundler shares one instance with the application. The imports come first in the template.
- Components and directives can be imported through a barrel (`@import { CardComponent } from './ui/index.ts'`, the barrel holding `export * from './card/card.xd.component'`, `export { Card as Tile } from './card'` or a class imported and exported again): the template reads each one from the file declaring it, and loads only that file, not the barrel, also in a `@defer` or a `@hydrate`.
- The components and directives of a library built by `xd build` are imported from its package like local ones (`@import { CardComponent } from '@acme/ui'`, or by the path of their module, `@acme/ui/card/card.xd.component`): its `xaendar-manifest.json` describes them, the type-check reads its declarations, and the template loads only their modules. The project needs `@xaendar/core` of the same major version as the one compiling the library, not an older one. The components and directives of any other package compiled to JavaScript cannot be imported: its `.d.ts` keeps no decorator. Its functions, constants, enums, classes and types can; the components of a package publishing its TypeScript sources, of the same monorepo, or reached through an alias, are imported like local ones.
- Any export can be imported: functions, constants, enums, classes, module signals, types, interfaces; `default as name` for the default export, `* as name` for the whole module. The expressions read them by their local name, like members: `{ formatPrice(price, Currency.Euro) }`, `@if (value instanceof Shape)`, `(click)="addItem()"`; a type can be a type argument (`<ex-list(Row)>`). Only the names the expressions read are imported at runtime, so a type costs nothing.
- A module signal stays reactive (`{ quantity() }`, `value="{quantity()}"`), and so does a binding calling an exported function that reads one, of the project or of a compiled package: the bindings follow the signals they read at runtime.
- Import what belongs to another module: types for the type arguments of generic components and directives, enums and classes for particular conditions (`@if (task.status === Status.Archived)`, `@if (shape() instanceof Circle)`), helpers shared by many templates, the signals of a store. The state of the component and the logic reading or changing it stay in its class (signals, computed signals, methods): never import a function or a constant only because it is possible.
- The variables of the template (`@for` items and aliases) hide an import named like them. Importing a name that is also a member of the component (inherited and DOM ones included, e.g. `title`) is an error: import it `as` another name. `root`, `$event` and the names starting with `__` are reserved.
- Every tag containing a dash must be an imported Xaendar component, or match a pattern of `customElements` in `xaendar.json` (`["sl-*"]`; `xaendarPlugin({ customElements })` with plain Vite). Those custom elements of other libraries are used like native elements: bindings write attributes (strings only; set object properties from code), and `$event` is typed through `HTMLElementEventMap`, or `any` for events it does not declare.

## Expressions

```
Allowed      members and methods of the class, literals, arithmetic and comparisons, && || ?? ?: !, in,
             typeof, instanceof, ?. and optional calls, the non-null assertion x!, indexes, array and object
             literals, spread, template literals and tagged templates, globals such as Math, JSON and String,
             the variables of @for, $event in listeners, the functions, constants, enums, classes and signals
             imported with @import, a cast closing the whole interpolation or casting an argument of a call
             (x as T)

Forbidden    assignments, new, arrow and function expressions, this, a cast of anything but an argument of a call,
             regular expressions, the comma operator, more than one expression, private and protected members,
             the names of a module that the template doesn't import
```

- An object literal needs parentheses (`{ ({ id: 1 }) }`): without them the interpolation renders nothing.
- A cast `as Type` closes a whole interpolation (`{ value() as string }`, `label="{name as Label}"`) or casts an argument of a call: of a listener (`(input)="search($event.target as HTMLInputElement)"`, `pick($event as MouseEvent, row as Row)`), of a `@render` (`@render row(item as Row)`), of a call in any expression (`{ format(value() as Date) }`, `as unknown as Date` included). The type is written as is in the type-check (imported types included) and generates no code. Any other cast (`{ (item as Row).id }`, `{ a + (b as number) }`) is an error.
- Members used by the template must be `public`. A module constant, function or signal the template reads is imported (`@import { LIMIT } from './limits.ts'`) rather than copied into a member that only aliases it; what is state of the component stays in its class.
- A member named like a global (`name`, `location`, `history`), inherited ones included, hides the global in the template. Read the global as `window.location` or `globalThis.location`.

## What does not exist

| Missing | Instead |
| --- | --- |
| `[prop]="…"` | `prop="{ … }"` |
| `[(ngModel)]`, two-way binding of a native field | `(input)` and a directive writing the property; `[(x)]` binds only the models of components and directives |
| `(keydown.enter)` | A filter in the method |
| Pipes | Methods (in text) and computed signals |
| `ng-template` + `ngTemplateOutlet` | `<template name(…)>` + `@render name(…)`; another component receives it as content (`@Query.contentTemplate`) or as an input (`TemplateRef`) and renders it with `@render row()(…)` |
| `ng-content` | `<slot>` / `<slot name="x">` (native shadow DOM slots) |
