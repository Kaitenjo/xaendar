---
paths:
  - "**/*.{ts,js,mjs}"
---

# Code style

- Strings use single quotes (`'...'`), per ESLint `quotes: single`.
- Prefix unused vars/params with `_` (e.g. `_event`).
- Never use one-letter identifiers: variables, parameters (arrow callbacks included), loop counters, catch bindings, type parameters. Name what the value is (`item`, `index`, `error`, `TValue`): the build minifies the names anyway.
- Never put `void` in front of a call to discard its result (`void client.start()`, `void this._load(id)`): call the function as a plain statement, or `await` it / chain `.then`/`.catch` when the promise must be handled.
- Don't indent function parameters vertically.
- Never test a condition and its negation in two separate `if`s (`if (x) { … } if (!x) { … }`): write `if (x) { … } else { … }`.
- Never compare the same value with several constants in separate `if`s (`if (kind === 'a') { … } if (kind === 'b') { … }`) or in an `else if` chain: write a `switch (kind)` with one `case` per value and a `default` when the other values need handling too. The same holds in templates, with `@if`/`@else` and `@switch`.
- In the options of `@WebComponent` and `@Directive`, `selector` comes first and the other fields follow in alphabetical order (`selector`, `styleUrl`, `templateUrl`). This holds in the snippets of `src/docs` too.
