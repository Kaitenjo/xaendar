---
paths:
  - "packages/cli/**"
---

# @xaendar/cli

The `xd` CLI (`commander`, `src/commands/`): `new`, `generate component`, `generate library`, `add library`, `start`, `build`, `test` (Vitest in happy-dom), `prerender`. Depends on `build-tools`, `common`.

- `start`, `build` and `test` add the plugins of `src/utils/plugins.ts`: Babel decorators (`createBabelPlugin` of `utils/babel-plugin`, which imports nothing of build-tools because the root `vitest.config.ts` uses it too), then `xaendarPlugin` with `customElements`, `strictEvents` and `ssr` of `xaendar.json` (`utils/xaendar-config`; a library without `strictEvents` inherits the workspace's).
- Babel-transpiled modules import the decorator helpers from `virtual:xaendar-babel-helpers` (`utils/babel-helpers`), so a bundle holds one copy; helpers outside `DECORATOR_HELPERS` stay inline.

## Rendering on the server

- `ssr` of `xaendar.json`: `entry` (without extension, else `resolveSsrPaths` rejects it), `prerender`, `outDir`, `staticComponents` (passed as `false` unless `true`). `build` then builds the server (`dist/server` by default) after the browser; `prerender` builds, then writes each route rendered by the built entry into the client build.
- `new --ssr` adds `src/entry-server.ts`, `server.ts` (`@xaendar/common` in the dependencies; included by `tsconfig.json` with Node types and no `rootDir`; it imports the built entry by URL so the project type-checks before its first build), the `ssr` block, `<!--xd-ssr-->` in `index.html` and a client build into `dist/client`. Templates never read the flag: `new` picks `CLIENT_RENDERING` or `SERVER_RENDERING` (`commands/new/rendering`).
- `render(url)` always receives `toSameOriginPath` of the request or route, in `server.ts`, the dev server and `prerender`.

## Workspaces and libraries

- A workspace's `xaendar.json` declares `libs`, keyed by package name (`"@acme/ui": { "root", "entry", "outDir", "ssr", "customElements" }`). `generate library` creates one in a new folder (refused inside a workspace): `libs` entry, `tsconfig.json` `paths` to `libraries/<folder>/src`, a root template rendering the library's example component. `add library` adds one to the project holding the working directory (`readProject`), writing nothing when `tsconfig.json` is not plain JSON. Files from `buildLibraryStructure`, JSON edits from `utils/library` (also used by `generate component --library` to export the component, `addLibraryExport`).
- `createPlugins` passes `libs` as `libraries`; `test` looks for specs in the whole workspace (`dir`).
- `build` in a workspace builds every library in `libs` order, or the one named by package or folder (`utils/build-libraries`, into `outDir`, default `dist/<folder>`), with `buildLibrary`, `createBabelPlugin()` and the CLI version. A library builds after the workspace libraries it depends on (`dependencies`/`peerDependencies`, `orderLibrary`) and receives their builds; cycles and `build <library>` outside a workspace exit with an error.
