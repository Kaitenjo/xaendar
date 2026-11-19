---
paths:
  - "packages/language-server/**"
---

# @xaendar/language-server

LSP server (`vscode-languageserver`) for templates: diagnostics, completions, hover, go to definition, import code actions, formatting. Used by `vscode-client` and, bundled by `npm run build:claude-plugin`, by `plugins/xaendar`. Depends on `compiler`, `language-core`, `types`.

- On synchronized `.xd.component.ts` files it also publishes the decorators' diagnostics (`validateComponent`). Only templates reach `validate` (`_getAnalysis` returns nothing for a component file): their empty diagnostics would replace the decorators'.
- A `xaendar.json` change revalidates open templates and component files; other TS files are only watched, so a component in a file without the suffix is reported by the build only.
