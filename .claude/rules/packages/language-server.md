---
paths:
  - "packages/language-server/**"
---

# @xaendar/language-server

LSP server (`vscode-languageserver`) for Xaendar templates: diagnostics, completions, hover, go to definition, code actions on imports, formatting. Used by `vscode-client` and, bundled by `npm run build:claude-plugin`, by the Claude Code plugin in `plugins/xaendar`. Depends on `compiler`, `language-core`, `types`.
