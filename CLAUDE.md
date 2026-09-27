# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Xaendar is a framework for building Web Components declaratively, using a template language that extends HTML5. No virtual DOM, no component-level re-renders: the compiler statically analyses each template and wires every DOM node (element, attribute, or text node) directly to the exact signal(s) it depends on, so a signal change updates only the nodes that read it.

This is a monorepo of the framework's own client libraries, published as separate `@xaendar/*` npm packages, all consumed under TS path aliases (`@xaendar/build-tools`, `@xaendar/common`, `@xaendar/core`, `@xaendar/compiler`, `@xaendar/language-core`, `@xaendar/signals`, `@xaendar/types`) defined once in the root `tsconfig.json`. `vitest.config.ts` reuses that same `paths` map as its single source of truth for aliasing in tests — don't duplicate alias definitions elsewhere.

## Conventions

- **Language:** TypeScript strict.
- **Testing:** Vitest.
- **Component docs:** Storybook (`.storybook/`, stories in `docs/stories/`).
- **API docs:** generated into `docs/apis/`.
- **Strict mode:** respect `tsconfig.json` (strict enabled); explicitly type parameters and return values of public functions (`public-api.ts`).
- **Type-only imports:** use `import type { ... }` for type-only imports, to keep the runtime/type boundary clear (not ESLint-enforced, but preferred).
- **File names:** follow the existing `*.type.ts`, `*.model.ts`, `*.utils.ts`, `*.decorator.ts`, `*.spec.ts` convention used under `packages/*/src`.
- **One file per folder:** a leaf source file `pippo.<suffix>.ts` (e.g. `pippo.model.ts`, `pippo.utils.ts`) lives in its own folder named after the identifier before the first dot (`pippo/pippo.<suffix>.ts`), and that folder holds only that file plus its `pippo.<suffix>.spec.ts` — no other unrelated loose files (nested sub-folders for further grouping are fine, e.g. `plugin/plugin-utils/plugin.utils.ts`). Entry/barrel files directly under a package's `src/` (`public-api.ts`, `index.ts`) are exempt. When adding a `*.spec.ts` for a source file that isn't already isolated this way, create the folder first and move the source file into it before adding the spec.
- **Barrel files:** expose each package's public API only via `src/public-api.ts`; never import another package's internal files directly (use the `@xaendar/*` aliases defined in `tsconfig.json`).
- **No implicit `any`:** prefer precise types or `unknown` + narrowing when the type isn't known upfront. If a cast is unavoidable, use `as unknown as <target-type>`.
- **Unused vars/params:** prefix with `_` (e.g. `_event`) to satisfy `no-unused-vars` (warning, not error).
- **Strings:** always single quotes (`'...'`), per ESLint's `quotes: single`.
- **Null/undefined:** handle optionals explicitly; `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are both off, so the compiler won't catch these for you — validate at runtime where it matters.
- **Side-effect imports:** avoid undeclared side-effect-only imports (`noUncheckedSideEffectImports` is on).
- **Immutability:** prefer `readonly` on properties/arrays that shouldn't be reassigned, especially in shared models under `packages/common/src/models`.
- Don't indent function parameters vertically.
- Every new `*.utils.ts`/`*.model.ts` file with executable logic needs an associated Vitest spec (`*.spec.ts`) — coverage must stay at 100%.

## Commands

```bash
npm run test              # run all vitest specs once
npm run test:watch        # watch mode
npm run test:coverage     # with coverage — 100% lines/functions/branches/statements is enforced (vitest.config.ts)
npx vitest packages/core/src/utils/context.util.spec.ts   # run a single spec file
npx vitest -t "name of test"                              # run tests matching a name

npm run lint               # eslint .
npm run lint:fix

npm run build:src          # vite build of the root demo/shell (vite.config.ts)
npm start                  # nodemon + tsx runs src/test.ts, restarting on changes under src/ and packages/**/*.ts
                            # (src/test.ts is a scratch entry point used to manually exercise the compiler — feel free to edit it, don't rely on its current contents)
