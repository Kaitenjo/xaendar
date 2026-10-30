---
paths:
  - "packages/ssr/**"
---

# @xaendar/ssr

The runtime of the rendering on the server: `renderToString(component, inputs?)`, and the helpers the templates compiled by `ssr-compiler` call (`_ssr*`, `_escape*`, `_defineServerRender`). Depends on `common`, `types`; `@xaendar/core` is an exact peerDependency, so the application and the server share one copy of its module state. Built with Vite (`xaendar.target` browser), although it runs in Node.

- `@xaendar/ssr/dom` (`src/dom/index.ts`, a secondary entry point): `loadServerDom()` installs a minimal `HTMLElement` and `customElements` on `globalThis`, keeping the ones already there. It runs before `@xaendar/core` is evaluated, so nothing under `src/dom` imports core.
- Component code runs inside `_runOnServer`, which swaps core's `_ComponentRuntime`: `effect()` does nothing and `createComponent()` constructs without rendering. Effects, `afterRender`, `onDestroy`, listeners, `@HostEvent`, custom and host directives and queries never run on the server; element refs are `undefined`.
- `_renderComponent` constructs the element, binds its inputs, runs `onInit`, reserves the slot of its start tag, writes the declarative shadow root (`<template shadowrootmode="open">`, the `<style>`, the render), applies the host properties, then fills the start tag. A custom element without class or server render is written as a plain element.
- Serialization follows `@xaendar/common`: texts escape `& < >`, attributes `& " < >`, raw text elements only neutralize their end tag, void elements get no end tag, and a `\n` always follows the start tag of `pre`, `textarea` and `listing`.
- The end-to-end spec (`render-to-string.spec.ts`) compiles real templates with `compileServer`: a new template construct needs a case there.
