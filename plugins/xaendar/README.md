# Xaendar plugin for Claude Code

Helps Claude Code write applications with Xaendar.

| Component | What it does |
| --- | --- |
| `xaendar` skill | Loaded automatically on Xaendar code. It covers the project layout, the template language, the component, directive and signal APIs, `createComponent`, the stylesheets, the code conventions, the compiler and runtime errors, the idiomatic patterns (stores, async data, forms, routing, theming, DOM work, lazy loading) and the porting of Angular code. |
| `/xaendar:new-component <selector> [folder] [description]` | Scaffolds a component with `xd generate component`, and can implement it, test it and use it in a parent template. |
| `/xaendar:new-directive <selector> [custom\|structural] [folder] [description]` | Creates a custom or structural directive, and can apply it in a template. |
| `/xaendar:check [folder]` | Runs `xd build` and reports the template, stylesheet and type errors of the project. |
| `/xaendar:test [target]` | Writes and runs the specs with `xd test`: mounting, host components for the inputs, outputs, flushing the effects. |
| `xaendar-reviewer` agent | Reviews components, templates, directives and stores for constructs that compile but misbehave, and for the code conventions. |
| `xaendar` LSP server | Runs `@xaendar/language-server` on `.xd.component.html` files: diagnostics, completions, hover, go to definition, code actions on imports and formatting. |

## Install

```text
/plugin marketplace add https://raw.githubusercontent.com/Kaitenjo/xaendar/main/.claude-plugin/marketplace.json
/plugin install xaendar@xaendar
```

The catalog is the single file `.claude-plugin/marketplace.json`, read from its URL: the repository is not cloned. It installs `plugins/xaendar` from the tag `xaendar--v<version>` (a `git-subdir` source), so the cache holds only the plugin. `npm run update:version` points it to the tag of the new version.

## Release

1. Commit every change of the plugin. Its `version` in `.claude-plugin/plugin.json` follows the one of the repository: `npm run update:version` (run by `npm run deploy`) writes it with the packages.
2. `npm run release:claude-plugin` from the repository root: it rebuilds the server, validates the manifests, the skills and the agent, stops if the rebuilt server differs from the committed one (commit it, then run it again), and pushes the tag `xaendar--v<version>`.
3. `git push`, which publishes the catalog pointing to the new tag: users get the new version with `/plugin marketplace update xaendar`, or automatically when auto-update is on.

## Language server

The server is bundled in `server/server.cjs` by `npm run build:claude-plugin` from the repository root. Rebuild it after every change to `packages/language-server`, `language-core` or `compiler`, and commit the result: a marketplace installation gets only what is in git.

TypeScript is not bundled. The server loads it from the project's `node_modules` through `NODE_PATH`, so the project must have `typescript` installed. A bundled copy would look for its `lib.*.d.ts` files next to the bundle and would not find them.

## Updating the references

The references follow the documentation site:

| Reference | Source |
| --- | --- |
| `skills/xaendar/references/api.md` | `src/docs/src/pages/reference/api/packages/<package>.data.ts` and the texts in `src/docs/src/i18n/api/en/<package>.json` |
| `skills/xaendar/references/errors.md` | `src/docs/src/pages/reference/errors/errors.data.ts` and the `errors` texts of `src/docs/src/i18n/en.json`, plus the compiler and runtime messages the site does not list yet |
| `skills/xaendar/references/template-syntax.md` | the Template syntax cheat sheet and the Templates guides |
| `skills/xaendar/references/patterns.md` | the Patterns section, Using DOM APIs, Creating components in code, Selectors and registration |
| `skills/xaendar/references/angular.md` | the Coming from Angular page |

Update them, and the skills using what changed, when the framework or the docs change. When the Known issues page lists issues, add them as `skills/xaendar/references/known-issues.md`, linked from `SKILL.md`, the `check` and `test` skills and the reviewer.