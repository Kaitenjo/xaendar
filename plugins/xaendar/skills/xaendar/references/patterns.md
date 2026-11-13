# Patterns

Idiomatic ways to cover what Xaendar does not ship: there is no DI, router, forms module or HTTP client, and two-way binding (`[(x)]`) covers only the models of components and directives, not native fields.

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

- A form control written as a component (a toggle, a stepper, a date picker) declares its value as a `@Model` and the form binds it with `[(value)]="field"`, `field` a signal of the form.
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
- `@for (item of visible(); track item.id)`, with ids from a counter or the server: never the position or an editable field.
- Filters, sorting and totals are `computed`s over the list.
- A field that changes often can be a signal inside the item (`quantity: signal(1)`): updating it rewrites one cell, not the row.

## Routing

A router is a module: a signal with the path, a `computed` matching it against the routes, and an `@switch` rendering the page.

```ts
// router.ts
export const path = signal(location.hash.slice(1) || '/');
globalThis.addEventListener('hashchange', () => path.set(location.hash.slice(1) || '/'));

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

An element rendered before the module defines it shows nothing until then: the bindings set meanwhile are kept in its properties, which its inputs read once it is defined. `:not(:defined)` styles a tag while it waits.

## Server-side rendering

A project created with `xd new --ssr`, or declaring `"ssr": { "entry": "src/entry-server" }` in `xaendar.json` (without extension), renders each page on the server as declarative shadow roots, which the browser shows before the scripts load; then each component hydrates: it adopts the nodes of the server instead of creating them, and binds its effects, listeners and directives to them. On the server the effects never run, while the custom directives of a native element do up to `onInit` (properties, `onInit`, `@HostProperty`): a directive filling its element with `innerHTML` writes it in `onInit` only when `typeof window === 'undefined'`, so the server writes the content into the HTML, and keeps the assignment in its effect for the browser, where it runs once.

```ts
// src/entry-server.ts
import { loadSignals } from '@xaendar/signals';
import { loadServerDom } from '@xaendar/ssr/dom';

loadSignals();
loadServerDom();

// Loaded afterwards: a static import would be evaluated before the two calls
const { renderToString } = await import('@xaendar/ssr');
const { ProductPageComponent } = await import('./product-page/product-page.xd.component');
const { MyAppRootComponent } = await import('./my-app-root/my-app-root.xd.component');

