---
paths:
  - "packages/ssr-compiler/**"
---

# @xaendar/ssr-compiler

Compiles a template into the functions rendering it on the server: `compileServer(input, options)` parses it with `compiler`, resolves its `@import`s when `templateDir` is given, and runs `ServerGenerator`. Depends on `common`, `compiler`, `types` (not on `core` nor `ssr`: the generated code imports them). Used by `build-tools` in the server environments of Vite. Built with tsup (`xaendar.target` node).

- The generator reuses the internals `compiler` exports (`declareScope`, `generator.utils`, symbol imports): every scope (`render`, the branches of `@if`/`@switch`, the body of `@for`, the children of an element with structural directives) is a function called as `key.call(this, out, context, …)`, and the `<template>`s it declares are bound to it with `_ssrTemplate`, rendered by `@render` through `_ssrRenderTemplate`.
- The states under `server-generator/states/` mirror the ones of the client generator. Static text and attributes are escaped at compile time; expressions go through `_escapeText`, `_escapeAttribute` or `_escapeRawText`; the browser globals are read through `globalThis` (`SERVER_RESOLVE_OPTIONS`), so the ones Node lacks are `undefined` instead of throwing.
- The values of a `@case` reach the generator as one string (`1, 2`): they become an array literal tested with `.some(candidate => candidate === value)`.
- Element refs are declared as `undefined`: no element exists on the server.
