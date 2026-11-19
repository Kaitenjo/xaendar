---
paths:
  - "**/*.ts"
---

# TypeScript

## Types

- Respect the strict `tsconfig.json`; explicitly type parameters and return values of public functions (`public-api.ts`).
- No implicit `any`: precise types or `unknown` + narrowing. Unavoidable casts go through `as unknown as <T>`.
- A global the TS DOM library lacks (`trustedTypes`, a `window` property) is declared by module augmentation in a `.d.ts` of the package (`src/globals.d.ts`, `src/window.d.ts`), its type in a `*.type.ts`; never cast `window` or `globalThis` to read it. A `window`-only property goes in `interface Window { … }` inside `declare global`.

  ```ts
  // ✗
  const factory = (globalThis as unknown as { trustedTypes?: TrustedTypePolicyFactory }).trustedTypes;

  // ✓ src/globals.d.ts
  declare global {
    var trustedTypes: TrustedTypePolicyFactory | undefined; // globalThis and window
  }
  export { };
  ```
- `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are off: handle optionals explicitly and validate at runtime where it matters.
- Derive a type from its sources (`Pick`, `Omit`, `Exclude`, `Extract`, `Parameters`, `ReturnType`, mapped types, `Type['member']`…) instead of redefining it, so it follows them; declare a standalone type only for members that exist nowhere else.
- Prefer `readonly` on properties/arrays never reassigned, especially in `packages/common/src/models`.

## Imports

- `import type { ... }` for type-only imports.
- No undeclared side-effect-only imports (`noUncheckedSideEffectImports`).
- A package exposes its API only via `src/public-api.ts`; import other packages through the `@xaendar/*` aliases, never their internal files.

## File layout (`packages/*/src`)

- Existing suffixes: `*.type.ts`, `*.model.ts`, `*.utils.ts`, `*.decorator.ts`, `*.spec.ts`.
- One file per folder: `pippo.<suffix>.ts` lives in `pippo/` (the part before the first dot) with only its `pippo.<suffix>.spec.ts`. Grouping sub-folders are fine (`plugin/plugin-utils/plugin.utils.ts`); `public-api.ts` and `index.ts` directly under `src/` are exempt.
- Every `type` and `interface` has its own `<name>.type.ts` (`ServerShadowRoot` → `server-shadow-root.type.ts`), helper types included, imported with `import type`; never declared in a `*.utils.ts`, `*.model.ts`, `*.state.ts` or other file. It goes in the nearest `types/` folder or the one fitting what it describes (`dom/types/`). Specs are exempt.
- A `*.type.ts` has no spec, hence no folder of its own: it sits directly in `types/` (`types/server-output.type.ts`, not `types/server-output/server-output.type.ts`) or in a grouping sub-folder (`types/tokens/`).
- Before adding a spec for a file not isolated this way, create its folder and move it there.
- Every new `*.utils.ts`/`*.model.ts` with logic needs a `*.spec.ts`: coverage stays at 100%.
