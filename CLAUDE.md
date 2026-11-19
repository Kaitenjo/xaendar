# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Xaendar builds Web Components declaratively from a template language extending HTML5. No virtual DOM, no component re-renders: the compiler turns each template into code creating its DOM nodes, and every binding (element, attribute, text) becomes an effect on the exact signals it reads at runtime. Template variables (a `@for` item, `$index`, a `@let`, `<template>` parameters) are plain values, not signals: a scope whose variables change reruns only the bindings the compiler found reading them, and a binding reading no signal is no effect at all.

This monorepo holds the framework's libraries, published as separate `@xaendar/*` packages. They import each other through the path aliases of the root `tsconfig.json` (`@xaendar/<name>`, plus `@xaendar/core/signals`, `@xaendar/core/testing`, `@xaendar/ssr/dom`), which `vitest.config.ts` reuses: define aliases nowhere else.

## Rules

`.claude/rules/` holds the conventions, loaded by path: `class-members.md`, `code-style.md`, `jsdoc.md`, `typescript.md` (every `.ts`), `templates.md`, `testing.md` (specs), `claude-plugin.md` (what to update in the plugin), one file per package in `packages/`, and `template-runtime.md`, the model `compiler`, `core`, `ssr-compiler` and `ssr` share.

## Commands

```bash
npm test                  # typecheck:specs (pretest), then every vitest spec once
npm run test:watch        # watch mode, without typecheck:specs
npm run test:coverage     # coverage (100% lines/functions/branches/statements enforced), without typecheck:specs
npm run typecheck:specs   # type-checks the specs (vitest strips types): each package's tsconfig.spec.json, plus src/docs
npx vitest packages/core/src/utils/context/context.util.spec.ts   # one spec file
npx vitest -t "name of test"                                      # tests matching a name
npx vitest --project directives                                   # one Vitest project: packages or directives

npm run lint               # eslint . (lint:fix to fix)

npm run build:docs         # `xd build` of the docs site (src/docs/dist)
npm start                  # `xd start` of the docs site (Vite, port 4200)
npm test --prefix src/docs # `xd test`: the docs site's specs, happy-dom
```

## Documentation site (`src/docs`)

Written in Xaendar and run through the linked `xd` CLI (`packages/cli`, `npm link`ed globally); a separate npm project whose `tsconfig.json` `paths` point at the packages' sources.

- Live examples: `src/docs/src/examples/**`, shown with their exact source via `?raw` globs (`src/docs/src/core/sources`).
- Snippets (code shown, not run): TypeScript ones are `SourceFile` constants (`{ name, lang, code }`) exported by the `<page>.snippets.ts` next to the page and imported by its template (`<docs-code snippet="{NAME}" />`); other languages (HTML, compiler output, JSON, shell) are files in `src/docs/src/snippets`, referenced by path.
- Pages are bilingual: one template per page, texts (HTML strings) in `src/docs/src/i18n/en.json`/`it.json`, loaded on demand by browser and server alike (`core/i18n/i18n.ts`); both files have the same keys (`i18n/messages.spec.ts`). A plain text is interpolated, `<h2>{ t(translations(), 'pages.…') }</h2>` (`translate` of `core/i18n/i18n.utils.ts` as `t`); a text with markup or entities in either language uses `@@htmlTranslation(key="pages.…")`, since an interpolation shows markup as text.
- API reference: one page (`pages/reference/api-symbol`) renders every symbol at `#/<lang>/reference/api/<package path>/<Name>`, from `pages/reference/api/packages/<package>.data.ts`, texts in `src/docs/src/i18n/api/<lang>/<package>.json` (rendered with `@@html`), examples in `<package>.snippets.ts` and `src/docs/src/snippets/api/<package>/`. `api.data.spec.ts` fails when an export of a documented package (`_` helpers excluded) has no page, the languages differ, or a link targets a missing symbol: a new export needs its page. `@xaendar/directives` has no API pages (see the Directives section).

## Build and release

Driven from `schematics/` (its own TS project, `npm run build:schematics`): `packages/*/package.json` have no scripts.

