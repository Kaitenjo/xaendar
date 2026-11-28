---
name: xaendar
description: Writing, editing, testing and debugging Xaendar Web Components — `*.xd.component.ts` classes, `*.xd.component.html` templates, directives, signals from `@xaendar/core/signals`, stylesheets, and the `xd` CLI. Use whenever a project depends on `@xaendar/*`, a file ends in `.xd.component.ts`/`.xd.component.html`/`.directive.ts`, the user mentions Xaendar, `@WebComponent`, `CustomElement`, `@Property`, `@Event`, `@Model`, `@Query`, `@HostAttribute`, `@HostListener`, `createComponent`, `renderToString` or `xd new`/`start`/`build`/`test`/`prerender`, asks for server-side rendering of Xaendar components, or asks to port Angular code to Xaendar.
---

# Xaendar

Xaendar builds Web Components from a template language extending HTML5. No virtual DOM: the compiler wires each DOM node to the signals it reads. Every component is a real custom element with an open shadow root. The syntax resembles Angular's but is a different, much stricter language: check [references/template-syntax.md](references/template-syntax.md) before carrying Angular habits over; to port Angular code, read [references/angular.md](references/angular.md).

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
    ├── bootstrap.ts    imports the root component for its effects
    ├── styles.<ext>    page styles: they do not reach inside components
    └── my-app-root/    my-app-root.xd.component.ts / .html / .<ext> / .spec.ts