```

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

- **`types`** — shared public TS utility types (constructors, decorators, functions) used across every other package.
- **`common`** — shared runtime utilities/models with no framework dependency (string/indent/tag utils, a `stack` model). Depended on by `signals`, `compiler`, `build-tools`, and `cli`.
- **`signals`** — full implementation of the TC39 Signals proposal (`Signal.State`, `Signal.Computed`, `Signal.subtle.Watcher`, `effect()`), installed as the global `Signal` namespace via `loadSignals()`. This is the reactivity primitive everything else builds on. Depends on `common`/`types`.
- **`core`** — runtime primitives for authoring components: `BaseWebComponent` (attaches Shadow DOM, wires `attributeChangedCallback`/`connectedCallback`/`disconnectedCallback`), the `@WebComponent`/`@Property`/`@Event` decorators, `InputSignal`, and template-runtime helpers (`_Context`, `mountNode`, `createAnchor` in `src/utils/context.util.ts`) that the *compiler-generated* render code calls into to mount/unmount nodes and manage nested scopes (e.g. `@for`/`@if` bodies). Uses stage-3 (`accessor`) decorators, not `experimentalDecorators`. Depends only on `signals`/`types` — **not** on `compiler`; the compiler-generated code targets `core`'s runtime shape but there is no build-time dependency edge between them.
- **`compiler`** — turns a `.html`-like Xaendar template into a JS render-function body plus a type-check result. Four-stage pipeline, each stage in its own subfolder mirroring the same internal layout (`<stage>/<stage>/`, `models/`, `states/`, `types/`, `utils/`):
  1. **`lexer`** tokenizes the raw template text.
  2. **`parser`** turns tokens into an AST (`ASTNode`, `ASTNodeType`, node types like `ImportNode`).
  3. **`type-checker`** builds a `TypeCheckResult` from the AST plus component/directive metadata (resolved from `@import` nodes via a caller-supplied `CompilerCache`).
  4. **`generator`** emits the JS render function body from the AST.
  The public entry point is `compile()` in `src/compile/compile.ts`, overloaded on `CompileOptions`: pass `baseDir` (+ optional `cache`) to get only a `TypeCheckResult` (for editor tooling), pass `cssVariableName`/`signals` to get only compiled JS, or pass both to get `{ javascript, typescript }` concurrently. Depends on `common`/`types` only.
- **`build-tools`** — build-time plugins/registry (e.g. for wiring the compiler into a bundler) plus shared build models/constants. Depends on `common`, `compiler`, and `language-core`.
- **`cli`** (`xaendar` CLI, via `commander`) — `new`, `generate`, `start` commands under `src/commands/`. Depends on `build-tools`/`common`.
- **`language-core`** — base language-service layer built on `compiler`, exposing `language-service`, `compiler-options.utils`, and `shim.utils`; consumed by `language-server` and `build-tools`.
- **`language-server`** — LSP server (`vscode-languageserver`) built on `compiler`/`language-core`/`types`, for editor diagnostics/completions on Xaendar templates.
- **`vscode-client`** — the VS Code extension (`src/lib/extension.ts`) that launches `language-server` via `vscode-languageclient` as an external process; it has no `@xaendar/*` package dependency.

### Template runtime model

Compiled templates don't produce a virtual tree; they produce imperative JS that mounts real DOM nodes through `core`'s `_Context`/`mountNode`/`createAnchor` (`packages/core/src/utils/context.util.ts`). Each `_Context` is one lexical scope (root component, or a nested scope introduced by `@for`/`@if`), holds its own declared identifiers, owned DOM nodes, and cleanup callbacks, and can look up identifiers/event handlers in parent scopes via `_root`/`_parent`. `createAnchor` places a `Comment` node as a stable insertion point for structural directives, so dynamic content is always inserted via `insertBefore(node, anchor)` regardless of how sibling constructs update independently. Destroying a context (`unlisten()`) recursively disposes children, detaches listeners, and removes owned nodes — this is the mechanism that makes per-signal DOM updates surgical instead of requiring a virtual-DOM diff.

### Testing

Vitest specs live alongside source as `*.spec.ts` (`packages/**/*.spec.ts`), environment `node`. Coverage is enforced at 100% (lines/functions/branches/statements) over all of `packages/**/*.ts` excluding specs — every new `*.utils.ts`/`*.model.ts` needs an accompanying spec (see `AGENTS.md`).