// url: the path of the request with its query string (/products/42?ref=mail), the same in xd start, server.ts and xd prerender
export function render(url: string): Promise<string> {
  const productId = /^\/products\/(\w+)$/.exec(new URL(url, 'http://localhost').pathname)?.[1];
  return productId ? renderToString(ProductPageComponent, { productId }) : renderToString(MyAppRootComponent);
}
```

- The constructor, the field initializers and `onInit` run on the server, where `document` and `window` do not exist: check `typeof document !== 'undefined'`, or move the code to `afterRender` or an effect, which run in the browser only. Template expressions read the browser globals through `globalThis`, so there they get `undefined` instead of throwing.
- Modules are evaluated once per server process: a store is shared by every request. Keep the state of a request in the components, pass it as inputs from the entry, or put it in the transfer state.
- Start the server and the browser from the same state (read storage, the date or random values in an effect), or the page changes when the scripts load. The inputs given to `renderToString` reach the browser by themselves (`data-xd-inputs`, assigned before the component renders). Data the entry fetches go into the transfer state, read with the same code on both sides; the render does not wait for a request started by a component, so the entry fetches first:
  ```ts
  // entry-server.ts
  const product = await fetchProduct(productId);
  return renderToString(ProductPageComponent, { productId }, { state: { [`product:${productId}`]: product } });

  // product-page.xd.component.ts
  public onInit(): void {
    const product = getTransferState<Product>(`product:${this.productId()}`);
    if (product) {
      this.product.set(product);
    } else {
      fetchProduct(this.productId()).then(loaded => this.product.set(loaded));
    }
  }
  ```
- Inputs and transfer state are JSON plus `undefined`, `NaN`, `±Infinity`, `bigint`, `Date`, `Map`, `Set`: pass the data a function or a class instance is built from, and build it in the component.
- The HTML holds comments marking its dynamic parts for the browser, which adopts the nodes by them: keep them (no minifier stripping comments).
- A block the browser renders otherwise than the server (another branch, other `@for` keys, another structural outcome) is emptied and rendered again with a `console.warn`; the rest stays adopted. A component rendered inside another one hydrates once its parent has adopted it and set its inputs; one whose class is defined later keeps the inputs its parent sets in the properties of its element, which it reads once defined, as in the browser.
- Events before the hydration: `renderToString` writes an inline script after the root of the page, the event contract, which records what the user does until the runtime is there (on the document and on every shadow root, since `change` and `submit` are not `composed`). Once the components holding the targets are hydrated the events are replayed, in order, their default action prevented; an event on a node that no longer exists is dropped. A click arrived before the scripts fires `interaction` too. A `submit` is prevented only for a form that is, or is inside, an element with `(submit)` in its template (`data-xd-submit`): one listened to only with `@HostListener` or a directive leaves the page, and a link whose `(click)` calls `preventDefault()` is followed. A strict `Content-Security-Policy` blocks the script, and the page works losing those events, unless `renderToString` gets the `nonce` of the response; a prerendered page allows it by its hash in the policy of the host.
- Hydrating later: `@WebComponent({ selector, ssr: { hydrate: 'visible' } })` (`load` default, `idle`, `visible`, `interaction`, `never`) makes the elements of a component rendered on the server wait for the trigger (written by the server in `data-xd-hydrate`); meanwhile its HTML stays inert, and `click`, `input`, `submit`, `keydown`… on it are recorded (a `submit` prevented) and replayed once it hydrates. In a template, a block decides for its content and the components in it, before their option:
  ```html
  @hydrate (interaction, when reviewsOpen()) {
    <app-reviews product="{product().id}" />
  }
  ```
  Triggers: `load`, `idle`, `visible`, `interaction`, `when <expression>` (only in `@hydrate`), comma-separated, the first one firing wins. `never` stands alone and skips the hydration for good: no event is recorded, so links and forms work as plain HTML, and the modules of the components only a `@hydrate (never)` renders are never requested, so it is how a single part of a page stays static. With `ssr: { hydrate: 'never' }` the code stays in the bundle, since what the browser creates renders as usual, and a `@hydrate` holding the element hydrates that instance: the template always wins over the decorator. The modules of the components only the content renders become chunks of their own, loaded when a trigger fires. Until then the code of the content does not run: it shows the HTML of the server even when the state changes, and the current state once hydrated, the parts that changed rendered again without warnings. `visible` and `interaction` watch the elements the server rendered: content that cannot render one (a text, a `@client` without a `@placeholder` holding an element) is a compile error, while a block that renders nothing in the end waits for `idle` in their place. When the modules fail to load, the error is logged and the content stays inert. In a page rendered in the browser the block is as if it were not there: triggers do not count, and the content renders once its modules are loaded. Never declare `"sideEffects": false` in the `package.json` of the app: templates and `@hydrate` import component modules for their side effect (the definition).
- Content depending on what exists only in the browser goes in a `@client` block, with an optional `@placeholder`:
  ```html
  @client {
    <app-notify-button />
  } @placeholder {
    <p>Loading…</p>
  }
  ```
  The server writes the placeholder, the browser replaces it while the component hydrates. A module imported only for the content is not loaded on the server, so it may read `document` when it is evaluated, unless other code imports it. `xd start`, `xd build`, `xd prerender` and the editor warn about an expression the server renders reading a global only the browser has (`document`, `window`, `localStorage`…): move it to `@client`, or check the name with `typeof` in the same expression. In a project without `ssr`, `@hydrate`, `@client` and the `ssr` option of `@WebComponent` are a compile error, in `xd start`, `xd build` and the editor, which does not propose the blocks either. The editor reads `ssr` from `xaendar.json`: without the file it reports neither, and proposes the blocks.
- A whole component only the browser renders declares `@WebComponent({ selector, ssr: { render: false } })`, the decorator form of `@client`: the server writes its empty element (`data-xd-client`), runs none of its code and leaves its module out of the templates rendering it, so a library reading `window` when imported does not stop the page, unless other code imports the module. The browser renders it while its parent hydrates, inputs set first, or by itself in a static template. A `hydrate` trigger next to it delays this render; `never` is not allowed. It has no placeholder: use `@client { … } @placeholder { … }` at the tag for one.
- Static components: with `"staticComponents": true` in the `ssr` of `xaendar.json` (default `false`), `xd build` and `xd prerender` leave out of the bundle of the browser the components they can prove do nothing there, which stay the HTML of the server, their elements never defined; the dev server keeps every component. Turn it on in a multi-page application (the server renders each page, a link loads another one), not in a single-page one: its router creates the pages in the browser, so almost nothing is static. A component is interactive with `@Event`, `@Query`, `@HostListener`, `hostDirectives`, `onInit`, `afterRender`, `onDestroy`, a constructor running code, `signal()`, `effect()`, `createComponent()`, a read of a browser global or of a signal of a module, or a field initialized by a function of the application; with a listener, a directive, an element ref, `@hydrate`, `@client`, a foreign custom element or `@import lazy` in its template; with code running when its module is evaluated, or an import reading its module from the code (not `import './x.xd.component'`, specs and the server entry), which keeps everything it renders in the bundle too; when an interactive component binds a signal to one of its inputs, or renders it in a block depending on a signal, in a `<template>` or in a `@client`; and so is everything such a component renders, at any depth (a page rendered by a router keeps all its components in the bundle). Inputs, `computed`, `@HostProperty` and the methods the template calls do not count. Prefer a `computed` to `onInit` for derived data: `onInit` keeps the component in the bundle.
- A static component can render interactive ones: the server writes the inputs into their `data-xd-inputs`, visible in the HTML, and they hydrate by themselves. Passing them an input whose declared type cannot be written (function, class instance, `any`, `unknown`) makes the static component interactive. `ssr: { static: false }` keeps in the bundle what the build cannot see: a script calling a method of the element, `customElements.whenDefined()`, `:defined` in a stylesheet. `xd build --static-report` tells what keeps each component in the bundle (nothing to report with the search off). `bootstrap.ts` imports the root for its effects (`import './app/app.xd.component';`), or the root stays in the bundle with everything it renders.
- Bound `value`/`checked` attributes never overwrite a field the user edited before the page hydrated. A directive writing `value` itself (see Forms) skips its first write when `element.value !== element.defaultValue`.
- Nest elements as the HTML parser builds them (no block element inside `<p>`, a `<tbody>` between `<table>` and `<tr>`): the parser closes or adds elements, and the HTML of the server shows another tree.
- `xd start` renders on the server; `xd build` builds `dist/client`, then the server into `dist/server`; `npm run serve` runs the generated `server.ts`; `xd prerender` writes the routes listed in `"prerender": ["/", "/about"]` as HTML files, replacing `dist/client/index.html` too: serve a prerendered build from a static host.
