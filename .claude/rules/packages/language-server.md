---
paths:
  - "packages/language-server/**"
---

# @xaendar/language-server

LSP server (`vscode-languageserver`) for Xaendar templates: diagnostics, completions, hover, go to definition, code actions on imports, formatting. On the `.xd.component.ts` files the client synchronizes it publishes the diagnostics of the decorators too (`validateComponent`), which the editor shows next to the ones of TypeScript. Only a template reaches `validate` (`_getAnalysis` returns nothing for a component file): its empty diagnostics would replace the ones of the decorators. A change of `xaendar.json` validates the open templates and component files again; the other TypeScript files are only watched, so a component in a file without the suffix is reported by the build only. Used by `vscode-client` and, bundled by `npm run build:claude-plugin`, by the Claude Code plugin in `plugins/xaendar`. Depends on `compiler`, `language-core`, `types`.