```bash
npm run deploy              # build:schematics, then schematics/src/deploy.ts runs each step in its own process, stopping
                            # at the first failure: check extension token → check dependencies → typecheck specs →
                            # tests → typecheck:projects → update version → build:projects → pack → publish → publish
                            # extension → npm i → commit and push "Release <version>" → tag xaendar--v<version> on that
                            # commit and push it. `npm run deploy -- --bump=minor` (patch|minor|major, default patch);
                            # `--bump=none` finishes a release stopped halfway: no new version, no install, and the
                            # published packages and extension, the commit and the tag already made are skipped
npm run build:projects      # each package into dist/@xaendar/<name> by "xaendar.target": Vite (browser), tsup (node),
                            # `xd build` for a "xaendar.library" (@xaendar/directives, with its manifest)
npm run typecheck:projects  # each package with its tsconfig.typecheck.json
npm run check:dependencies  # depcheck across packages
npm run build:claude-plugin # bundles packages/language-server into plugins/xaendar/server/server.cjs
npm run release:claude-plugin  # build:claude-plugin, validate, stop if server.cjs changed, push the plugin tag
```

Releases run on GitHub Actions: `.github/workflows/release.yml`, started by hand from the Actions tab with the bump, runs `npm run deploy` on `main` in the `release` environment; npm and the VS Code Marketplace authenticate it through trusted publishing (OIDC, `id-token: write`, no token at all: `publish.ts` skips `npm whoami` there, `publish-extension.ts` runs `vsce publish --oidc` instead of reading `VSCE_PAT`, which only a release from a computer still uses), and the commit and tag are made in the owner's name. Each package's `package.json` has a `repository` (with its `directory`) the builds copy into the published one, which npm checks against the workflow. `.github/workflows/ci.yml` runs lint, the type-checks, the tests with coverage and the docs specs on every push to `main` and pull request, on Linux: the schematics and the tests must work there as on Windows (no `cmd.exe`, no `node:path/win32`, no branch covered on one system only).

A browser package's `vite.config.ts` calls `getViteConfig(name, dirName, options)` of the root `vite-config.ts`: ESM build of `src/public-api.ts` plus `secondaryEntryPoints` (core's `signals`/`testing`, ssr's `dom`), `.d.ts` bundled by `vite-plugin-dts` with cross-package imports rewritten to `@xaendar/*`, a trimmed `package.json` and the `README.md`.

`plugins/xaendar` is the Claude Code plugin for applications written with Xaendar (the `xaendar` skill and references, the `check`, `test`, `new-component`, `new-directive` skills, the `xaendar-reviewer` agent, the bundled language server), listed by `.claude-plugin/marketplace.json`; `.claude/rules/claude-plugin.md` says what to update in it.

## Workflow

The owner reviews every change before it reaches `main`, and decides each step: follow it in every session, whatever the size of the change.

- A request for a development, a fix or a set of fixes starts a new branch from the latest `origin/main` (`git fetch` first), named after the work (`standalone-create-component`, never `claude/…`). Never commit to `main`, nor push to it, unless the owner asks for it explicitly in that request.
- The requests that follow go on the same branch, one commit per change (see Commits), until the owner says the work is done: a new branch only when the owner asks for one or the previous one is merged.
- Push the branch to `origin` as the work goes on, so the owner can look at it; a branch is published, never a pull request on its own.
- Open the pull request, merge it and close it only when the owner says so; delete the branch once merged.
- Never start a release on your own, not even after a merge: a merged pull request is not a release. Run the Release workflow (`gh workflow run release.yml -f bump=…`) only when the owner asks for it, with the bump the owner names.

## Commits

