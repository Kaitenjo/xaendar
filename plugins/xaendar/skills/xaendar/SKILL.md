---
name: xaendar
description: Writing, editing and debugging Xaendar Web Components — `*.xd.component.ts` classes, `*.xd.component.html` templates, directives, signals from `@xaendar/core/signals`, and the `xd` CLI. Use whenever a project depends on `@xaendar/*`, a file ends in `.xd.component.ts`/`.xd.component.html`/`.directive.ts`, or the user mentions Xaendar, `@WebComponent`, `CustomElement`, `@Property`, `@Event`, `@Query` or `xd start`/`xd build`.
---

# Xaendar

Xaendar builds Web Components from a template language that extends HTML5. There is no virtual DOM: the compiler wires each DOM node directly to the signals it reads. Every component is a real custom element with an open shadow root. The syntax resembles Angular's, but it is a different and much stricter language. Do not carry Angular habits over without checking [references/template-syntax.md](references/template-syntax.md).

## Project layout

```
my-app/
├── package.json        scripts: start (xd start), build (xd build)
├── xaendar.json        project settings read by the CLI
├── tsconfig.json       also used to type-check the templates
├── vite.config.ts      plain Vite config: xd start/build add Babel (decorators) + xaendarPlugin()
└── src/
    ├── index.html      loads signals.ts, then main.ts
    ├── signals.ts      loadSignals() from @xaendar/signals — must run before @xaendar/core loads
    ├── main.ts         imports every component/directive module so they get defined
    └── my-app-root/
        ├── my-app-root.xd.component.ts
        ├── my-app-root.xd.component.html
        └── my-app-root.xd.component.css
```

A component or directive is defined when its module is evaluated. A class that is never imported at runtime is never defined. Load them all from `main.ts`, for example `import.meta.glob(['./**/*.xd.component.ts', './**/*.directive.ts'], { eager: true });`, or import each one there.

## A component

```ts
// counter/counter.xd.component.ts
import { CustomElement, Event, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

@WebComponent({
  selector: 'app-counter',                       // lowercase, with a dash; string literals only
  templateUrl: './counter.xd.component.html',
  styleUrl: './counter.xd.component.css'         // optional; plain .css only
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
    this.count.update(n => n + 1);
    this.changed.emit(this.total());
  }

  private _computeTotal(): number {
    return this.start() + this.count();
  }
}
```

```html
<!-- counter/counter.xd.component.html -->
<button (click)="increment()" title="{ caption() }">{ caption() }: { total() }</button>
@if (total() > 5) {
  <p>That is a lot</p>
}
```

```html
<!-- a parent template -->
@import { CounterComponent } from './counter/counter.xd.component.ts'

<app-counter start="{ 2 }" label="Clicks" (changed)="log($event)" />
```

## Rules that prevent most failures

**Class**
- Extend `CustomElement` (components) or `CustomDirective<E>` / `StructuralDirective` (directives). Inputs are `@Property(default)` / `@Property.required()` on `public accessor x!: InputSignal<T>`. Outputs are `@Event()` on `public accessor x!: Output<T>`. Queries are `@Query`, `@Query.all`, `@Query.content`, `@Query.content.all` on `accessor x!: QuerySignal<…>`.
- Keep `@Property` defaults literal: a default is copied as written into the templates that bind the input conditionally.
- Give an `@Event` that the parent reads a type argument. `Output` without one gives no `$event`.
- Never name a member after an `HTMLElement` member (`title`, `lang`, `hidden`, `remove`, `click`, `attributes`, `matches`, `id`, `style`, …). It causes TS2416 and cascading decorator errors, and the build does not catch it. Rename the member, and use `alias` to keep the attribute name: `@Property('ts', { alias: 'lang' }) accessor language`.
- Members used by the template must be `public`. Expose module constants as members.
- Expose a module-level signal as `public readonly count = count;`, with no annotation: TypeScript infers the type, and the compiler follows the import to the declaration, so attribute bindings stay reactive. Do not wrap the signal in a function of your own (`count = readCount()`): attribute bindings reading that member are evaluated once, whatever its annotation. A signal taken from another object (`this.log = target.log`) still needs a signal type on the member.
- Lifecycle: `constructor` (once; nothing rendered) → `onInit()` (every connection, before render) → render → `afterRender()` (elements and view queries available) → `onDestroy()` (every disconnection). Moving an element re-renders it. Create effects with `this.effect(fn)` in `onInit`, never in the constructor or a field initializer: they are disposed on disconnection. Remove manual listeners (window, document) in `onDestroy`, using a stable arrow-function field.
- Inputs arrive after the first render: a child's `onInit` and first render see the defaults, and a required input is `undefined` at first. Read inputs reactively, and guard against `undefined` where a throw would abort the rest of the template. Directives, unlike components, receive their inputs before `onInit`.
- In a directive, `this.element` and `this.effect` are unavailable in the constructor. Do the setup in `onInit`.

**Template**: see [references/template-syntax.md](references/template-syntax.md). The essentials:
- Use `{ expr }`, not `{{ }}`. Write a literal `@ < { }` as `{ '@' }`, `{ '<' }`, `{ '\x7B' }`, `{ '\x7D' }`. Use double quotes around every attribute value, and self-close void elements (`<input />`).
- An attribute is fully static or one expression: `class="{`btn ${kind()}`}"`, not `class="btn { kind() }"`. No space before the backtick.
- A listener is one method call with simple arguments: no inline logic, no `(keydown.enter)` modifiers.
- Add or remove boolean attributes (`disabled`, `checked`) with a conditional binding inside the tag, not with `="{ false }"`.
- Import every component and directive used, at the top of the template, with `@import { X } from './relative/path.xd.component.ts'`.
- Write control flow as `@if (x) {` with a space, one block per line, and no `@if/@else` directly inside an `@else`.

