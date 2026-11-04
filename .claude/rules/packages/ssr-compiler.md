---
paths:
  - "packages/ssr-compiler/**"
---

# @xaendar/ssr-compiler

Compiles a template into the functions rendering it on the server: `compileServer(input, options)` parses it with `compiler`, resolves its `@import`s when `templateDir` is given, and runs `ServerGenerator`. Depends on `common`, `compiler`, `types` (not on `core` nor `ssr`: the generated code imports them). Used by `build-tools` in the server environments of Vite. Built with tsup (`xaendar.target` node).

- The generator reuses the internals `compiler` exports (`declareScope`, `generator.utils`, symbol imports): every scope (`render`, the branches of `@if`/`@switch`, the body of `@for`, the children of an element with structural directives) is a function called as `key.call(this, out, context, …)`, and the `<template>`s it declares are bound to it with `_ssrTemplate`, rendered by `@render` through `_ssrRenderTemplate`.
- The states under `server-generator/states/` mirror the ones of the client generator. Static text and attributes are escaped at compile time; expressions go through `_escapeText`, `_escapeAttribute` or `_escapeRawText`; the browser globals are read through `globalThis` (`SERVER_RESOLVE_OPTIONS`), so the ones Node lacks are `undefined` instead of throwing.
- The `islands` option lists the tags of the interactive components a static template renders, written with `_ssrIsland` instead of `_ssrComponent`.
- `getServerDependencies` picks the modules the module of a template imports: all of them, unless the template holds a `@client` or imports a component declaring `ssr: { render: false }`, then only the ones declaring a component or a directive the server renders, the symbols being imported by the generated code.
- `compileServer` passes the imported components rendering only in the browser (`isClientComponent`) to the generator, which writes them with `_ssrClientComponent` and the names of their inputs, whatever the class on the server.
- `generate` writes the events of the template as `render.events`, for the event contract of the page, and an element or a branch with `(submit)` writes `data-xd-submit`, mirroring core's `_SUBMIT_ATTRIBUTE`.
- The values of a `@case` reach the generator as one string (`1, 2`): they become an array literal tested with `.some(candidate => candidate === value)`.
- Element refs are declared as `undefined`: no element exists on the server.
- A native element applying custom directives goes through `_ssrStartTag`, its directives (`mapDirectives`: selector and properties, no events) as its last argument and the ones of its branches in their `directives`, so a branch holding only a directive is not empty (`isEmptyBranch(branch, withDirectives)`). The custom directives of a component are left out.
- The generated code writes the markers of hydration as string literals, from `costants/ssr-markers.constants.ts`, which mirrors core's `_SSR_MARKERS` (this package depends on no runtime): `_generateNodes` writes `<!---->` where `getTextSeparators` of the compiler says, which the client generator reads too, the states of `@if`/`@switch`/`@for`/`@hydrate`/`@client` their open and close markers (of a `@client` only those and its `@placeholder`, never its content); `@for` compiles its `track` as the client does, for the key of `_ssrItemMarker`.
