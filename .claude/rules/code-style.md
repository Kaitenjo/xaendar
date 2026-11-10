---
paths:
  - "**/*.{ts,js,mjs}"
---

# Code style

- Strings use single quotes (`'...'`), per ESLint `quotes: single`.
- Prefix unused vars/params with `_` (e.g. `_event`).
- Never use one-letter identifiers: variables, parameters (arrow callbacks included), catch bindings, type parameters. Name what the value is (`item`, `index`, `error`, `TValue`): the build minifies the names anyway. The only exception is the counter of a `for` loop: `i`, then `j`, `k` in nested loops.
- Never put `void` in front of a call to discard its result (`void client.start()`, `void this._load(id)`): call the function as a plain statement, or `await` it / chain `.then`/`.catch` when the promise must be handled.
- Don't indent function parameters vertically.
- Never declare a function inside another function, as a constant (`const add = () => …`) or with `function`: write it at module level, or as a private method of the class, passing what it reads as parameters. State several of them share goes in an object passed to each one (`DeferRun` of `_defer`). Inline callbacks passed as arguments are fine (`items.map(item => …)`, `forEachChild(node, child => visit(child, node))`). Exceptions:
  - a one-line type predicate (`const isDirective = (directive: CustomDirective): directive is Directive => directive instanceof Directive;`);
  - a function that is itself the value returned or registered, capturing the state of the call: the getter of a signal, a listener removed later, the `disarm` returned by `armTriggers`;
  - a function written into the page with `toString()`, which reads nothing outside of itself (`eventContract`).

  ```ts
  // ✗
  function collectReads(expression: Expression): Identifier[] {
    const reads = new Array<Identifier>();
    const visit = (node: Node): void => { … forEachChild(node, visit); };
    visit(expression);
    return reads;
  }

  // ✓
  function collectReads(expression: Expression): Identifier[] {
    const reads = new Array<Identifier>();
    collectReadsOf(expression, reads);
    return reads;
  }

  function collectReadsOf(node: Node, reads: Identifier[]): void {
    …
    forEachChild(node, child => collectReadsOf(child, reads));
  }
  ```
- Never test a condition and its negation in two separate `if`s (`if (x) { … } if (!x) { … }`): write `if (x) { … } else { … }`.
- When the `if` and the `else` each hold a single line, write a ternary instead: `return x ? a : b;`, `value = x ? a : b;`, `x ? open() : close();`. Keep `if`/`else` only when a branch holds several statements or one a ternary cannot express (`throw`, `break`, `continue`, a `return` in one branch only).
- Never compare the same value with several constants in separate `if`s (`if (kind === 'a') { … } if (kind === 'b') { … }`) or in an `else if` chain: write a `switch (kind)` with one `case` per value and a `default` when the other values need handling too. The same holds in templates, with `@if`/`@else` and `@switch`.
- In the options of `@WebComponent` and `@Directive`, `selector` comes first and the other fields follow in alphabetical order (`selector`, `hostDirectives`, `styleUrl`, `templateUrl`). This holds in the snippets of `src/docs` too.
- Never create an empty array, `Map`, `Set` or object just to loop over it or to spread it, and never spread an array or an object that may be empty: a spread is several times slower than an `if`. A function whose collection may be missing returns `undefined`, not an empty collection (`return (x && await load(x)) || new Map()` ✗). The caller takes the result in a `const`, checks it with `?.length` (array) or `?.size` (`Map`, `Set`), which covers `null`, `undefined` and empty, and only then loops or pushes. Never write `?? []`, `|| []`, `?? new Map()`, `|| new Set()`, `...(x ?? [])`, `...(condition ? [item] : [])`, `...(x ?? {})`, `...(condition ? { key: value } : {})` or `...condition && { key: value }`. An optional member of an object is assigned after creating it, under an `if` (`if (span) { item.textEdit = … }`); objects to merge go through `Object.assign({}, first, second)`, which skips `undefined` sources:

  ```ts
  // ✗
  const metadatas = new Map([...(await extractComponents(file) ?? []), ...(await extractDirectives(file) ?? [])]);

  // ✓
  const metadatas = new Map(await extractComponents(file));
  const directives = await extractDirectives(file);
  if (directives?.size) {
    for (const [name, directive] of directives) {
      metadatas.set(name, directive);
    }
  }
  ```

  ```ts
  // ✗
  return { label, kind, ...replacementSpan && { textEdit: toEdit(replacementSpan) } };

  // ✓
  const item = { label, kind };
  if (replacementSpan) {
    item.textEdit = toEdit(replacementSpan);
  }

  return item;
  ```

  An `if` on a collection always checks `length` / `size`: `if (items?.length)`, never `if (items)`. A final value returned to a caller that expects a collection (`return []` of an LSP handler) is fine.
