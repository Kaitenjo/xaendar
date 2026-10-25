---
name: xaendar
description: Writing, editing, testing and debugging Xaendar Web Components — `*.xd.component.ts` classes, `*.xd.component.html` templates, directives, signals from `@xaendar/core/signals`, stylesheets, and the `xd` CLI. Use whenever a project depends on `@xaendar/*`, a file ends in `.xd.component.ts`/`.xd.component.html`/`.directive.ts`, the user mentions Xaendar, `@WebComponent`, `CustomElement`, `@Property`, `@Event`, `@Query`, `@HostProperty`, `@HostEvent`, `createComponent` or `xd new`/`start`/`build`/`test`, or asks to port Angular code to Xaendar.
---

# Xaendar

Xaendar builds Web Components from a template language that extends HTML5. There is no virtual DOM: the compiler wires each DOM node directly to the signals it reads. Every component is a real custom element with an open shadow root. The syntax resembles Angular's, but it is a different and much stricter language. Do not carry Angular habits over without checking [references/template-syntax.md](references/template-syntax.md); to port Angular code, read [references/angular.md](references/angular.md).

## Project layout

```
my-app/                 xd new my-app --style css   (css | scss | sass | less; runs npm i)
├── package.json        scripts: start (xd start), build (xd build), test (xd test)
├── xaendar.json        { "name", "generate": { "components": { "style": "css" } }, "customElements": ["sl-*"] }
├── tsconfig.json       also type-checks the templates: run xd from this folder
├── vite.config.ts      plain Vite config (root: 'src', port 4200): xd adds Babel (decorators) + xaendarPlugin()
└── src/
    ├── index.html      links styles.<ext>, loads main.ts
    ├── main.ts         loadSignals() from @xaendar/signals, then await import('./bootstrap')
    ├── bootstrap.ts    imports the root component
    ├── styles.<ext>    page styles: they do not reach inside components
    └── my-app-root/    my-app-root.xd.component.ts / .html / .<ext> / .spec.ts
```

- `xd` comes from `@xaendar/cli` (`npm i -g @xaendar/cli` for `xd new`; inside a project, `npx xd`). Without `--style`, `xd new` asks the format on the terminal.
- `main.ts` loads the application with a dynamic import: a static one evaluates `@xaendar/core` before `loadSignals()` runs (`ReferenceError: Signal is not defined`).
- A component or a directive is defined when its module is evaluated. The module of a template imports the modules of its `@import`s, so importing the root component in `bootstrap.ts` defines everything the templates use. A class used only from TypeScript (`createComponent`, `@Query(Class)`) is imported by the module using it.
- `@import lazy { PanelComponent } from './panel.xd.component.ts'` type-checks the tag without loading the module: load it with `import()`, and render the tag only once `customElements.get('x-panel')` returns the class (or `whenDefined` resolves). Rendered earlier, it receives its bindings as plain attributes and keeps its default inputs.
- `xd generate component <name> -p <folder>` (`xd g c`, `-f` overwrites) creates `<folder>/<name>/` with the class `<PascalCase>Component`, the template, the stylesheet in the format of `xaendar.json` and a spec.

## A component

```ts
// counter/counter.xd.component.ts
import { CustomElement, Event, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

@WebComponent({
  selector: 'app-counter',                       // lowercase, with a dash; string literals only
  styleUrl: './counter.xd.component.css',        // optional; .css, .scss, .sass or .less
  templateUrl: './counter.xd.component.html'
})
export class CounterComponent extends CustomElement {
  @Property(0)
  public accessor start!: InputSignal<number>;
  @Property.required({ alias: 'label' })
  public accessor caption!: InputSignal<string>;
  @Event()
  public accessor changed!: Output<number>;
  public readonly count = signal(0);
  public readonly total = computed(() => this._computeTotal());

  public increment(): void {
    this.count.update(count => count + 1);
    this.changed.emit(this.total());
  }

  private _computeTotal(): number {
    return this.start() + this.count();
  }
}
```

```html
<!-- counter/counter.xd.component.html -->
<button title="{caption()}" (click)="increment()">{ caption() }: { total() }</button>
@if (total() > 5) {
  <p>That is a lot</p>
}
```

```html
<!-- a parent template -->
@import { CounterComponent } from './counter/counter.xd.component.ts'

<app-counter start="{2}" label="Clicks" (changed)="log($event)" />
```

## Rules that prevent most failures

