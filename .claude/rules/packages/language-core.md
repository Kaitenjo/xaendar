---
paths:
  - "packages/language-core/**"
---

# @xaendar/language-core

Language-service layer on `compiler` (`language-service`, `compiler-options.utils`, `shim.utils`), used by `language-server` and `build-tools`. Depends on `compiler` and the peer `internals`.

- Single sources shared by the build and the editor: `getTemplateWarnings(ast, shadowingMembers)` (what the server cannot read) and `getComponentDiagnostics` (`@WebComponent` problems of a component file: `findWebComponentErrors`, missing `templateUrl`/`styleUrl` files, a selector declared by another component; `findReflectedInputs` as `ComponentDiagnostic.warning`).
- Options come from the nearest `xaendar.json`: `readSsr`, `readCustomElements`, `readStrictEvents` (default `true`) read a library's own options under the `root` of one of its `libs` (`ssr` default `false`; `strictEvents` falls back to the project's), the project's elsewhere. `ssr` `false` makes the type-check reject `@hydrate`/`@client` and completions leave them out (with a `@client`'s `@placeholder`); `undefined` (no file) reports and hides neither. `@defer` and its blocks are proposed everywhere. Rejected event names are warnings (`findEventCheck`).
- `walkTemplate` comes from `compiler`; `walkTemplate(ast, metadatas, visitor, true)` walks only what the server renders (both parts of a `@try`, only the `@placeholder` of a `@defer`). `getTemplateUsage` reads what a template needs from the browser, for static components: any call counts as reading a signal.
- `ProjectLanguageService.cacheRealFiles` (the default instance, for build-tools) reads the versions and the existence of the real files and of the directories once, until `invalidateRealFiles` (any change reported reads the disk again): only an owner told of every change enables it. The editor's instances read them at every request, the client watching only some files.
- `TemplateMetadataCache` reads compiled-library components/directives from their package manifest (`readLibraryMetadata`) in `getImport`/`getOrInsert`; file metadata (`getModuleMetadatas`, `getDeclarations`) are the sources' only. The definition of a library tag is left to TypeScript.
