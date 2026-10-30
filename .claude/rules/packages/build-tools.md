---
paths:
  - "packages/build-tools/**"
---

# @xaendar/build-tools

Build-time plugins/registry (wiring the compiler into a bundler) plus shared build models/constants. Depends on `common`, `compiler`, `language-core`, `ssr-compiler`.

With the `ssr` option, a module evaluated by a server environment of Vite (`isServerRendering`: `this.environment.config.consumer === 'server'`) gets its template compiled by `compileServer` and registered with `_defineServerRender` of `@xaendar/ssr`, its stylesheet as a string, and no type check; the client environment keeps the usual output. The `config` hook sets `appType: 'custom'`, `configure-server` adds the middleware rendering each page with the entry in place of `<!--xd-ssr-->`, and `hotUpdate` reloads the page when a module only the server loads changes.