**Class**
- Extend `CustomElement` (components) or `CustomDirective<E>` / `StructuralDirective` (directives). Inputs are `@Property(default)` / `@Property.required()` on `public accessor x!: InputSignal<T>`. Outputs are `@Event()` on `public accessor x!: Output<T>`. Queries are `@Query`, `@Query.all`, `@Query.content`, `@Query.content.all` on `accessor x!: QuerySignal<…>`, taking a CSS selector, a component class or a directive class (which holds the directive instances); `@Query.ref('name')` / `.all` / `.required` find the elements of an element ref `#name`; `@Query.required` / `@Query.content.required` drop `null` and throw when read with no match (view queries fill after the render, content queries after `afterRender`). Attributes, classes and listeners of the host element (the component, or the element of a custom directive) are `@HostProperty('aria-checked' | 'class.on')` on a field, getter or accessor and `@HostEvent('click', options?)` on a method: applied at each connection (before `afterRender`; after a directive's `onInit`), removed at disconnection. `null`/`undefined`/`false` remove the attribute, `true` writes it empty: write ARIA states as `String(value)`. Prefer them to effects and listeners set up in `onInit` and undone in `onDestroy`.
- Give an `@Event` that the parent reads a type argument. An `Output` without one gives `$event` a `CustomEvent<null>`.
- With `transform`, templates bind the type `transform` accepts: the second type argument of `@Property` (`@Property<InputSignal<number>, string>(0, { transform: Number })`), else the annotation of its parameter, else the type of the signal.
- Never name a member after an `HTMLElement` member (`title`, `lang`, `hidden`, `remove`, `click`, `attributes`, `matches`, `id`, `style`, …): TS2416 and cascading decorator errors. Rename the member, and use `alias` to keep the attribute name: `@Property('ts', { alias: 'lang' }) accessor language`.
- Members used by the template must be `public`. A module constant, function, enum or signal the template reads is imported with `@import`, not copied into a member that only aliases it. The state of the component and its logic stay in the class: import types for the type arguments of generics, enums and classes for particular conditions, shared helpers and the signals of a store, not everything just because it is possible.
- A module-level signal is best imported in the template (`@import { count } from './cart.store.ts'`): its bindings stay reactive. The class reads it directly (`count()`): do not copy it into a member (`public readonly count = count;`) or forward it through a method. Do not wrap the signal in a function of your own (`count = readCount()`): attribute bindings reading that member are evaluated once, unless it is annotated with its signal type (`count: Signal<number> = readCount()`). A signal taken from another object (`this.log = target.log`) still needs a signal type on the member. Only the types of `@xaendar/core/signals` count: an alias of your own is not recognized.
- Lifecycle: `constructor` (once; nothing rendered) → `onInit()` (every connection, before render) → render → `afterRender()` (elements and view queries available) → `onDestroy()` (every disconnection). An element removed by its template is destroyed, and rendering it again creates a new instance: never move, remove or reattach elements with the DOM APIs. Create effects with `this.effect(fn)` in `onInit`, or in `afterRender` when they work on the elements of the template (a field or the constructor run them before the inputs are bound): they are disposed with the component, and their disposer throws once they are disposed. Remove manual listeners (window, document) in `onDestroy`, using a stable arrow-function field.
- A parent binds a child's inputs and listeners before inserting it: `onInit` and the first render see the bound values, and events emitted from `onInit` reach the parent. Read inputs reactively all the same, since bound values change later.
- In a directive, `this.element` is unavailable in the constructor: do the setup reading it in `onInit`. `this.effect` works there too, as in a component. A directive starts before the children of its element are rendered: wait a microtask to read them.
- Create components in code (toasts, dialogs, panels) with `this.createComponent(Class, options)`, a method of components and custom directives. An element made with `document.createElement` gets no inputs: use it only for a root element.
  ```ts
  const toast = this.createComponent(ToastComponent, {
    target: document.body,
    properties: [{ message: () => this.message() }, { condition: () => this.urgent(), level: () => 'error' }],
    events: [{ closed: () => { toast.destroy(); } }],
    directives: [TooltipDirective],
    content: [document.createTextNode('Saved')]
  });
  ```
  The getters run in effects. A group with a `condition` resets its inputs to their defaults when the condition stops holding; an input goes in one group only; structural directives are not accepted. The component is destroyed with its creator, after `onDestroy`; `toast.destroy()` does it earlier, while removing the element with the DOM APIs leaves its bindings alive.

**Template**: see [references/template-syntax.md](references/template-syntax.md). The essentials:
- Use `{ expr }`, not `{{ }}`. Write a literal `@ < { }` as `&commat;`, `&lt;`, `&lbrace;`, `&rbrace;` (character references are decoded as in HTML) or `{ '@' }`, `{ '<' }`, `{ '{' }`, `{ '}' }`. Use double quotes around every attribute value. Self-close every element without content, native ones included (`<div class="spacer" />`); void elements require it (`<input />`).
- An attribute is fully static or one expression: `class="{`btn ${kind()}`}"`, not `class="btn { kind() }"`. Toggle a single class with `[class.name]="{expr}"`.
- A listener is one method call, whose arguments are expressions (`save($event.key, count() + 1, format(name()))`): no assignments, arrow functions or several statements, no `(keydown.enter)` modifiers.
- Add or remove boolean attributes (`disabled`, `checked`) with a conditional binding inside the tag, not with `="{false}"`.
- Expressions allow the non-null assertion (`item().page!.title`), but no `as`, `new`, arrow functions or assignments.
- Import every component and directive used, at the top of the template, with `@import { X } from './relative/path.xd.component.ts'` (packages and `tsconfig.json` aliases work too, except the components of compiled packages). Import the functions, constants, enums, signals and types of other modules the same way: the expressions read them by name. Tags of other libraries are declared in `customElements` of `xaendar.json` instead.
- `@for (item of items(); track item().id)`: arrays and numbers only; the item and `$index`, `$first`, … are signals. Without `track` the item itself is the key.
- Write control flow as `@if (x) {` with a space, one block per line.

**Styles**
- `styleUrl` takes `.css`, `.scss`, `.sass` or `.less`; Sass and Less need `sass` / `less` in the devDependencies. Their `@use`/`@import` are resolved at build time, while an `@import` in a `.css` file is dropped, and a relative `url()` resolves against the page: use absolute paths (the `public` folder).
- Page styles and resets do not enter shadow roots, and `:root` matches nothing in a component. Use `:host` (custom elements are `display: inline` by default), `:host(.x)`, `::slotted()`, `::part()` and CSS custom properties for theming.

**Signals**: import `signal`, `computed`, `effect` and `untracked` from `@xaendar/core/signals`. Read a signal by calling it (`count()`) or with `get()`, and write it with `.set(v)` / `.update(fn)`; values are compared with `Object.is`, so write new arrays and objects instead of mutating them. Effects run again in a microtask. For shared state, use modules that export read-only `computed`s and functions; there is no DI.

## Code conventions

Follow these in every class you write or edit (components, directives, plain classes), unless the project states otherwise:

- **Member order**: public fields (including decorated accessors) → protected fields → private fields → getters and setters (public, then protected, then private) → `constructor` → `onInit` → `afterRender` → public methods → protected methods → private methods → `onDestroy`. Static members go with the group of their kind and visibility. Fields run in declaration order: when a public field needs a private one eagerly, declare the public field without an initializer and assign it in the constructor.
- **Decorator options**: `selector` first, then the other options of `@WebComponent` / `@Directive` in alphabetical order (`selector`, `hostDirectives`, `styleUrl`, `templateUrl`).
- **Private members** (fields and methods) start with `_`: `private readonly _labels`, `private _write()`.
- **Computed fields** never inline their callback. It goes in a private method `_compute<FieldName>()` with an explicit return type, and the field just calls it:
  ```ts
  public readonly total = computed(() => this._computeTotal());

  private _computeTotal(): number {
    return this.start() + this.count();
  }
  ```
  This applies to one-liners too. Module-level computeds in stores keep their callback inline.
- **Input types** narrower than what the default infers (literal unions, empty arrays, nullable values, `unknown`) go in the generic of `@Property`, with the same type on the accessor. Never type the accessor `InputSignal<string>` and cast on read (`this.language() as CodeLang`):
  ```ts
  @Property<InputSignal<CodeLang>>('ts', { alias: 'lang' })
  public accessor language!: InputSignal<CodeLang>;
  ```
  Any type works, imported aliases included. Inputs bound statically (`kind="tip"`) are type-checked as `string`, so they cannot use a literal union.
- **Names**: never one-letter identifiers (variables, parameters and arrow callbacks, catch bindings, type parameters, `@for` items and aliases): name what the value is. Only the counter of a `for` loop is `i` (`j`, `k` when nested).
- **`void`**: never put `void` in front of a call to discard its result (`void this._load(id)`). Call the function as a plain statement, or `await` it / chain `.then`/`.catch` when the promise must be handled.
- **Loops**: never `.forEach`. Loop over an array with an indexed `for` (`for (let i = 0; i < items.length; i++)`, reading `const item = items[i]`), over a `Map` or a `Set` with `for…of` on it. `map`, `filter`, `some`, `reduce` are fine.
- **Empty collections and objects**: never create an empty array, `Map`, `Set` or object only to loop over it or spread it, and never spread an array or an object that may be empty (a spread is several times slower than an `if`). A function whose collection may be missing returns `undefined`, not an empty collection. The caller takes the result in a `const`, checks it with `?.length` (array) or `?.size` (`Map`, `Set`) and only then loops or pushes. Never write `?? []`, `|| []`, `?? new Map()`, `...(x ?? [])`, `...(condition ? [item] : [])`, `...(x ?? {})`, `...(condition ? { key: value } : {})` or `...condition && { key: value }` (assign an optional member under an `if` after creating the object instead), and never test a collection with a bare `if (items)`:
  ```ts
  const entries = await loadEntries(file);
  if (entries?.length) {
    for (let i = 0; i < entries.length; i++) {
      result.push(entries[i]);
    }
  }
  ```
- **Module constants** used by a single class become members of that class: a private field, or a public one if the template reads it. Keep at module level only what is exported, shared by several classes, or state shared by every instance (counters, caches).

Follow these in every template you write or edit:

- **Order inside an opening tag**: element ref (`#name`) → conditional structural directives (`@if (…) { *x(…) }`) → structural directives (`*x(…)`) → conditional directives (`@if (…) { @@x(…) }`) → directives (`@@x(…)`) → conditional attributes and inputs (`@if (…) { name="…" }`) → attributes and inputs, then class bindings (`[class.x]="{…}"`) → conditional events (`@if (…) { (name)="…" }`) → events (`(name)="…"`). "Conditional" means any `@if`/`@else`/`@switch` block inside the tag. The last four groups keep this order inside a directive's parentheses too. Keep each conditional block to a single group when you can. When the branches of one condition need different groups, keep a single `@if`/`@else` in the position of its first group.
  ```html
  <button
    *exVisibleWhen(condition="{shown()}")
    @if (highlighted()) {
      @@exTint(color="#fde68a")
    }
    @@exTooltip(text="{hint()}" (opened)="track($event)")
    @if (locked()) {
      disabled
    }
    type="button"
    class="{`btn ${kind()}`}"
    @if (editable()) {
      (click)="edit()"
    }
    (focus)="select()"
  >
    Edit
  </button>
  ```
- **Spaces**: an interpolation in a property binding has no spaces inside its braces (`title="{title()}"`), one in the text has one on each side (`{ title() }`), and a control-flow keyword is followed by a space (`@if (x)`). The braces follow JavaScript: `{` on the line of the keyword, `}` on its own line, except `} @else {`. The language server formats a template with these rules (Format Document; line width `xaendar.format.printWidth`, default 120).
- **Conditions** (in classes and templates alike):
  - Never test a condition and its negation separately (`if (x) { … } if (!x) { … }`, `@if (x) { … }` … `@if (!x) { … }`): use `if`/`else`, `@if`/`@else`.
  - Never compare the same value with several constants in separate `if`s or in an `else if` chain (`if (kind === 'a') … else if (kind === 'b') …`): use `switch (kind)` / `@switch (kind())`, with a `default` when the other values need handling too. In templates, `@switch` also avoids the generated names shared by `@else if` branches.
- **Line breaks**: inside `<pre>`, keep the content exactly as written. Elsewhere:
  - Every element and block starts on its own line after another node. An element containing another element puts each child on its own line, indented, and its closing tag on its own line.
  - An element containing only text and interpolations stays on one line (`<span>{ total() } items</span>`) while its opening tag is short and the line stays within about 120 characters. Otherwise the text goes on its own indented line, unless it already touches both tags (`<x-card>Text</x-card>`): on its own line it would gain spaces at both ends, visible when the content flows inline (e.g. slotted).
  - An opening tag longer than the line fills each line with its items up to the width, the next lines indented, and ends with `>` / `/>` on the last one. An opening tag containing a conditional block has one item per line and `>` / `/>` on its own line.
  - Control-flow blocks are never inline.
  - Xaendar drops whitespace-only text holding a line break: write `{ ' ' }` between two elements on separate lines that need a space, and keep punctuation on the line of the element it follows (`<code>a</code>,`). A line break inside a text is kept, and renders as a space.

## Verifying work

- `xd build` (or `/xaendar:check`) prints template errors in red with the prefix `Xaendar:`, then type-checks the whole project as `tsc --noEmit` does (`[TypeChecker] Type check failed`); a stylesheet that does not compile ends it with `Build failed` and `[plugin xaendar] RolldownError: Failed to compile style - <path>`. It fails on any of them.
- `xd start` checks each file as it serves it, and does not serve a file with type errors: they show in the terminal and in the Vite overlay.
- `xd test` (or `/xaendar:test`) runs the specs in happy-dom, and prints the template errors of the components they import as `Xaendar:` blocks, above the results.
- The language server of this plugin, when it runs, reports the errors of a template as you edit it; `xd build` stays the check before finishing.

To look up a compiler or runtime message, search [references/errors.md](references/errors.md) for its text.

## References

- [references/template-syntax.md](references/template-syntax.md): the full template language, its limits, and what does not exist
- [references/api.md](references/api.md): every public export of `@xaendar/core`, `@xaendar/core/signals`, `@xaendar/signals`, and `xaendarPlugin`
- [references/errors.md](references/errors.md): compiler, build, runtime and CLI messages, with cause and fix
- [references/patterns.md](references/patterns.md): stores, async data, forms, lists, routing, HTML rendering, theming, DOM work, lazy loading
- [references/angular.md](references/angular.md): porting Angular components, directives and services
