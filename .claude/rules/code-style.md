---
paths:
  - "**/*.{ts,js,mjs}"
---

# Code style

- Single quotes (ESLint `quotes: single`).
- Never join strings with `+` or `+=`: use a template literal (`+=` stays for numbers).

  ```ts
  // ✗
  const label = 'target <' + element.localName + '>';
  out += token('punc', '{');

  // ✓
  const label = `target <${element.localName}>`;
  out = `${out}${token('punc', '{')}`;
  ```
- Prefix unused vars/params with `_` (`_event`).
- A comment over one line is a block with its text indented on its own lines; a single-line comment stays `// text`. Never stack `//` lines:

  ```ts
  /*
    the first line of the comment,
    the second line
  */
  ```
- No one-letter identifiers (variables, parameters and arrow callbacks, catch bindings, type parameters): name what the value is (`item`, `index`, `error`, `TValue`). Only a `for` counter is `i`, then `j`, `k`.
- Never `void` a call to discard its result (`void this._load(id)`): call it as a statement, or `await` it / chain `.then`/`.catch` when the promise must be handled.
- Don't indent function parameters vertically.
- Never declare a function inside another one (`const add = () => …` or `function`): write it at module level or as a private method, passing what it reads as parameters; state several of them share goes in an object passed to each (`DeferRun` of `_defer`). Inline callbacks passed as arguments are fine (`items.map(item => …)`). Exceptions: a one-line type predicate (`const isDirective = (directive: CustomDirective): directive is Directive => directive instanceof Directive;`); a function that is itself the value returned or registered, capturing the call's state (a signal getter, a listener removed later, the `disarm` of `armTriggers`); a function written into the page with `toString()` (`eventContract`).

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
- Never test a condition and its negation in two `if`s: `if (x) { … } else { … }`.
- When `if` and `else` each hold a single line, use a ternary (`return x ? a : b;`, `value = x ? a : b;`, `x ? open() : close();`); keep `if`/`else` when a branch holds several statements or one a ternary cannot express (`throw`, `break`, `continue`, a `return` in one branch only).
- Never compare the same value with several constants in separate `if`s or an `else if` chain: use `switch` with one `case` per value and a `default` when needed. In templates too (`@switch`).
- `@WebComponent`/`@Directive` options: `selector` first, the rest alphabetical (`selector`, `hostDirectives`, `styleUrl`, `templateUrl`), in the `src/docs` snippets too.
- Never create an empty array, `Map`, `Set` or object just to loop over or spread it, and never spread one that may be empty (a spread is several times slower than an `if`). A function whose collection may be missing returns `undefined`; the caller keeps the result in a `const`, checks `?.length` / `?.size` (covers `null`, `undefined`, empty), then loops or pushes. Never `?? []`, `|| []`, `?? new Map()`, `|| new Set()`, `...(x ?? [])`, `...(condition ? [item] : [])`, `...(x ?? {})`, `...(condition ? { key: value } : {})`, `...condition && { key: value }`. Assign an optional member under an `if` after creating the object; merge objects with `Object.assign({}, first, second)` (skips `undefined`).

  ```ts
  // ✗
  const metadatas = new Map([...(await extractComponents(file) ?? []), ...(await extractDirectives(file) ?? [])]);
  return { label, kind, ...replacementSpan && { textEdit: toEdit(replacementSpan) } };

  // ✓
  const metadatas = new Map(await extractComponents(file));
  const directives = await extractDirectives(file);
  if (directives?.size) {
    for (const [name, directive] of directives) {
      metadatas.set(name, directive);
    }
  }

  const item = { label, kind };
  if (replacementSpan) {
    item.textEdit = toEdit(replacementSpan);
  }

  return item;
  ```

  A collection is tested by `length`/`size` (`if (items?.length)`, never `if (items)`). A final value a caller expects as a collection (`return []` of an LSP handler) is fine.
- Never `.forEach(...)`. Loop over an **array** with an indexed `for` (`for (let i = 0; i < items.length; i++)`, `const item = items[i]`), never `for…of`, on the array where it lives (`i < this._hooks.length`), not on a local alias; a variable is for the result of a call or computation (`const templates = documents.filter(isTemplate)`) that must not run per iteration. Loop over a `Map`/`Set` (or its `.values()`, `.keys()`, `.entries()`) with `for…of` directly, never copied into an array. `map`, `filter`, `some`, `reduce` are fine.

## Memory of small, numerous objects

Code running once per instance (per `@for` item, element, binding, signal node: `_Context`, the `utils/` called by generated render code, the nodes of `@xaendar/signals`) is multiplied by tens of thousands: a few bytes there are megabytes. Elsewhere, write the clearest code.

- **Arrays**: V8 grows a backing store to ~1.5 × the new length **+ 16 slots** and never gives them back (one element pushed into `[]`: ~184 bytes in Node, against 56 for `[item]`). Exact length: literals, `new Array(n)` filled within its length, `map`, `slice`, `concat`, rest parameters. Spare slots: `push` or an index past the end on a growing array, `filter`, spread with extra elements, `Array.from` of an iterable of unknown length.
  - A list usually holding 0–1 elements is `null`, then `[item]`, `push` only from the second. A getter returns a shared `Object.freeze([])` when empty, if callers only read it.
  - Keep a rest parameter as it is; copy-on-write lists copy with `concat`/`slice`, never spread.
- **Sets and Maps** allocate a hash table (~140 bytes) even when empty: for 1–2 items use an exact array, or create them lazily on first insertion.
- **Closures**: a function created inside another one is a new object (~60 bytes plus context) per call. Where it would be per instance, declare it once at module level or on a shared prototype and pass data as parameters or through `this`. Closures of one scope share a context: one reading a large value keeps it alive for all.
- **Verify**: measure before and after (`process.memoryUsage().heapUsed` after `gc()`, or a heap snapshot): a seemingly lighter version can allocate more (a lazy `??= []` then `push`).
- **Document**: every memory-saving choice that looks odd or worse than the obvious code (fixed argument slots instead of a closure, state in an object passed to a module function, `null` instead of an empty array, a union accepting an object or a function…) gets an `N.B.` paragraph in the JSDoc of the declaration: what was chosen, what it saves, which obvious alternative it avoids, and `Do not ...` replace it. Without it, the code gets "fixed" and the memory comes back.
