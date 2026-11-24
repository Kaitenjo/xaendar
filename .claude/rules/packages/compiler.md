---
paths:
  - "packages/compiler/**"
---

# @xaendar/compiler

Turns a Xaendar template into a JS render-function body plus a type-check result. Depends on `common`, `types` and the peer `internals` only (**not** `core`: the generated code targets core's runtime without a dependency edge).

## Pipeline

`lexer` → `parser` (AST) → `type-checker` (`TypeCheckResult`, metadata resolved from `@import`s via a caller-supplied `ContextCache`) → `generator`. Each stage is a subfolder with the same layout (`<stage>/<stage>/`, `models/`, `states/`, `types/`, `utils/`).

`compile()` (`src/compile/compile.ts`) is overloaded on `CompileOptions`: `baseDir` → only `TypeCheckResult` (editor); `signals` → only JS (`render` called with the component as `this`); both → `{ javascript, typescript }`.

## Names and strings in the generated code

- Names the template writes (attribute names, directive selectors in the lexer; event names in `parseEvent`, the key of a key event excepted) reject what HTML rejects: quotes, `<`, plus `\` and control characters (`isForbiddenNameChar` of `lexer/utils/chars`). The generators then write them as they are, `'${name}'`: never escape a name in a generator, reject it at the source.
- Values (texts, static attribute values, keys of key events, paths of modules in `import`/`import()` of the generated and type-check code) go through `toStringLiteral`; the `import()` types are read back with an escape-aware regex and `fromStringLiteral` (`mapTypeModules`, `hoistImportTypes`).
- The parser nests at most `MAX_DEPTH` (512) nodes, as HTML does: every stage walks the AST recursively.

## Shared with ssr-compiler

- `public-api.ts` exports the generator internals `ssr-compiler` builds on (`resolveTemplateImports`, `generator.utils`, `scope-generation`, `catch-error-generation`, `element-namespace`, `render-target`, `symbol-imports`…): change them with both generators in mind and run the `ssr-compiler` specs.
- Also shared: `getTextSeparators` (where the server writes `<!---->` and the client consumes it), `isLastRenderedChild` (read by the server as `ServerParent.end`), `getReadForVariables`, `mapContentTemplates`, the styling utils. Change both sides together.

## Expressions

- Literals and groups of expressions and types are read only by `ExpressionScanner` (lexer: `lexExpressionText`/`lexGroup`; elsewhere `findEnd`, `findClosing`, `splitTopLevel` of `balanced-text.utils`). New constructs use them, never a scanner of their own.
- A cast `as Type` closes a whole interpolation or event parameter (CAST token → `cast` of `InterpolationNode`, `casts` of `EventNode`), or sits on a call argument inside an expression (`validateExpression`). Only the type-check reads it; `resolveExpression` drops it from the JS like `!`, and expression walkers skip the type (`forEachExpressionChild`).
- Template variables (`@for` item, implicit variables and aliases, `@let`, `<template>` parameters) are values: kind `variable`, read as `_read(context, depth, slot)`, never called. Calling one is reported by `describeVariableCall` (TS 2349), unless it holds a function.
- A binding reading variables gets their template-unique identifiers as a module constant (`const _reads0 = [0];`) so the runtime reruns it when its scope changes them (see `template-runtime.md`). An expression reading no name is constant (`isConstantExpression`: `_setExpression*`); others use `_setReactive*`, the runtime deciding whether they are effects.
- A `@for` body declares only the variables it reads (`getReadForVariables`, shared with `ssr-compiler`), as a module constant (`for0Variables = { used, names }`). The analysis (`walkTemplate`, `collectReads`, plus handlers, `@render` callee, `@case` conditions) may be wider than needed, never narrower: a new construct holding an expression or code must be visited by `walkTemplate`.

## Scopes and layouts

- Creating and adopting nodes use the same code: each scope is `_scope(parentContext, _layoutN, nodeStrategy)`; `render`'s is `_scope(null, _layout0, nodeStrategy, this)` (the component, inherited via `COMPONENT`).
- Layout slot order (`declareLayout`; identical layouts share one `_layoutN`): `SCOPE_HEADER` (= core's `HEADER`), declared variables, top nodes (`slot` in the constant), binding sites, inline-branch areas, then one container of `CONTAINER_SLOTS` (= core's, 3) per block rendered, those inside its elements included (`container` in the constant, omitted for the first). Change header and container size in both packages together. Layouts are written last (`LAYOUT_PLACEHOLDER`), since children are generated after their element.
- Variables are addressed by `(depth, slot)` (`CompilerContext.addressOf`), never by name: the runtime has no name lookup.
- An element's children render in its context (`(element, context)`, returning nothing); only children declaring names (content of an element with structural directives, held via `STRUCTURAL_LAYOUT`) create a context, `(element, parentContext)`, returning it.
- An element's namespace comes from its place in the template and is written in its constant (`namespace: 1` SVG, `2` MathML): no code changes how elements are created.

## Module constants and functions

- Everything passed to the runtime is identical across instances, so it is declared once per module: one constant per element/block (`declareConstant`: `td0$element`, `div0__if0$if`, `table0__for0$for`, `…$defer`, `template_row_12$template`…) and one module function per expression (`declareFunction`/`declareExpression`: texts, attributes, inputs, conditions, track, handlers, `when`, trigger targets…). Functions receive the context (handlers then `$event`; the track then item and implicit variables) and read members as `this`: the runtime calls them with `context[COMPONENT]`. Block functions are never `.bind(this)`.
- Names: element/block + `$` + role (`td0$on_click`, `span0$text0`), a number appended when taken. Lists a configuration does not declare are omitted.
- The last block of a parent with no anchor (root, element children, content of a `last` block; never a `@for` body or template content) is `last: true` and gives its content no anchor (`isLastRenderedChild`, `appendBlockPosition`, `getContentAnchor`). The server generator reads the same function: change both together.
- The runtime only reads constants: a block's state lives in its container, a conditional binding's in its `ConditionalBindingRun`. Every binding of a compiled scope is a binding site (`declareBinding`: `update`, `effect`, `target`); `runtime` contexts reserve none.
- An `@if`/`@switch` branch passing `rendersInline` gets an `inline` context: no scope, its nodes/bindings/cleanup counted from 0 in an area of the holding scope sized for the largest inline branch (`declareLayout` writes the block constant). The server generator follows the same rule.

## Metadata and imported modules

- Metadata hold `modulePath`, the file declaring the class, also through a barrel (`resolveExportedClass`): the generated code imports it and the type-check references the class through it (`getOwnerType`), never `typescriptNodes`.
- A compiled-library component/directive (`library` set) has no `typescriptNodes`/`templateUrl`: `modulePath` is its declaration file, the code imports `importPath` (`importPath ?? modulePath`).
- Inputs are emitted with the input setters and the property name, never the alias; binding an aliased input by its property name is a type-check error (`assertNotAliasedProperty`). An input a host directive exposes (`exposed`) is emitted by the name it is exposed with through the `ExposedInput` setters (`unbind: _resetExposedInput`), in `ssr-compiler` too.
- Customized built-in elements: `extends` of `@WebComponent` is `ComponentMetadata.extends`, and `templateUrl` is optional with it (absent for a template-less one: build-tools, language-core and the language server skip it). `findWebComponentErrors` (taking the compiler options) rejects an `extends` naming no native tag (`getNativeClassOfTag`, read from `HTMLElementTagNameMap` of the project's `lib.dom.d.ts` by `dom-members`), a template or stylesheet on a tag `acceptsShadowRoot` (`@xaendar/internals`) refuses, a stylesheet without template, and a class whose chain ends in another native class (`customElementOf(X)` of `@xaendar/core`, `getCoreImport`, or `HTMLElement` through `CustomElement`). The parser takes the static `is` out of the attributes into `ElementNode.is`/`isSpan` (never bound, in a branch, `attr.is` or on a custom element); every lookup of the component of an element goes through `getElementSelector(node)` (`is ?? tagName`, exported for ssr-compiler and language-core), the type-check checks the element against `extends` (`assertExtendedTag`), and the generators write `is` in the constant (`RenderElement.is`, `ServerElementConfig.is`).
- Host directives are inherited: `collectHostDirectiveSources` gives the `@WebComponent` decorators of the resolvable ancestors, then the class's, to `addHostDirectiveBindings`. `findHostDirectiveErrors` (build `transform` and `getComponentDiagnostics`) reports what the runtime rejects at registration, with the same messages (`checkHostDirectives`): on the exposure or directive for the class's own declarations, on the class name for an ancestor's. The members an exposed input must not be named like are the ones of the resolvable classes of the chain, plus the ones of `HTMLElement` when the last one extends it (`getHTMLElementMembers`: its interface and the ones it extends, read once from the `lib.dom.d.ts` of the project's TypeScript).
- `getDeferredModules` gives each `@hydrate`/`@defer` the modules only its content renders (not a `@defer`'s `@placeholder`/`@loading`/`@error`), emitted as `load: x$load` (`Promise.all([import("…")])`); build-tools drops their static imports.

## Blocks

- `@client`'s `@placeholder`, `@try`'s `@catch` and `@defer`'s `@placeholder`/`@loading`/`@error` are members of their node (`ClientNode`, `TryNode`, `DeferNode`), never list nodes: walkers read them explicitly; an orphan is a parser error. A listener in a `@client` placeholder is an error (the server renders it, the browser replaces it); in a `@defer` placeholder it is allowed.
- `@try`: the type-check writes a TS `try`/`catch` (error `unknown`); the `@catch` function writes `error` to the slot of its name. Elements are created with `_createElement`, which constructs components inside a `@try` (see `template-runtime.md`).
- Block parentheses are optional (`lexBlockWithParameters`); `@defer` without triggers gets `['idle']`. Block parameters (`minimum`, `after`) are parsed to ms by `readBlockParameters`/`parseDuration`.
- Triggers: `parseHydrateTriggers` (`never` alone, not after `prefetch`, no element refs) and `parseDeferTriggers` (no `never`) return `{ triggers, prefetch }`, each kind once per list. The type-check checks refs (`satisfies Element`) and observer options; `checkVariableOrder` checks options and `when`, not refs (read after the render).
- Whole-template checks, so the editor keeps checking block contents: `checkTriggerTargets` (`visible`/`interaction`/`hover` without a ref where no element can be watched) and `checkServerBlocks` (`@hydrate`/`@client` when `ssr` is `false`; `undefined` = unknown, they pass).
- `findWebComponentErrors` is the single source of the `@WebComponent` errors the source file alone tells (unreadable options, `ssr` without SSR), with spans, for the build (`transform`) and the editor (`getComponentDiagnostics`); `describeSelectorConflict` gives both the duplicate-selector message. `ssr: { render: false }` becomes `clientOnly`.

## `@for`, `<template>`, `@render`

- `@for` iterates what core's `_forItems` accepts (no strings: `FOR_ITERABLE` makes a string "not assignable to `never`"). `FOR_IMPLICIT_VARIABLES` lists the implicit variables once, in track-parameter order. `@empty` is `ForNode.empty`, its own scope without the loop variables.
- `<template>` declares a template only when its first item is a name directly followed by `(` (`expectsTemplateDeclaration`); otherwise it is a standard element whose static `content` HTML is written as is, any binding, block or ref inside being a parser error.
- A template name read as a value is `_templateRef(context, depth, constant)`. `@render` calls a template in scope or any expression (`RenderNode.calleeExpression`, constant `ref`), type-checked against `__Template<Params>`, shaped like core's `TemplateRef`. `<template name()>` children of a component's element are passed to it (`templates` in its constant), an error with structural directives.

## Bindings and events

- `[(value)]="count"` is parsed by `parseTwoWayBinding` into an attribute and a `valueChange` event calling `count.set($event.detail)`, both marked `twoWay`; everything treats them as hand-written, only the checks read `twoWay` (`assertTwoWayBindable`). `@Model` is read as `@Property` plus the event `<alias or name>Change`.
- Key events keep `name` as written; `parseKeyEvent` of `@xaendar/internals` (shared with `@HostListener` and language-core) gives the `key` filter, written into the handler (`if (_isKey($event, 'enter', 0)) …`). A key event making the same call as the last filtered listener of its event joins it (`||`). N.B. Deliberate, to save memory: the filter is never kept in the listener; unfiltered listeners and different calls are never joined, so listeners run in written order. `$event` is typed by the DOM event, never an `@Event` named like the key event.
- Native events type `$event` from the event map, never an error. With `strictEvents` (default `true`) an unknown name is a warning (`'name' satisfies keyof HTMLElementEventMap;`, `findEventCheck`); key events and `customElements` are not checked.
- `@default never;` is `exhaustive` of `SwitchNode`/`SwitchBindingNode`, never a branch, ignored by generators; the type-check writes `default: __switch<offset> satisfies never;` (`describeExhaustiveSwitch`).
- `class.x`/`style.x` are parsed by `parseStylingBinding` (no brackets). An element's `class` and `style` are mapped once each (`mapStyling`, `generator/utils/styling`, shared with `ssr-compiler`) into static parts, string expression and single keys, one indexed binding site per attribute, unless a component declares an input with that name. `styling` flags tell the runtime another source may write the attribute; directives of an element get their source `order`. Units must be in `CSS_UNITS`.
- `attr.x` keeps `name` as written (so no input is found) plus `attribute`, and is always written with the attribute setters. `x`/`attr.x` count as one attribute where `x` is not an input. Non-input attributes of a component or of an element applying directives are `shared` (`RenderElement.shared`, see `template-runtime.md`). `findReflectedInputs` warns on inputs named like a reflected attribute.

## Libraries and static components

- `findComponentLogic`/`findModuleLogic` prove a component static for build-tools: what they cannot read counts as logic, each case with a reason for the build report.
- `xaendar-manifest.json`: types in `types/library-manifest/`, one declaration per exported component/directive keyed `<module>#<ClassName>`. `toLibraryDeclaration`/`toLibraryMetadata` convert both ways (a component of a package without `ssr` gets `clientOnly`). `utils/package-libraries` reads packages (`readLibraryMetadata`, `readLibrary`, cached by `package.json` mtime, rejecting another `schemaVersion` or an incompatible `@xaendar/core`; `findPackageLibraries`). A manifest is untrusted input (`findInvalidDeclaration`): class names and input properties must be identifiers, selectors and input/event names hold no `isForbiddenNameChar`, `module`/`types`/`xaendar.manifest` are `./` paths inside the package, `name` is the package's, every export has its declaration; lookups by name go through `Object.hasOwn`.