**Styles**: use plain `.css` only. A stylesheet's `@import` is dropped, and a relative `url()` resolves against the page. Page styles and resets do not enter shadow roots. Use `:host` (custom elements are `display: inline` by default), `::slotted()`, `::part()` and CSS custom properties for theming.

**Signals**: import `signal`, `computed`, `effect` and `untracked` from `@xaendar/core/signals`. Read a signal by calling it (`count()`), and write it with `.set(v)` / `.update(fn)`. Effects run again in a microtask. For shared state, use modules that export read-only `computed`s and functions; there is no DI.

## Code conventions

Follow these in every class you write or edit (components, directives, plain classes), unless the project states otherwise:

- **Member order**: public fields (including decorated accessors) → protected fields → private fields → `constructor` → `onInit` → `afterRender` → public methods → protected methods → private methods → `onDestroy`. Getters and setters go with the methods of their visibility. Fields run in declaration order: when a public field needs a private one eagerly, declare the public field without an initializer and assign it in the constructor.
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
- **Names**: never one-letter identifiers (variables, parameters and arrow callbacks, loop counters, catch bindings, type parameters, `@for` items and aliases): name what the value is. The build minifies the names anyway.
- **Module constants** used by a single class become members of that class: a private field, or a public one if the template reads it. Keep at module level only what is exported, shared by several classes, or state shared by every instance (counters, caches).

Follow these in every template you write or edit:

- **Order inside an opening tag**: conditional structural directives (`@if (…) { *x(…) }`) → structural directives (`*x(…)`) → conditional directives (`@if (…) { @@x(…) }`) → directives (`@@x(…)`) → conditional attributes and inputs (`@if (…) { name="…" }`) → attributes and inputs → conditional events (`@if (…) { (name)="…" }`) → events (`(name)="…"`). "Conditional" means any `@if`/`@else`/`@switch` block inside the tag. The last four groups keep this order inside a directive's parentheses too. Keep each conditional block to a single group when you can. When the branches of one condition need different groups, keep a single `@if`/`@else` in the position of its first group.
  ```html
  <button
    *exVisibleWhen(condition="{ shown() }")
    @if (highlighted()) {
      @@exTint(color="#fde68a")
    }
    @@exTooltip(text="{ hint() }" (opened)="track($event)")
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
- **Conditions** (in classes and templates alike):
  - Never test a condition and its negation separately (`if (x) { … } if (!x) { … }`, `@if (x) { … }` … `@if (!x) { … }`): use `if`/`else`, `@if`/`@else`.
  - Never compare the same value with several constants in separate `if`s or in an `else if` chain (`if (kind === 'a') … else if (kind === 'b') …`): use `switch (kind)` / `@switch (kind())`, with a `default` when the other values need handling too. In templates, `@switch` also avoids the generated names shared by `@else if` branches.
- **Line breaks**: inside `<pre>`, keep the content exactly as written. Elsewhere:
  - An element containing another element puts each child on its own line, indented, and its closing tag on its own line.
  - An element containing only text and interpolations stays on one line (`<span>{ total() } items</span>`) while its opening tag is short and the line stays within about 120 characters. Otherwise the text goes on its own indented line, unless it already touches both tags (`<x-card>Text</x-card>`): on its own line it would gain spaces at both ends, visible when the content flows inline (e.g. slotted).
  - An opening tag that does not fit on one line, or contains a conditional block, has one item per line and ends with `>` / `/>` on its own line.
  - Control-flow blocks are never inline.
  - Xaendar removes newlines from text and drops whitespace-only text between two elements: write `{ ' ' }` between two elements that need a space, and keep punctuation on the line of the element it follows (`<code>a</code>,`).

## Verifying work

The build does **not** fail on template errors. `xd build` exits 0 even when a template does not compile; the error is printed in red with the prefix `Xaendar:`, and the component ships without a render function. Component classes are not type-checked by the build at all. After changing components, run both checks and read the output:

```bash
npx xd build 2>&1 | grep -A6 "Xaendar:"   # template compile/type errors (empty = OK)
npx tsc --noEmit -p tsconfig.json          # class type errors (HTMLElement name clashes, wrong types, …)
```

Or run the `/xaendar:check` command. Restart `xd start` after changing a `@Property`/`@Event` type, or after creating a template for a class the dev server already loaded: it caches that metadata.

To look up a compiler or runtime message, search [references/errors.md](references/errors.md) for its text. Before concluding that your code is wrong, check [references/known-issues.md](references/known-issues.md): it lists verified framework bugs with workarounds.

## References

- [references/template-syntax.md](references/template-syntax.md): the full template language, its limits, and what does not exist
- [references/api.md](references/api.md): every public export of `@xaendar/core`, `@xaendar/core/signals`, `@xaendar/signals`
- [references/errors.md](references/errors.md): compiler, build, runtime and CLI messages, with cause and fix
- [references/known-issues.md](references/known-issues.md): framework bugs and limitations, with workarounds
