# Patterns

Idiomatic ways to cover what Xaendar does not ship: there is no DI, router, forms module, HTTP client or two-way binding.

## Shared state (a store)

A module is evaluated once per page: its signals are shared by every component importing it. Keep the writable signal private, export read-only `computed`s and the operations; templates import what they read.

```ts
// cart.store.ts
import { computed, signal } from '@xaendar/core/signals';
import type { Computed } from '@xaendar/core/signals';
import type { CartLine } from './cart-line.type';

const items = signal<CartLine[]>([]);

export const lines: Computed<CartLine[]> = computed(() => items());
export const count: Computed<number> = computed(() => items().reduce((total, line) => total + line.quantity, 0));

export function add(product: string): void {
  items.update(current => [...current, { product, quantity: 1 }]);
}
```

```html
@import { add, count } from './cart.store.ts'

<button (click)="add('Tea')">Add tea</button>
<p>{ count() } pieces</p>
```

Module state outlives the components: reset it explicitly when needed (between specs, at logout).

## Async data

Signals hold values, not promises: keep the state of the request in signals and render it with `@switch`.

```ts
public readonly status = signal<'idle' | 'loading' | 'error' | 'ready'>('idle');
public readonly user = signal<User | null>(null);
private _controller: AbortController | null = null;

public async load(id: number): Promise<void> {
  this._controller?.abort();
  const controller = new AbortController();
  this._controller = controller;
  this.status.set('loading');
  try {
    this.user.set(await fetchUser(id, controller.signal));
    this.status.set('ready');
  } catch (error) {
    // An aborted request was replaced by a newer one, which owns the state
    if (!controller.signal.aborted) {
      this.status.set('error');
    }
  }
}

public onDestroy(): void {
  this._controller?.abort();
}
```

- A newer request aborts the previous one (or a request counter discards stale answers), and `onDestroy` aborts the pending one.
- To reload when an input changes, read the input in an effect and start the request untracked, so that what it reads is not a dependency:
  ```ts
  public onInit(): void {
    this.effect(() => {
      const id = this.userId();
      untracked(() => this.load(id));
    });
  }
  ```
- Only the signals read before the first `await` are tracked, in effects and in async `shouldRender` alike: read them at the top.

## Forms

- Read each field with `(input)` (text) or `(change)` (select, checkbox) calling a method: `this.name.set((event.target as HTMLInputElement).value)`, or pass a ref property: `(input)="setName(field.value)"`.
- Validate with a `computed` over the field signals; show the errors after the first submit attempt.
- `<form novalidate (submit)="submit($event)">`, and `event.preventDefault()` in the method.
- `value` and `checked` bindings are only the initial state. To write a field from the state (reset, formatting), use a directive writing the property:

```ts
@Directive({ selector: 'appBindValue' })
export class BindValueDirective extends CustomDirective<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  @Property('')
  public accessor value!: InputSignal<string>;

  public onInit(): void {
    // The options of a select are rendered after onInit
    queueMicrotask(() => {
      this.effect(() => {
        const value = this.value();
        // Writing the same value would move the caret to the end
        if (this.element.value !== value) {
          this.element.value = value;
        }
      });
    });
  }
}
```

A field without bound value is emptied by `form.reset()`; `new FormData(form)` reads a whole form.

## Lists and CRUD

- The list is a signal holding an array, replaced at every change: `items.update(list => [...list, item])`, `list.filter(…)`, never `push` or `splice`.
- `@for (item of visible(); track item().id)`, with ids from a counter or the server: never the position or an editable field.
- Filters, sorting and totals are `computed`s over the list.
- A field that changes often can be a signal inside the item (`quantity: signal(1)`): updating it rewrites one cell, not the row.

## Routing

A router is a module: a signal with the path, a `computed` matching it against the routes, and an `@switch` rendering the page.

