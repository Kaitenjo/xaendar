# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Xaendar is a framework for building Web Components declaratively, using a template language that extends HTML5. No virtual DOM, no component-level re-renders: the compiler statically analyses each template and wires every DOM node (element, attribute, or text node) directly to the exact signal(s) it depends on, so a signal change updates only the nodes that read it.

This is a monorepo of the framework's own client libraries, published as separate `@xaendar/*` npm packages, all consumed under TS path aliases (`@xaendar/build-tools`, `@xaendar/common`, `@xaendar/core`, `@xaendar/compiler`, `@xaendar/language-core`, `@xaendar/signals`, `@xaendar/types`) defined once in the root `tsconfig.json`. `vitest.config.ts` reuses that same `paths` map as its single source of truth for aliasing in tests — don't duplicate alias definitions elsewhere.

## Commands

```bash
npm run test              # run all vitest specs once
npm run test:watch        # watch mode
npm run test:coverage     # with coverage — 100% lines/functions/branches/statements is enforced (vitest.config.ts)
npx vitest packages/core/src/utils/context/context.util.spec.ts   # run a single spec file
npx vitest -t "name of test"                              # run tests matching a name

npm run lint               # eslint .
npm run lint:fix

npm run build:src          # `xd build` of the documentation site in src/docs (output: src/docs/dist)
npm start                  # `xd start` of the documentation site (Vite dev server on port 4200)
npm test --prefix src/docs # vitest specs of the docs site's own utilities (router, highlighter, routes)
```

`src/docs` is the framework's documentation/storybook site, written in Xaendar itself and run through the linked `xd` CLI (`packages/cli`, `npm link`ed globally). It is a separate npm project (own `package.json`/lockfile/`tsconfig.json`, whose `paths` point at the packages' sources). Live examples live in `src/docs/src/examples/**` and are shown with their exact source via `?raw` globs (`src/docs/src/core/sources`); pages are bilingual: one template per page, whose texts (HTML strings) live in `src/docs/src/i18n/en.json` / `it.json`, fetched at runtime (`core/i18n/i18n.ts`) and rendered with `@@i18n(key="pages.…")` or bound as `{ t().pages.… }`. Both files must have the same keys (`i18n/messages.spec.ts`).

Package-level build/publish is driven from `schematics/` (its own TS project, built with `npm run build:schematics`), not from per-package npm scripts — the individual `packages/*/package.json` files have no scripts of their own:

```bash
npm run deploy   # full release pipeline: build schematics → check:dependencies → typecheck:projects →
                  # update:version → build:projects → pack:projects → publish:projects → npm i
npm run build:projects        # builds each package's dist/@xaendar/<name> via Vite (packages/*/vite.config.ts + root vite-config.ts)
npm run typecheck:projects    # typechecks each package via its tsconfig.typecheck.json
npm run check:dependencies    # depcheck across packages
```

Each publishable package's `vite.config.ts` just calls the shared `getViteConfig(name, dirName, options)` helper in root `vite-config.ts`: it builds `src/public-api.ts` (plus any declared `secondaryEntryPoints`, e.g. `@xaendar/core`'s `signals` sub-entry) to ESM, bundles `.d.ts` files via `vite-plugin-dts`, rewrites cross-package type imports to `@xaendar/*` specifiers, and generates a trimmed `dist/@xaendar/<name>/package.json` + copies the package `README.md`.

## Architecture

### Package pipeline

Dependency edges below are the actual `@xaendar/*` entries in each package's `package.json` — always the source of truth over prose (verify with `node -e "console.log(require('./packages/<name>/package.json').dependencies)"` if this ever looks stale). `compiler` does **not** depend on `core` — the two are independent consumers of `types`/`common`, and it's `core` that depends on `signals`, not on `compiler`.

```
types ────┬──►  signals  ──►  core
          │
common ───┼──►  compiler  ──►  language-core  ──►  language-server
          │         │                │
          │         └───────┬────────┘
          │                 ▼
          └────────────►  build-tools  ──►  cli

vscode-client — standalone; launches language-server as an external process (no @xaendar/* package dependency)
```
