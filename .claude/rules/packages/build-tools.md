---
paths:
  - "packages/build-tools/**"
---

# @xaendar/build-tools

Build-time plugins/registry (wiring the compiler into a bundler) plus shared build models/constants. Depends on `common`, `compiler`, `language-core`, `ssr-compiler`.

The hooks never test which environment they run for: they read its strategy, `state.strategies[this.environment.config.consumer]` (`costants/plugin-strategies.ts`, chosen once in `xaendarPlugin`), and call its functions. With the `ssr` option, the server consumer gets `SERVER_STRATEGY`: templates compiled by `compileServer` and registered with `_defineServerRender` of `@xaendar/ssr`, the stylesheet as a string, no type check; the client keeps `CLIENT_STRATEGY`, as does the server without `ssr`. The `config` hook sets `appType: 'custom'`, `configure-server` adds the middleware rendering each page with the entry in place of `<!--xd-ssr-->`, and `hotUpdate` reloads the page when a module only the server loads changes.