```

- `xd` comes from `@xaendar/cli` (`npm i -g @xaendar/cli` for `xd new`; `npx xd` in a project). Without `--style`, `xd new` asks on the terminal.
- `main.ts` loads the app with a dynamic import: a static one evaluates `@xaendar/core` before `loadSignals()` (`ReferenceError: Signal is not defined`).
- A component or directive is defined when its module is evaluated. A template's module imports its `@import`s, so importing the root in `bootstrap.ts` defines everything the templates use. A class used only from TypeScript (`createComponent`, `@Query(Class)`) is imported by the module using it.
- `xd generate component <name> -p <folder>` (`xd g c`, `-f` overwrites) creates `<folder>/<name>/` with `<PascalCase>Component`, template, stylesheet (format of `xaendar.json`) and spec.
- Lazy loading: `@import lazy { X } from '…'` type-checks a tag without loading its module (load it with `import()`), and `@defer (triggers) { … }` loads the modules only its content renders when a trigger fires (see [references/template-syntax.md](references/template-syntax.md); specs drive it with `@xaendar/core/testing`, see the `test` skill). A tag rendered before its class is defined shows nothing until then, keeping the bindings set meanwhile for its inputs.
- Server-side rendering (`xd new --ssr`, `ssr` in `xaendar.json`, `@hydrate`, `@client`, `xd prerender`) and libraries in a workspace (`xd generate library`, `libs`): see [references/patterns.md](references/patterns.md).

## A component

```ts
// counter/counter.xd.component.ts
import { CustomElement, Event, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { Aliased, InputSignal } from '@xaendar/core/signals';

@WebComponent({
  selector: 'app-counter',                       // lowercase, with a dash; string literals only
  styleUrl: './counter.xd.component.css',        // optional; .css, .scss, .sass or .less
  templateUrl: './counter.xd.component.html'
})
export class CounterComponent extends CustomElement {
  @Property(0)
  public accessor start!: InputSignal<number>;
  @Property.required({ alias: 'label' })               // bound as label="…" everywhere; the type declares it too
  public accessor caption!: Aliased<InputSignal<string>, 'label'>;
  @Event()
  public accessor changed!: Output<number>;
  public readonly count = signal(0);
  public readonly total = computed(() => this._computeTotal());

  public increment(): void {
    this.count.update(count => count + 1);
    this.changed.dispatch(this.total());
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
- Extend `CustomElement` (components) or `CustomDirective<E>` / `StructuralDirective` (directives).
- Inputs: `@Property(default)` / `@Property.required()` on `public accessor x!: InputSignal<T>`. Outputs: `@Event()` on `public accessor x!: Output<T>`; give it a type argument when the parent reads it (without one `$event` is `CustomEvent<null>`).
- An input the component also writes (a toggle's `checked`, a stepper's `value`) is one model: `@Model(default)` / `@Model.required()` on `public accessor value!: ModelSignal<T>`, never `@Property` + `@Event` `xChange` + a local copy. `set(v)`/`update(fn)` dispatch `valueChange` (detail: the value) only when it changes, never when the parent sets it. The parent binds it with `[(x)]="signal"`: a writable signal (a `signal()`, its own model, a variable or property holding one), no braces, no `()`; it means `x="{signal()}" (xChange)="signal.set($event.detail)"`.
- Queries: `@Query`, `@Query.all`, `@Query.content`, `@Query.contentAll` on `accessor x!: QuerySignal<…>`, taking a CSS selector, a component class or a directive class (giving its instances); `@Query.ref('name')`/`refAll`/`refRequired` find the elements of a ref `#name`; `@Query.required`/`contentRequired` drop `null` and throw when read with no match. View queries fill after the render, content queries after `afterRender`. Content queries look into the light DOM, slotted or not (Angular's `contentChild`/`contentChildren`): `{ descendants }` defaults to `true` for `@Query.content`, `false` for `contentAll`; `slot` is a plain attribute (`'[slot="footer"]'`).
- Host element (the component, or a custom directive's element): `@HostAttribute('aria-checked' | 'class.on')` on a field, getter or accessor, `@HostListener('click' | 'window:resize' | 'document:keydown', options?)` on a method (event typed by its name). Applied at each connection (before `afterRender`; after a directive's `onInit`), removed at disconnection; prefer them to effects and listeners set up in `onInit` and undone in `onDestroy`. `null`/`undefined` are no opinion (the template or directives writing the attribute decide, or it is removed), `false` removes, `true` writes it empty: write ARIA states as `String(value)`.
- To extend a native element, keeping its semantics, focus, forms and accessibility (a button, link, input, table row), declare a customized built-in element: `@WebComponent({ selector: 'copy-button', extends: 'button' })` on `class CopyButtonComponent extends customElementOf(HTMLButtonElement)` (a tag whose class is `HTMLElement`, as `section`, `nav`, `article`, extends `CustomElement`); templates write `<button is="copy-button" label="…">`, `is` static. Only a tag accepting a shadow root (`div`, `span`, `p`, `section`, `article`, `aside`, `nav`, `header`, `footer`, `main`, `blockquote`, `h1`–`h6`, `body`) takes `templateUrl`/`styleUrl`; on the others there is no template: the component adds inputs, events, host bindings and host directives to the native element, whose content is the one its tag holds. Safari supports none: the page loads a polyfill (`@ungap/custom-elements`) first. `xd test` (happy-dom) calls none of their lifecycle callbacks.
- Never name an input after an attribute every element reflects (`id`, `title`, `hidden`, `lang`, `tabIndex`, `aria-*`…): the build warns, since `title="…"` would set the input (the native attribute then needs `attr.title`).
- Never name a member after an `HTMLElement` member (`title`, `lang`, `hidden`, `remove`, `click`, `attributes`, `matches`, `id`, `style`…): TS2416 and cascading decorator errors. Rename it and keep the attribute with `alias`: `@Property('ts', { alias: 'lang' }) accessor language!: Aliased<InputSignal<string>, 'lang'>`. Templates, `createComponent` and `renderToString` bind an aliased input only by its alias.
- A `transform` taking another type declares it as the second type argument (`@Property(0, { transform: (value: string) => Number(value) }) accessor size!: InputSignal<number, string>`), or `@Property` does not compile.
- Template members are `public`. A module constant, function, enum or signal the template reads is imported with `@import`, never aliased by a member. State and logic stay in the class: import types, enums, shared helpers and store signals, not everything just because it is possible.
- A module signal is read by the class directly (`count()`), never copied into a member (`public readonly count = count;`) or forwarded by a method. Bindings follow every signal they read at runtime, however they reach it. Annotate a member holding a signal created elsewhere with its `@xaendar/core/signals` type (`count: Signal<number> = readCount()`; your own alias is not recognized) so `@if` narrows it. A member holding the value (`count = readCount()()`) is read once: its bindings never change.
- Lifecycle: `constructor` (once; nothing rendered) → `onInit()` (every connection, before render) → render → `afterRender()` (elements and view queries available) → `onDestroy()` (every disconnection). An element removed by its template is destroyed, and rendering it again creates a new instance: never move, remove or reattach elements with DOM APIs. Create effects with `this.effect(fn)` in `onInit`, or `afterRender` when they use the template's elements (in a field or the constructor they run before inputs are bound); they are disposed with the component, and their disposer does nothing afterwards. Remove manual `window`/`document` listeners in `onDestroy`, with a stable arrow-function field.
- With `ssr` in `xaendar.json`, the constructor, field initializers, `onInit` and the render also run on the server, without `document`/`window`: guard with `typeof document !== 'undefined'` or move the code to `afterRender` or an effect (browser only). Module state is shared by every request.
- A parent binds a child's inputs and listeners before inserting it: `onInit` and the first render see them, and events emitted from `onInit` reach the parent. Still read inputs reactively: bound values change.
- In a directive, `this.element` is unavailable in the constructor: set up in `onInit` (`this.effect` works there). A directive starts before its element's children are rendered: wait a microtask to read them.
- Built-in directives of `@xaendar/directives` (see [references/api.md](references/api.md)):
  - entering/leaving animations: `@@animation(enter="fade-in" leave="fade-out")` (a class, or a function returning a promise), never a delayed signal change: a block removes its elements at once, and only `onLeave` (core, called in a directive's `onInit`) keeps one in the DOM while it leaves;
  - computed or many classes/styles: `@@class(value="{…}")`, `@@style(value="{…}")` (Angular's `ngClass`/`ngStyle`: a string, list, set or object of conditions; an object of properties, `'width.px'` keys included), never `classList`/`style` written in an effect: they merge with the template's `class`/`style` (which win) and render on the server. For a few known keys use `class.x`/`style.x`;
  - an HTML string: `@@innerHtml(html="{html}")` on an empty element, never `innerHTML` by hand: sanitized (`options`, `sanitizer`, `trustHtml` for HTML the app controls), written on the server too;
  - a component whose class is chosen at runtime: `@@componentOutlet(component="{card()}" options="{cardOptions}")` (Angular's `ngComponentOutlet`), recreated when the class or the `options` object changes: keep `options` in a field and bind what changes through its getters.
- Create components in code (toasts, dialogs, panels) with `this.createComponent(Class, options)` of components and custom directives; `document.createElement` gives no inputs (only for a root element).
  ```ts
  const toast = this.createComponent(ToastComponent, {
    target: document.body,
    properties: [{ message: () => this.message() }, { condition: () => this.urgent(), level: () => 'error' }],
    events: [{ closed: () => { toast.destroy(); } }],
    directives: [TooltipDirective],
    content: [document.createTextNode('Saved')]
  });
  ```
  Without `target` (or options) it goes into the host element. Getters run in effects; a group with a `condition` resets its inputs to their defaults when it stops holding; an input goes in one group only; no structural directives. The component is destroyed with its creator, after `onDestroy`; `toast.destroy()` does it earlier, while removing the element with DOM APIs leaves its bindings alive.

**Template** (full language in [references/template-syntax.md](references/template-syntax.md)):
- Read every signal of the class with `()`: `@Property`, `@Model`, `@Query`, `signal`, `computed` members and those of host directives (`{ label() }`, `@if (loading())`, `title="{caption()}"`). An input is a signal, not Angular's plain `@Input()` value: without the call `@if (loading)` is always true, `{ label }` renders the object, `type="{type}"` passes the signal. The compiler reports it only where the type does not fit; a signal without the call is right where the signal itself is passed (a listener argument, `[(x)]="sig"`). Without parentheses go only template variables (`@let`, `@for` items, `$index`, `<template>` parameters) and members holding plain values.
- `{ expr }`, not `{{ }}`. A literal `@ < { }` is `&commat;`, `&lt;`, `&lbrace;`, `&rbrace;` or `{ '@' }`, `{ '<' }`, `{ '{' }`, `{ '}' }`. Double quotes around every attribute value. Self-close every element without content, native ones too (`<div class="spacer" />`, `<input />`).
- An attribute is fully static or one expression: `class="{`btn ${kind()}`}"`, not `class="btn { kind() }"`. One class: `class.name="{expr}"`; one style property: `style.name="{expr}"` (`style.width.px` takes a number, `style.--accent`); one part exposed to `::part()`: `part.name="{expr}"`, and `exportparts="inner: outer"` forwards the parts of an inner component. `class`/`style`/`part` merge key by key with directives and component (template > directives > component, a single key > the string); other attributes merge whole with the same precedence; `null`/`undefined` are no opinion. `attr.name="…"` always writes the attribute, never a component input (`attr.class`/`attr.style`/`attr.part` are errors).
- No `<script>`/`<style>` in a template (errors). Binding an expression to `on*` or `srcdoc`, to the `sandbox`/`allow`/`allowfullscreen`/`referrerpolicy`/`csp`/`credentialless` of an `<iframe>`, to the `attributeName` of an SVG `<animate>`/`<set>` (or its `to`/`from`/`by`/`values` when it animates `href`), to the `http-equiv` of a `<meta>` or the `content` of a refresh is an error (`security.rejectUnsafeBindings` of `xaendar.json`, default `true`; `@HostAttribute` throws the same at run time): listen with `(event)`, write the attribute statically. Bound URLs are checked at run time, server and `@HostAttribute` included: `security.urls` (default `"remove"`, leaving the attribute out; `"warn"` writes it with a warning) for `javascript:`/`vbscript:`/non-media `data:` in `href`/`src`/`srcset`/`ping`/`action`…, `security.resourceUrls` (default `"remove"`) for absolute URLs loading a resource (`<iframe src>`, `<embed src>`, `<object data>`, `<link href>`, `<base href>`) from an origin not in `security.trustedOrigins`. Mark a URL the app builds with `trustUrl(url)` / `trustResourceUrl(url)` of `@xaendar/core` where it is built, never turn the checks `"off"` for it. `security` is the project's alone, applied to the components of its libraries too: a library of `libs` declares none, and its templates are checked with the defaults.
- A listener is one method call with expression arguments (`save($event.key, count() + 1)`): no assignments, arrow functions or statements. Key events as in Angular: `(keydown.enter)`, `(keyup.escape)`, `(keydown.control.shift.z)` (modifiers matched exactly), `(keydown.code.keya)`; same in `@HostListener('document:keydown.escape')`. No `.prevent`/`.stop`: call `preventDefault()` in the method.
- Boolean attributes (`disabled`, `checked`): bind a boolean (`disabled="{busy()}"`, `false` removes it) or use a conditional binding in the tag. `aria-*` and enumerated attributes (`draggable`, `spellcheck`, `contenteditable`) get `"true"`/`"false"`; bind `String(x)` where another attribute must keep the text `"false"`.
- Expressions allow `!` but no `new`, arrow functions or assignments. `as Type` closes a whole interpolation (`{ value() as string }`) or casts a call argument (`(input)="search($event.target as HTMLInputElement)"`, `{ format(value() as Date) }`, `@render`): type-check only.
- `@import { X } from './relative/path.xd.component.ts'` at the top for every component and directive used (packages and `tsconfig.json` aliases work; a package's components only when built by `xd build` as a library, with its `xaendar-manifest.json`), and for the functions, constants, enums, signals and types the expressions read. Tags of other libraries go in `customElements` of `xaendar.json`.
- `@for (item of items(); track item.id) { … } @empty { … }`: arrays, numbers, any iterable (`Map`, `Set`, generators), never strings. The item, `$index`, `$first`…`$count` are values read without parentheses (`item.name`, `$index + 1`), like `@let` and `<template>` parameters: calling one is a compile error unless it holds a function. Without `track` the item is the key.
- Control flow: `@if (x) {` with a space, one block per line.
- `<template row(item: Item)>` declares a template rendered by `@render row(item)`. It is also a value, `TemplateRef<[item: Item]>`: pass it as an input (`rowTemplate="{row}"`) or as content (a child of the component's element, read with `@Query.contentTemplate<[item: Item]>('row')`); the component renders it with `@render rowTemplate()(item)`, its content still reading the parent. A `<template>` without `name(…)` is the plain element, static content cloned by code.

**Styles**
- `styleUrl`: `.css`, `.scss`, `.sass`, `.less` (`sass`/`less` in the devDependencies). Sass/Less `@use`/`@import` resolve at build time; an `@import` in a `.css` is dropped, and a relative `url()` resolves against the page: use absolute paths (`public` folder).
- Page styles and resets do not enter shadow roots, and `:root` matches nothing in a component: use `:host` (custom elements are `display: inline` by default), `:host(.x)`, `::slotted()`, `::part()` and CSS custom properties.

**Signals**: `signal`, `computed`, `effect`, `untracked` from `@xaendar/core/signals`. Read by calling (`count()`) or `get()`, in templates too; write with `.set(v)`/`.update(fn)`. Values compare with `Object.is`: write new arrays/objects, never mutate. Effects rerun in a microtask. Shared state: modules exporting read-only `computed`s and functions; there is no DI.

## Code conventions

In every class you write or edit, unless the project states otherwise:

- **Member order**: public fields (decorated accessors included) → protected → private → getters and setters (public, protected, private) → `constructor` → `onInit` → `afterRender` → public methods → protected → private → `onDestroy`. Static members go with their kind and visibility. Fields run in declaration order: a public field needing a private one eagerly is declared without initializer and assigned in the constructor.
- **Decorator options**: `selector` first, the rest alphabetical (`selector`, `hostDirectives`, `styleUrl`, `templateUrl`).
- **Private members** start with `_` (`private readonly _labels`, `private _write()`).
- **Computed fields** never inline their callback, one-liners included: a private `_compute<FieldName>()` with an explicit return type, called by the field (module-level store computeds stay inline):
  ```ts
  public readonly total = computed(() => this._computeTotal());

  private _computeTotal(): number {
    return this.start() + this.count();
  }
  ```
- **Input types** narrower than the default infers (literal unions, empty arrays, nullable, `unknown`) go in the generic of `@Property`, same type on the accessor; never `InputSignal<string>` cast on read (`this.language() as CodeLang`). Statically bound inputs (`kind="tip"`) are type-checked as `string`, so they cannot use a literal union, unless the input declares `attribute` (`@Property(0, { attribute: true })`): then the static value is written into the attribute and converted by the component.
  ```ts
  @Property<Aliased<InputSignal<CodeLang>, 'lang'>>('ts', { alias: 'lang' })
  public accessor language!: Aliased<InputSignal<CodeLang>, 'lang'>;
  ```
- **Names**: no one-letter identifiers (variables, parameters, arrow callbacks, catch bindings, type parameters, `@for` items and aliases); only a `for` counter is `i` (`j`, `k` nested).
- **Strings**: never `+`/`+=`: template literals (`` `target <${element.localName}>` ``, `` out = `${out}${chunk}` ``).
- **Missing DOM APIs**: a global the TS DOM library lacks (`trustedTypes`, a `window` property) is declared by module augmentation in a `.d.ts` (`declare global { var trustedTypes: Factory | undefined; }`, or `interface Window { … }`), never read through a cast of `window`/`globalThis`.
- **`void`**: never `void this._load(id)`: a plain call, or `await` / `.then`/`.catch` when the promise must be handled.
- **Loops**: never `.forEach`. Arrays: indexed `for` (`for (let i = 0; i < items.length; i++)`, `const item = items[i]`); `Map`/`Set`: `for…of` on them. `map`, `filter`, `some`, `reduce` are fine.
- **Empty collections**: never create an empty array, `Map`, `Set` or object only to loop over or spread it, nor spread one that may be empty (several times slower than an `if`). A function whose collection may be missing returns `undefined`; the caller checks `?.length`/`?.size` on a `const`, then loops. Never `?? []`, `|| []`, `?? new Map()`, `...(x ?? [])`, `...(condition ? [item] : [])`, `...(x ?? {})`, `...(condition ? { key: value } : {})`, `...condition && { key: value }` (assign an optional member under an `if` instead), nor a bare `if (items)`:
  ```ts
  const entries = await loadEntries(file);
  if (entries?.length) {
    for (let i = 0; i < entries.length; i++) {
      result.push(entries[i]);
    }
  }
  ```
- **Module constants** used by one class become its members (private, or public if the template reads them); module level keeps only what is exported, shared, or state shared by every instance (counters, caches).

In every template you write or edit:

- **Opening tag order**: element ref (`#name`) → conditional structural directives (`@if (…) { *x(…) }`) → structural directives → conditional directives (`@if (…) { @@x(…) }`) → directives → conditional attributes/inputs → attributes/inputs, then `class.x`, then `style.x`, then `part.x` → conditional events → events. "Conditional" means any `@if`/`@else`/`@switch` in the tag. The last four groups keep this order in a directive's parentheses. Keep each conditional block to one group when you can; when branches need different groups, keep a single `@if`/`@else` in the position of its first group.
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
- **Spaces**: property-binding interpolations without inner spaces (`title="{title()}"`), text ones with a space each side (`{ title() }`), a space after a control-flow keyword (`@if (x)`). Braces follow JavaScript: `{` on the keyword's line, `}` on its own, except `} @else {`, `} @empty {`, `} @placeholder {`, `} @catch (error) {`, `} @loading {`, `} @error (error) {`. The language server formats with these rules (Format Document; width `xaendar.format.printWidth`, default 120).
- **Conditions** (classes and templates):
  - never a condition and its negation tested separately (`if (x) … if (!x)`, `@if (x)` … `@if (!x)`): `if`/`else`, `@if`/`@else`;
  - when `if` and `else` each hold one line, a ternary (`return x ? a : b;`, `x ? open() : close();`), unless a branch needs `throw`, `break`, `continue` or a lone `return`;
  - never one value compared with several constants in separate `if`s or an `else if` chain: `switch (kind)` / `@switch (kind())`, `default` when needed (`@switch` also avoids the generated names shared by `@else if` branches).
- **Line breaks** (never inside `<pre>`):
  - every element and block starts on its own line; an element containing elements puts each child on its own indented line and its closing tag on its own line;
  - an element with only text and interpolations stays on one line (`<span>{ total() } items</span>`) while short (~120 characters); otherwise the text goes on its own indented line, unless it touches both tags (`<x-card>Text</x-card>`), where it would gain visible spaces;
  - a long opening tag fills each line up to the width, next lines indented, `>`/`/>` on the last; one containing a conditional block has one item per line and `>`/`/>` on its own line;
  - control-flow blocks are never inline;
  - whitespace-only text holding a line break is dropped: write `{ ' ' }` between elements on separate lines that need a space, and keep punctuation on the line of the element it follows (`<code>a</code>,`). A line break inside a text renders as a space.

## Verifying work

- `xd build` (or `/xaendar:check`) prints template errors in red prefixed `Xaendar:`, then type-checks the project as `tsc --noEmit` (`[TypeChecker] Type check failed`); a stylesheet that does not compile ends with `Build failed` and `[plugin xaendar] RolldownError: Failed to compile style - <path>`. Any of them fails it. In a workspace it builds and checks the libraries, not the project testing them (`xd start` checks that).
- `xd start` serves each file at once and type-checks it in the background with the templates: the errors reach the terminal and the Vite overlay a moment later, the file being served anyway. `xd build` fails on them.
- `xd test` (or `/xaendar:test`) runs the specs in happy-dom, printing the template errors of the components they import as `Xaendar:` blocks above the results.
- This plugin's language server reports template errors while editing; `xd build` stays the final check.

Look up a compiler or runtime message by its text in [references/errors.md](references/errors.md).

## References

- [references/template-syntax.md](references/template-syntax.md): the full template language, its limits, what does not exist
- [references/api.md](references/api.md): every public export of `@xaendar/core`, `@xaendar/directives`, `@xaendar/forms`, `@xaendar/core/signals`, `@xaendar/core/testing`, `@xaendar/signals`, `@xaendar/build-tools` (`xaendarPlugin`, `buildLibrary`), `@xaendar/ssr`, `@xaendar/ssr/dom`
- [references/errors.md](references/errors.md): compiler, build, runtime and CLI messages, with cause and fix
- [references/patterns.md](references/patterns.md): stores, async data, forms, lists, routing, HTML rendering, theming, DOM work, components created in code, lazy loading, server-side rendering, libraries
- [references/angular.md](references/angular.md): porting Angular components, directives and services
