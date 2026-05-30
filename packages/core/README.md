# @xaendar/core

Core primitives for building Web Components with the **Xaendar** framework — including base classes, decorators, and reactive input signals.

[![npm version](https://img.shields.io/npm/v/@xaendar/core)](https://www.npmjs.com/package/@xaendar/core)
[![license](https://img.shields.io/npm/l/@xaendar/core)](https://opensource.org/licenses/MIT)

---

## Installation

```bash
npm install @xaendar/core
```

> **Peer requirements** — This package targets the browser and relies on the native [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) APIs (`customElements`, `ShadowRoot`, `CustomEvent`) and the TC39 [Signals proposal](https://github.com/tc39/proposal-signals) (`Signal.State`).

---

## Overview

`@xaendar/core` gives you everything you need to author reactive, encapsulated Web Components:

| Primitive | Description |
|-----------|-------------|
| `BaseWebComponent` | Base class for every component — attaches a Shadow DOM and wires up lifecycle hooks |
| `@WebComponent` | Class decorator that registers the element with the browser and binds observed attributes |
| `@Property` | Accessor decorator that exposes a reactive `InputSignal` as an HTML attribute |
| `@Event` | Accessor decorator that creates a typed `CustomEvent` emitter |
| `InputSignal` | A `Signal.State` specialised for attribute-driven input, with optional value transformation |

> **Granular, signal-driven rendering** — the view is never re-rendered as a whole. Every DOM node (element, attribute, or text node) is independently subscribed to the signal(s) it depends on. When a signal value changes, **only the exact nodes that read that signal are updated** — nothing else is touched.

---

## Usage

### 1. Define a component

```ts
import { BaseWebComponent, WebComponent, Property, Event } from '@xaendar/core';
import type { InputSignal, Output } from '@xaendar/core';

@WebComponent({
  selector: 'my-button',
  templateUrl: './my-button.template.html',
  styleUrl: './my-button.styles.css',   // optional
})
class MyButton extends BaseWebComponent {

  /** Reactive label — set via HTML attribute or programmatically */
  @Property('Click me')
  public accessor label!: InputSignal<string>;

  /** Disabled state, transformed from the string attribute to a boolean */
  @Property(false, { 
    transform: (v: string) => v !== 'false' 
  })
  public accessor disabled!: InputSignal<boolean, string>;

  /** Emits when the button is clicked */
  @Event({ bubbles: true, composed: true })
  public accessor clicked!: Output<void>;
}
```

```html
<!-- Use it anywhere in your HTML -->
<my-button label="Submit"></my-button>
```

---

### 2. `BaseWebComponent`

All Xaendar components must extend `BaseWebComponent`. It:

- Attaches a `ShadowRoot` in **open** mode on construction.
- Implements `attributeChangedCallback` to propagate attribute changes into the corresponding `InputSignal`.
- Implements `connectedCallback` / `disconnectedCallback` to manage the component lifecycle.

```ts
import { BaseWebComponent } from '@xaendar/core';

class MyComponent extends BaseWebComponent {
  // your component logic
}
```

---

### 3. `@WebComponent(options)`

Registers the class as a Custom Element.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `selector` | `string \| string[]` | ✅ | The custom element tag name(s) |
| `templateUrl` | `string` | ✅ | Path to the HTML template |
| `styleUrl` | `string` | — | Path to the component stylesheet |

```ts
@WebComponent({ 
  selector: ['x-card', 'xaendar-card'], 
  templateUrl: './card.xd.component.html' 
})
class Card extends BaseWebComponent { }
```

---

### 4. `@Property(initialValue?, options?)`

Marks an `accessor` field as a reactive attribute-bound property.

- Registers the property key in the element's `observedAttributes` list.
- Wraps the value in an `InputSignal` — read it like a signal via `.get()`.
- Supports an optional `transform` function to coerce the raw attribute string into a typed value.

```ts
// Optional property with a default value
@Property('hello')
accessor title: InputSignal<string>;

// Required-style with transform (string → number)
@Property(0, { transform: Number })
accessor count: InputSignal<number, string>;
```

Reading the value inside the component:

```ts
const current = this.count.get(); // number
```

---

### 5. `@Event(options?)`

Creates a typed `CustomEvent` emitter bound to the property name.

```ts
@Event({ 
  bubbles: true, 
  composed: true 
})
accessor valueChange: Output<string>;

// Emit from inside the component
this.valueChange.emit('new value');

// Override options per-emit
this.valueChange.emit('new value', { bubbles: false });
```

Listen from outside in pure HTML:

```html
<my-input id="inp"></my-input>
<script>
  document.getElementById('inp').addEventListener('valueChange', e => {
    console.log(e.detail); // 'new value'
  });
</script>
```

---

### 6. `InputSignal`

A `Signal.State` extended with attribute-pipeline support. You rarely construct it directly — `@Property` handles that — but the type is exported for annotations.

```ts
import type { InputSignal } from '@xaendar/core';

// Type-only annotation
declare accessor name: InputSignal<string>;

// Reading the current value (Signal API)
this.name.get();
```

---

## Granular DOM updates

Xaendar does **not** use a virtual DOM or component-level re-render cycles. The compiler analyses the template at build time and creates a **direct subscription** between each signal and every DOM node that consumes it:

- **Text nodes** — only the text node whose content depends on a signal is updated.
- **Element attributes** — only the specific attribute bound to a signal is written.
- **Structural nodes** — only the nodes involved in a conditional or iteration driven by a signal are added/removed.

When a signal value changes, the update is **surgical**: no diff, no component subtree walk, no unnecessary repaints.

```
signal.set('new value')
         │
         ▼
  ┌──────────────────────────────────┐
  │  DOM nodes subscribed to signal  │
  │  ┌─────────────────────────────┐ │
  │  │ <span> text node ← updated  │ │
  │  └─────────────────────────────┘ │
  │  ┌─────────────────────────────┐ │
  │  │ [aria-label] attr ← updated │ │
  │  └─────────────────────────────┘ │
  └──────────────────────────────────┘
         │
  everything else → untouched
```

This makes updates **O(1) per signal change** regardless of the size of the component tree.

---

## TypeScript configuration

Xaendar components rely on **TC39 decorator metadata** and **accessor** syntax. 
Make sure your `tsconfig.json` has at least:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": false,
    "useDefineForClassFields": true
  }
}
```

> Standard (stage-3) decorators are used — **not** the legacy `experimentalDecorators` variant.

---

## Related packages

| Package | Description |
|---------|-------------|
| [`@xaendar/signals`](https://www.npmjs.com/package/@xaendar/signals) | Reactive signal primitives |
| [`@xaendar/types`](https://www.npmjs.com/package/@xaendar/types) | Shared TypeScript utility types |
| [`@xaendar/compiler`](https://www.npmjs.com/package/@xaendar/compiler) | Template compiler |

---

## License

MIT © [Kaitenjo](https://github.com/kaitenjo)
