---
paths:
  - "packages/cli/**"
---

# @xaendar/cli

The `xd` CLI (via `commander`): `new`, `generate component`, `start`, `build`, `test` (Vitest in happy-dom) and `prerender` under `src/commands/`; `start`, `build` and `test` add the plugins of `src/utils/plugins.ts` (Babel decorators, then `xaendarPlugin` with the `customElements` and the `ssr` of `xaendar.json`, read by `utils/xaendar-config`). Depends on `build-tools`, `common`.

When `xaendar.json` declares `ssr` (`entry`, `prerender`, `outDir`, relative to the project; `entry` without extension, rejected by `resolveSsrPaths` otherwise): `build` runs the build of the server (`build.ssr`, into `dist/server` by default) after the one of the browser, and `prerender` runs `build`, then writes each route rendered by the built entry into the client build. `new --ssr` adds `src/entry-server.ts` and `server.ts`, the `ssr` block, `<!--xd-ssr-->` in `index.html` and a client build into `dist/client`. The templates never receive the flag: `new` picks `CLIENT_RENDERING` or `SERVER_RENDERING` (`commands/new/rendering`) and the templates read what they need from it.
