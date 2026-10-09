# Xaendar plugin for Claude Code

Helps Claude Code write applications with Xaendar.

| Component | What it does |
| --- | --- |
| `xaendar` skill | Loaded automatically on Xaendar code. It covers the template language, the component, directive and signal APIs, the compiler and runtime errors, and the known framework bugs with their workarounds. |
| `/xaendar:new-component <selector> [folder] [description]` | Scaffolds a component with `xd component`, registers it in `main.ts`, and can implement it and use it in a parent template. |
| `/xaendar:check [folder]` | Runs `xd build` and `tsc --noEmit` and reports the template errors (the build prints them but exits 0) and the class type errors. |
| `xaendar-reviewer` agent | Reviews components and templates for constructs that compile but misbehave. |
| `xaendar` LSP server | Runs `@xaendar/language-server` on `.xd.component.html` files. |

## Install

```text
/plugin marketplace add <git URL or local path of the xaendar repository>
/plugin install xaendar@xaendar
```

## Language server

The server is bundled in `server/server.cjs` by `npm run build:claude-plugin` from the repository root. Rebuild it after every change to `packages/language-server`, `language-core` or `compiler`, and commit the result: a marketplace installation gets only what is in git.

TypeScript is not bundled. The server loads it from the project's `node_modules` through `NODE_PATH`, so the project must have `typescript` installed. A bundled copy would look for its `lib.*.d.ts` files next to the bundle and would not find them.

Today the server reports nothing: the template→component index in `packages/language-server/src/lib/template-registry.ts` is disabled. Diagnostics and completions will appear without changes to the plugin once the index is enabled.

## Updating the references

`skills/xaendar/references/api.md`, `errors.md` and `known-issues.md` were generated from the data files of the documentation site (`src/docs/src/pages/reference/*/*.data.ts`) and their English texts (the `api`, `errors` and `issues` sections of `src/docs/src/i18n/en.json`). `template-syntax.md` follows the cheat sheet of the site. Update them when the docs change.
