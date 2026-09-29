---
paths:
  - "**/*.ts"
---

# TypeScript

## Types

- Respect `tsconfig.json` (strict). Explicitly type parameters and return values of public functions (`public-api.ts`).
- No implicit `any`: use precise types or `unknown` + narrowing. Unavoidable casts go through `as unknown as <T>`.
- Handle optionals explicitly: `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are off, so validate at runtime where it matters.
- Prefer `readonly` on properties/arrays that shouldn't be reassigned, especially in shared models under `packages/common/src/models`.

## Imports

- Use `import type { ... }` for type-only imports.
- No undeclared side-effect-only imports (`noUncheckedSideEffectImports` is on).
- Each package exposes its public API only via `src/public-api.ts`. Never import another package's internal files: use the `@xaendar/*` aliases from `tsconfig.json`.

## File layout (`packages/*/src`)

- Name files with the existing suffixes: `*.type.ts`, `*.model.ts`, `*.utils.ts`, `*.decorator.ts`, `*.spec.ts`.
- One file per folder: `pippo.<suffix>.ts` lives in `pippo/` (named after the part before the first dot), together only with its `pippo.<suffix>.spec.ts`. Nested grouping sub-folders are fine (e.g. `plugin/plugin-utils/plugin.utils.ts`). Exempt: `public-api.ts` and `index.ts` directly under `src/`.
- Before adding a spec for a file not yet isolated this way, create its folder and move the file into it.
- Every new `*.utils.ts`/`*.model.ts` with executable logic needs a Vitest `*.spec.ts`: coverage must stay at 100%.
