---
paths:
  - "packages/compiler/**"
---

# @xaendar/compiler

Turns a `.html`-like Xaendar template into a JS render-function body plus a type-check result. Depends on `common`, `types` only (**not** on `core`).

Four-stage pipeline, each stage in its own subfolder with the same layout (`<stage>/<stage>/`, `models/`, `states/`, `types/`, `utils/`):

1. `lexer`: tokenizes the raw template text.
2. `parser`: tokens → AST (`ASTNode`, `ASTNodeType`, node types like `ImportNode`).
3. `type-checker`: builds a `TypeCheckResult` from the AST plus component/directive metadata, resolved from `@import` nodes via a caller-supplied `ContextCache`.
4. `generator`: emits the JS render function body from the AST.

Entry point: `compile()` in `src/compile/compile.ts`, overloaded on `CompileOptions`:
- `baseDir` (+ optional `cache`) → only `TypeCheckResult` (editor tooling);
- `signals` → only compiled JS (module-level functions; `render` is invoked with the component bound as `this`);
- both → `{ javascript, typescript }`, computed concurrently.

`public-api.ts` also exports the generator internals `ssr-compiler` builds its server generator on: `resolveTemplateImports`, the compiler context model, `generator.utils` (expression resolution, with the `browserGlobals` option reading the browser globals through `globalThis`), `scope-generation` (`declareScope`, `declareTemplateParameters`), `catch-error-generation`, `element-namespace`, `render-target`, `symbol-imports` and their types. Change them with both generators in mind, and run the specs of `ssr-compiler` too. `getTextSeparators` decides where the server writes `<!---->` and where the client consumes it (`separated`, the last argument of `_renderText`, `_renderLiteralText`, `_renderTemplate`).

The client code is the same for creating and adopting nodes: `render(nodeStrategy)` and every generated function take the node strategy and create their context with `new _Context(parentContext, nodeStrategy)`. Class bindings are emitted before the attributes, so that writing `class` finds the toggled classes.

The inputs of a component (from the metadata of its tag) are emitted with the input setters and the name of their property (`exposed`: the alias of a host-directive input). `getDeferredModules` gives each `@hydrate` and each `@defer` the modules of the components only its content renders (not the `@placeholder`, `@loading` and `@error` of a `@defer`, which render without waiting for them), emitted by `getTriggerProperties` as `load: () => Promise.all([import("…")])`; build-tools drops their static imports.

`@client` is a keyword with a block, and its `@placeholder`, read by `parseClient`, is a member of `ClientNode`, never a node of a list: the state of the `PLACEHOLDER` token only rejects an orphan one. The client code has only the content (`_client(parent, context, anchor, clientN.bind(this))`), the placeholder has none, and a listener in it is a parser error (`findEvent`). A walker of the AST reads `placeholder.children` by itself.

`@try` is a keyword with a block like `@client`, and its `@catch`, read by `parseTry`, is a member of `TryNode` (`catch: CatchNode`, with the optional `name` of the error): a `@try` without it, or an orphan `@catch` (`parseOrphanCatch`), is a parser error. The lexer reads the name between the parentheses of `@catch` as a CONDITION, validated with `assertDeclaredName`. The type-check writes a TypeScript `try`/`catch`, so the error is typed as TypeScript types the binding of a `catch` (`unknown` with `strict`), its name mapped onto the template; the generated code is `_try(parent, context, anchor, { content: tryN.bind(this), catch: catchN.bind(this) })`, the function of the `@catch` taking `error` and declaring it as a value (`context.addIdentifier('name', error)`). The root context of `render` creates its elements with `_createElement`, which constructs the components inside a `@try` (see `template-runtime.md`).

`@defer (triggers)` is followed by its `@placeholder`, `@loading` and `@error`, each one optional and declared once, in any order, read by `parseDefer` into members of `DeferNode`: an orphan `@loading` or `@error` is a parser error, and `@placeholder` reuses the `PlaceholderNode` of `@client`, its listeners allowed (the browser renders it). `@error` reads the name of its error as `@catch` does (`readErrorName`), and is type-checked as the `catch` of an empty `try`. The client code is `_defer(parent, context, anchor, { triggers, when, load, content, placeholder, loading, error })`, the function of the `@error` taking `error`; the server writes only the `@placeholder`. The keyword context proposes, after a `@defer` and its blocks, the ones not written yet (`clientPlaceholder` tells the `@placeholder` of a `@client` apart, a block of the rendering on the server).

A `@hydrate` takes the triggers of `parseHydrateTriggers`, with `never` alone, a `@defer` the ones of `parseDeferTriggers`, without `never`. `checkTriggerTargets` rejects `visible` and `interaction` on a `@hydrate` whose content is sure to render no element, and on a `@defer` whose `@placeholder` is (or without one), and `checkServerBlocks` rejects `@hydrate` and `@client` when the `ssr` option is `false` (`undefined` means not known, and they pass): they run as checks of the whole template, like `checkVariableOrder`, so that the editor keeps checking the content of the blocks. `extractComponentsMetadataFromSourceFile` reads `ssr: { render: false }` into `clientOnly`, with the trigger next to it: `findWebComponentErrors` rejects what it cannot read, and the `ssr` option when its `ssr` argument is `false` (`undefined` means not known). It is the single source of the errors of a `@WebComponent` the source file alone tells, with the span of each one, for the build (`transform`) and the editor (`getComponentDiagnostics`), and `describeSelectorConflict` gives both the message of a selector used twice. `generatorContext.getClientComponent` gives these components to the server generator.

`findComponentLogic` and `findModuleLogic` read what a class and its module do in the browser, for the analysis of the static components in `build-tools`. They prove a component static: what they cannot read counts as logic, and each case returns a reason, shown by the report of the build.