- Never write `.forEach(...)`. To iterate an **array** never write `for (… of …)` either: use a native indexed `for` (`for (let i = 0; i < items.length; i++)`), reading the item as `const item = items[i]`. Loop on the array where it lives (`i < this._hooks.length`): never alias it to a local variable only to loop over it. A variable is for the result of a call or a computation (`const templates = documents.filter(isTemplate)`), which must not be evaluated at every iteration. To iterate a `Map` or a `Set` (or its `.values()`, `.keys()`, `.entries()`) use `for (… of …)` directly on it: never copy it into an array just to index it. Other array methods (`map`, `filter`, `some`, `reduce`…) are fine.

## Memory of small, numerous objects

Code that runs once per instance (per `@for` item, per element, per binding, per signal node: `_Context`, the `utils/` called by the generated render code, the nodes of `@xaendar/signals`) is multiplied by tens of thousands in a large template: a few bytes there are megabytes. Everywhere else, write the clearest code.

### Arrays

V8 grows an array's backing store to about 1.5 × its new length **+ 16 slots**, and never gives the extra slots back while the array lives. One element pushed into `[]` costs ~184 bytes in Node (8 bytes per slot; 4 in Chrome), against 56 for the literal `[item]`.

- Allocated at their exact length: literals (`[item]`, `[a, b]`), `new Array(n)` filled within its length, `map`, `slice`, `concat`, rest parameters.
- Allocated with spare slots: `push` or an index past the end on an array that has to grow, `filter`, spread with extra elements (`[...items, item]`), `Array.from` of an iterable of unknown length.
- A list that usually holds 0–1 elements is `null` until its first element, then the literal `[item]`; `push` only from the second. A getter returns a shared frozen empty array (`Object.freeze([])`) when there is none, provided its callers only read it.
- Keep a rest parameter (`...fns`) as it is instead of copying it into another array.
- Copy-on-write lists copy with `concat`/`slice`, never with spread.

### Sets and Maps

A `Set` or a `Map` allocates a hash table (~140 bytes) even when it holds one element or none. For collections that usually hold 1–2 items use an exact array (see above) or create the `Set`/`Map` lazily, on the first insertion.

### Closures

A function created inside another one is a new object (~60 bytes plus its context) on every call, arrow or `function` alike. Where it would be created per instance, declare it once at module level, or on a shared prototype, and pass the data as parameters or through `this`. All closures created in the same scope share one context: one reading a large value keeps it alive for all of them.

### Verify

Measure before and after (`process.memoryUsage().heapUsed` after `gc()`, or a heap snapshot): an apparently lighter version can allocate more, e.g. a field made lazy with `??= []` then `push`.

### Document

Every choice made to save memory that looks odd or worse than the obvious code (fixed argument slots instead of a closure, state in an object passed to a module-level function, `null` instead of an empty array, a union accepting an object as well as a function...) gets a paragraph starting with `N.B.` in the JSDoc of the declaration it shapes: what was chosen, what it saves, which obvious alternative it avoids, and `Do not ...` replace it with that alternative. Without it, the code reads as badly written and gets "fixed", bringing the memory back.
