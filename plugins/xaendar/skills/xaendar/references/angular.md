# Porting Angular code

## Correspondences

| Angular | Xaendar |
| --- | --- |
| `@Component` | `@WebComponent({ selector, styleUrl, templateUrl })` on a class extending `CustomElement`, in a `.xd.component.ts` file; `selector` needs a dash |
| `imports: [...]` of a standalone component | `@import { X } from './x.xd.component.ts'` at the top of the template |
| `input()`, `@Input` / `input.required()` | `@Property(default)` / `@Property.required()` on `public accessor x!: InputSignal<T>` |
| `output()`, `@Output` + `EventEmitter` | `@Event()` on `public accessor x!: Output<T>`, `this.x.emit(value)`: a DOM `CustomEvent`, `$event.detail` in the parent |
| `model()`, `[(ngModel)]`, two-way binding | an input plus an output; for fields, `(input)` + a directive writing the property (patterns.md, Forms) |
| `host: {...}`, `@HostBinding`, `@HostListener` | `@HostProperty('attr' \| 'class.x')`, `@HostEvent('event')` |
| `signal`, `computed`, `effect`, `untracked` | the same names from `@xaendar/core/signals`; `this.effect()` for effects bound to the component |
| `viewChild`, `viewChild.required`, `viewChildren` | `@Query`, `@Query.required`, `@Query.all`, `@Query.ref('name')` on `accessor x!: QuerySignal<…>` |
| `contentChild`, `contentChildren` | `@Query.content`, `@Query.content.required`, `@Query.content.all` |
| `ngOnInit`, `ngAfterViewInit`, `ngOnDestroy` | `onInit`, `afterRender`, `onDestroy`: run at every connection and disconnection |
| `ngOnChanges` | read the inputs reactively: `computed`, `this.effect` |
| attribute directive | `@Directive({ selector: 'appX' })` on a class extending `CustomDirective<E>`, applied with `@@appX(...)` |
| structural directive (`*ngIf`-like) | a class extending `StructuralDirective` with `shouldRender()`, applied with `*appX(...)` |
| `hostDirectives` | the same option of `@WebComponent`, with `{ directive, properties, events }` |
| `{{ expr }}` | `{ expr }` |
| `[attr]="expr"`, `[prop]="expr"` | `attr="{expr}"`: an attribute on native elements, an input on components |
| `[class.x]="cond"` | `[class.x]="{cond}"` |
| `[ngClass]`, `[style.x]`, `[ngStyle]` | `class="{`a ${b()}`}"`, `style="{…}"`, or a conditional binding |
| `@if`, `@for`, `@switch` | the same blocks: `@for` without `@empty`, its variables are signals (`item()`, `$index()`) |
| `@defer` | `@import lazy` and a dynamic `import()` |
| `<ng-content select="…">` | `<slot name="…" />`; children pick it with `slot="…"` |
| `<ng-template #row let-item>` + `ngTemplateOutlet` | `<template row(item: Item)>` + `@render row(item)`, in the same template |
| `@let` | `@let name = value;`, a signal when its value reads one |
| pipes | methods of the class and `computed` signals |
| services, `inject()`, providers | modules exporting signals, `computed`s and functions (patterns.md, Shared state) |
| `Router` | a module signal and an `@switch` (patterns.md, Routing) |
| `HttpClient` | `fetch` in async methods writing signals (patterns.md, Async data) |
| `styleUrls`, `:host`, `::ng-deep` | `styleUrl`, `:host`, `::part()` and custom properties: nothing pierces the shadow root |

## Steps

1. Create the files with `xd generate component <selector> -p <folder>`, then move the class members: inputs, outputs and queries become decorated accessors, state stays in signals, `computed` callbacks move to `_computeX()` methods (SKILL.md, Code conventions).
2. Rewrite the template: single braces, every attribute value in double quotes, self-closed empty elements, one method call per listener, no pipes or event modifiers (`(keydown.enter)` → filter the key in the method), `@import` for every component, directive and module symbol it reads.
3. Replace services with store modules, and `HttpClient` calls with `fetch`.
4. Replace `ng-content` with slots, and component styles that relied on view encapsulation emulation with `:host`, `::slotted()`, `::part()` and custom properties.
5. Run `/xaendar:check` and fix every `Xaendar:` error.

## What works differently

- Bindings on native elements call `setAttribute`: `disabled="{false}"` still disables (use a conditional binding), and `value`/`checked` are only the initial state.
- A removed element is destroyed, and rendered again as a new instance: never move or reattach elements with the DOM APIs.
- Inputs are never written by attributes set from outside the templates, and the hooks run at every connection, not once.
- Expressions cannot assign, create objects with `new`, or declare functions: logic belongs in the class.
