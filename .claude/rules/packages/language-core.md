---
paths:
  - "packages/language-core/**"
---

# @xaendar/language-core

Base language-service layer built on `compiler`, exposing `language-service`, `compiler-options.utils`, `shim.utils`. Consumed by `language-server` and `build-tools`. Depends on `compiler`.

`getTemplateWarnings(ast, shadowingMembers)` is the single source of the warnings about what the server cannot read, for the terminal (`build-tools`) and for the editor (`getTemplateDiagnostics`). The analysis reads `ssr` from the nearest `xaendar.json` and gives it to the type-check, which rejects `@hydrate` and `@client` in a project without it; without the file where the project renders is not known, and the editor reports neither. `getTemplateKeywordCompletions` follows the same rule: `readSsr` returning `false` leaves out `@hydrate`, `@client` and the `@placeholder` of a `@client` (`clientPlaceholder` of the keyword context), while `undefined` keeps them; `@defer` and the blocks following it are proposed in any project. `getComponentDiagnostics` reports the problems of the `@WebComponent` decorators of a component file: `findWebComponentErrors`, given the `readSsr` of the file, a `templateUrl` or `styleUrl` leading to a missing file, a selector another component of the TypeScript project declares. `walkTemplate` comes from `compiler` (`utils/template-walker`, used there by `getReadForVariables`); `walkTemplate(ast, metadatas, visitor, true)` walks only what the server renders (both the content and the `@catch` of a `@try`, the `@catch` declaring the error among its variables, as the `@error` of a `@defer` does when the whole template is walked; of a `@defer`, only its `@placeholder`). `getTemplateUsage` reads what a template needs from the browser, for the analysis of the static components in `build-tools`: any call counts as reading a signal.

`readStrictEvents` (default `true`) gives `strictEvents` to the type-check, whose rejected event names `getTemplateDiagnostics` reports as warnings (`findEventCheck`). `readSsr`, `readCustomElements` and `readStrictEvents` read, for a directory under the `root` of a library of the `libs` of `xaendar.json`, the options of the library (its `ssr`, `false` by default, and its `customElements`), the ones of the project anywhere else (`strictEvents` falls back to the one of the project).

`TemplateMetadataCache` reads a component or a directive of a compiled library from the manifest of its package (`readLibraryMetadata` of the compiler) in `getImport` and `getOrInsert`; the metadata of the files (`getModuleMetadatas`, `getDeclarations`) are the ones of the sources only. The definition of the tag of a library component is left to TypeScript.