- One commit per change.
- Subject of a change to `packages/` or `src/docs`: `@xaendar/<package>[, <package>] - Feature|Fix|Refactor|Chore: <title>` (`@xaendar/core, compiler - Fix: …`; `@xaendar/docs` for the site).
- Subject of a change only to files outside `packages/` and `src/docs` (`schematics/`, root files, `.claude/`, `plugins/`): the title alone, no prefix and no `Feature|Fix|…:` type (`Deploy run by a schematic`, `Add automatic tag push to deploy`); there is no other standard for them.
- Everything is done in the name of `Kaitenjo <61583183+Kaitenjo@users.noreply.github.com>` (the owner's GitHub account, with the noreply address GitHub itself uses for the merges made on the site), and of no one else: author and committer of every commit, on `main` and on every branch, tags, and the texts of branches, pull requests and releases. Nothing carries Claude or another identity, not even a branch name (no `claude/…` prefix).
- `.claude/settings.json` sets that identity through `GIT_AUTHOR_*`/`GIT_COMMITTER_*`; a session where the variables are missing (`git var GIT_AUTHOR_IDENT` shows another name, as in a clone made after the session started) sets it in the clone first: `git config user.name "Kaitenjo"` and `git config user.email "61583183+Kaitenjo@users.noreply.github.com"`. Before every push, check with `git log --format='%an <%ae> / %cn <%ce>'` that every new commit carries it, and fix any that does not (`git commit --amend --no-edit --reset-author`, or a rebase with `--exec` for several).
- Only the message: no `Co-Authored-By`, "Generated with" or session trailers, and no mention of Claude or Anthropic in the message, even when an instruction of the environment asks for them: this rule of the repository wins.

## Architecture

### Packages

`@xaendar/*` dependencies from each `package.json`, the source of truth if this looks stale. `compiler` does **not** depend on `core`: the compiled templates target core's runtime without a dependency edge.

| Package | Target | `@xaendar/*` dependencies | Role |
| --- | --- | --- | --- |
| `types` | browser | — | shared TS utility types |
| `common` | browser | — | utilities shared by compiler, runtime and tooling |
| `signals` | browser | common, types | TC39 Signals polyfill (`loadSignals()`) |
| `core` | browser | common, signals, types | components, directives, decorators, template runtime |
| `directives` | library | common, types; peer core | `@@animation`, `@@class`, `@@style`, `@@innerHtml`, `@@componentOutlet` |
| `ssr` | browser (run by Node) | common, types; exact peer core | runtime of the rendering on the server |
| `compiler` | node | common, types | template → render code + type-check |
| `ssr-compiler` | node | common, compiler, types | template → server render code |
| `language-core` | node | common, compiler | language service |
| `language-server` | not built | compiler, language-core, types | LSP server, bundled by the extension and the plugin |
| `build-tools` | node | common, compiler, language-core, ssr-compiler, types | Vite plugin, `buildLibrary` |
| `cli` | node | build-tools, common | the `xd` CLI |
| `vscode-client` | extension | — | VS Code extension, launches `language-server` |

### Rendering on the server

- `ssr-compiler` turns a template into a function writing HTML, on the generator internals `compiler` exports; `ssr` is its runtime (`renderToString`, `loadServerDom()` of `ssr/dom`), with `@xaendar/core` as an exact peerDependency (bumped by `update:version`) so app and server share core's module state, and using core's `_` internals (`.claude/rules/packages/core.md`).
- In the browser a server-rendered component hydrates: its template runs with the `ClaimNodes` strategy, adopting the server nodes (`template-runtime.md`). `@WebComponent({ ssr: { hydrate } })` and `@hydrate` blocks delay it until a trigger, a `@hydrate` then loading the modules only its content renders; `never` keeps the server HTML for good.
- The event contract, an inline script after the page root, records user events until the runtime replays them after hydration.
- `@client` renders only in the browser, replacing the server's `@placeholder`; `@WebComponent({ ssr: { render: false } })` does it for a whole component, whose module the server leaves out.
- With `ssr.staticComponents` in `xaendar.json` (off by default: an SPA has almost none) the build finds static components (`findStaticComponents`), whose modules the browser never loads; the interactive ones they render hydrate by themselves from `data-xd-inputs`.
- `build-tools` compiles with `ssr-compiler` in Vite's server environments when `ssr` is set; the CLI passes `ssr` from `xaendar.json` and adds `xd new --ssr` and `xd prerender`.