```ts
// router.ts
export const path = signal(location.hash.slice(1) || '/');
window.addEventListener('hashchange', () => path.set(location.hash.slice(1) || '/'));

// match: your own function, comparing the path with patterns such as /users/:id and returning { name, params }
export const route = computed(() => match(path()));

export function navigate(target: string): void {
  location.hash = target;
}
```

```html
@import { route } from './router.ts'
@import { UserPageComponent } from './user-page.xd.component.ts'

@switch (route().name) {
  @case ('user') {
    <app-user-page user="{route().params['id'] ?? ''}" />
  }
  @default {
    <app-not-found />
  }
}
```

- Links keep their `href`; a click listener calls `preventDefault()` and navigates. Mark the active one with a conditional `aria-current="page"`.
- Route parameters reach the page as inputs. The `@switch` destroys the page it leaves: state that must survive goes in a module.
- Pages loaded on demand: `@import lazy`, and render the case only after the module is loaded (see Lazy loading).

## Rendering HTML

Interpolations always create text nodes. To render markup, a directive writes `innerHTML` from an effect, on an empty element; sanitize or escape HTML you do not control.

```ts
@Directive({ selector: 'appInnerHtml' })
export class InnerHtmlDirective extends CustomDirective<HTMLElement> {
  @Property('')
  public accessor html!: InputSignal<string>;

  public onInit(): void {
    this.effect(() => {
      this.element.innerHTML = this.html();
    });
  }
}
```

The inserted markup is not a template: no bindings, listeners or directives, and every change replaces the content. The stylesheet of the component styles it.

## Theming

- Tokens are custom properties declared on an ancestor (`:root` in `styles.css`, or `[data-theme='dark']`), read in components with `var(--accent, #2563eb)`. Tokens local to a component go on `:host`.
- Switch the set of tokens with a signal bound to `data-theme`; to avoid a flash, an inline script in `index.html` applies the stored theme before the scripts load.
- `part="heading"` lets users restyle one element with `::part(heading)`; nothing else crosses the shadow root.

## DOM work

- Reach elements with a query (`@Query`, `@Query.ref`), and work on them in `afterRender` or in an effect reading the query: it runs again when the element appears or disappears (focus a field as soon as an `@if` renders it).
- Draw (canvas, charts) in `this.effect` created in `afterRender`: it reruns when the signals it reads change.
- `ResizeObserver`, `IntersectionObserver`, `MutationObserver`: connect in `afterRender`, disconnect in `onDestroy`; their callbacks write signals.
- Listeners on `window` or `document`: add in `onInit`, remove in `onDestroy` with the same arrow-function field. Listeners in the template need no cleanup.
- Elements of other libraries that need object properties: create them in `afterRender` (`new VanillaGauge()`, so the import is kept and the element defined), append them to an element of the template, and set the properties in an effect.
- Do not change bound attributes imperatively (`classList.add` on a bound `class` is lost at the next update): change the state instead.

## Components created in code

Notifications, dialogs and panels whose number or place is known only at runtime: `this.createComponent` (see api.md).

```ts
public notify(text: string): void {
  const stack = this.stack();
  if (!stack) {
    return;
  }

  const notification = this.createComponent(NotificationComponent, {
    target: stack,
    properties: [{ condition: () => this.urgent(), level: () => 'urgent' }],
    // A body in braces: returning the call would make the type of notification depend on itself
    events: [{ dismissed: () => { notification.destroy(); } }],
    content: [document.createTextNode(text)]
  });
}
```

## Lazy loading

```html
@import lazy { ReportComponent } from './report/report.xd.component.ts'

@if (reportReady()) {
  <app-report data="{data()}" />
}
```

```ts
public async openReport(): Promise<void> {
  await import('./report/report.xd.component');
  this.reportReady.set(true);
}
```

The tag is rendered only once the module has defined it: an element rendered before receives its bindings as plain attributes, and keeps its default inputs. `:not(:defined)` styles a tag while it waits.
