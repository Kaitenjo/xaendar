---
paths:
  - "packages/compiler/**"
---

# @xaendar/compiler

Turns a `.html`-like Xaendar template into a JS render-function body plus a type-check result. Depends on `common`, `types` only (**not** on `core`).

Four-stage pipeline, each stage in its own subfolder with the same layout (`<stage>/<stage>/`, `models/`, `states/`, `types/`, `utils/`):

1. `lexer`: tokenizes the raw template text.
2. `parser`: tokens → AST (`ASTNode`, `ASTNodeType`, node types like `ImportNode`).
3. `type-checker`: builds a `TypeCheckResult` from the AST plus component/directive metadata, resolved from `@import` nodes via a caller-supplied `CompilerCache`.
4. `generator`: emits the JS render function body from the AST.

Entry point: `compile()` in `src/compile/compile.ts`, overloaded on `CompileOptions`:
- `baseDir` (+ optional `cache`) → only `TypeCheckResult` (editor tooling);
- `signals` → only compiled JS (module-level functions; `render` is invoked with the component bound as `this`);
- both → `{ javascript, typescript }`, computed concurrently.

`public-api.ts` also exports the generator internals `ssr-compiler` builds its server generator on: `resolveTemplateImports`, the compiler context model, `generator.utils` (expression resolution, with the `browserGlobals` option reading the browser globals through `globalThis`), `scope-generation` (`declareScope`, `declareTemplateParameters`), `catch-error-generation`, `element-namespace`, `render-target`, `symbol-imports` and their types. Change them with both generators in mind, and run the specs of `ssr-compiler` too.
