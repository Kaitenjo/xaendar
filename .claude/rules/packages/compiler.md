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

`public-api.ts` also exports the generator internals `ssr-compiler` builds its server generator on: `resolveTemplateImports`, the compiler context model, `generator.utils` (expression resolution, with the `browserGlobals` option reading the browser globals through `globalThis`), `scope-generation` (`declareScope`, `declareTemplateParameters`), `catch-error-generation`, `element-namespace`, `render-target`, `symbol-imports` and their types. Change them with both generators in mind, and run the specs of `ssr-compiler` too. `getTextSeparators` decides where the server writes `<!---->` and where the client consumes it (`separated`, the last argument of `_renderText`, `_renderLiteralText`, `_renderTemplate`).

The client code is the same for creating and adopting nodes: `render(nodeStrategy)` and every generated function take the node strategy and create their context with `new _Context(parentContext, nodeStrategy)`. Class bindings are emitted before the attributes, so that writing `class` finds the toggled classes.

The inputs of a component (from the metadata of its tag) are emitted with the input setters and the name of their property (`exposed`: the alias of a host-directive input). `getDeferredModules` gives each `@hydrate` the modules of the components only its content renders, emitted as `load: () => Promise.all([import("…")])`; build-tools drops their static imports.

`@client` is a keyword with a block, and its `@placeholder`, read by `parseClient`, is a member of `ClientNode`, never a node of a list: the state of the `PLACEHOLDER` token only rejects an orphan one. The client code has only the content (`_client(parent, context, anchor, clientN.bind(this))`), the placeholder has none, and a listener in it is a parser error (`findEvent`). A walker of the AST reads `placeholder.children` by itself.

A `@hydrate` takes the triggers of `parseHydrateTriggers`, with `never` alone. `checkHydrateContent` rejects `visible` and `interaction` on content sure to render no element, and `checkServerBlocks` rejects `@hydrate` and `@client` when the `ssr` option is `false` (`undefined` means not known, and they pass): they run as checks of the whole template, like `checkVariableOrder`, so that the editor keeps checking the content of the blocks. `extractComponentsMetadataFromSourceFile` reads `ssr: { render: false }` into `clientOnly`, with the trigger next to it: `findWebComponentErrors` rejects what it cannot read. It is the single source of the errors of a `@WebComponent` the source file alone tells, with the span of each one, for the build (`transform`) and the editor (`getComponentDiagnostics`), and `describeSelectorConflict` gives both the message of a selector used twice. `CompilerContext.getClientComponent` gives these components to the server generator.

`findComponentLogic` and `findModuleLogic` read what a class and its module do in the browser, for the analysis of the static components in `build-tools`. They prove a component static: what they cannot read counts as logic, and each case returns a reason, shown by the report of the build.
