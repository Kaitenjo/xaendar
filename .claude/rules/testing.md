---
paths:
  - "**/*.spec.ts"
---

# Testing

- Vitest, environment `node`. Specs live next to their source file as `*.spec.ts`.
- Coverage must stay at 100% (lines/functions/branches/statements) over `packages/**/*.ts`; specs, `vite.config.ts` and `packages/directives/**/*.directive.ts` are excluded (`vitest.config.ts`).
- The root Vitest has two projects: `packages`, and `directives`, whose specs are transpiled by `createBabelPlugin` of the CLI as `xd test` does (`npx vitest --project directives`).
- `npm test` runs `typecheck:specs` first (`pretest`): a spec with a type error fails it even when Vitest passes.
- The specs of `src/docs` run with `npm test --prefix src/docs` (`xd test`: happy-dom, the Babel and Xaendar plugins, `loadSignals()`), mounting components by tag.
