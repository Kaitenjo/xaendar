---
paths:
  - "packages/language-core/**"
---

# @xaendar/language-core

Base language-service layer built on `compiler`, exposing `language-service`, `compiler-options.utils`, `shim.utils`. Consumed by `language-server` and `build-tools`. Depends on `compiler`.

`getTemplateWarnings(ast, shadowingMembers)` is the single source of the warnings about what the server cannot read, for the terminal (`build-tools`) and for the editor (`getTemplateDiagnostics`). The analysis reads `ssr` from the nearest `xaendar.json` and gives it to the type-check, which rejects `@hydrate` and `@client` in a project without it; without the file where the project renders is not known, and the editor reports neither. `getTemplateKeywordCompletions` follows the same rule: `readSsr` returning `false` leaves out `@hydrate`, `@client` and `@placeholder`, while `undefined` keeps them. `getComponentDiagnostics` reports the problems of the `@WebComponent` decorators of a component file: `findWebComponentErrors`, a `templateUrl` or `styleUrl` leading to a missing file, a selector another component of the TypeScript project declares. `walkTemplate(ast, metadatas, visitor, true)` walks only what the server renders. `getTemplateUsage` reads what a template needs from the browser, for the analysis of the static components in `build-tools`: any call counts as reading a signal.
