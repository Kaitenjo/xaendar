---
paths:
  - "**/*.spec.ts"
---

# Testing

- Vitest, environment `node`. Specs live next to their source file as `*.spec.ts`.
- Coverage must stay at 100% (lines/functions/branches/statements) over `packages/**/*.ts`, specs excluded.
- The specs of `src/docs` run with `npm test --prefix src/docs` (`xd test`: happy-dom, the Babel and Xaendar plugins, `loadSignals()`), mounting components by tag.
