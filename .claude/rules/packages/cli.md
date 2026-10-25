---
paths:
  - "packages/cli/**"
---

# @xaendar/cli

The `xd` CLI (via `commander`): `new`, `generate component`, `start`, `build` and `test` (Vitest in happy-dom) under `src/commands/`; `start`, `build` and `test` add the plugins of `src/utils/plugins.ts` (Babel decorators, then `xaendarPlugin` with the `customElements` of `xaendar.json`). Depends on `build-tools`, `common`.
