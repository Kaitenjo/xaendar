---
paths:
  - "**/*.ts"
---

# JSDoc

Applies to all `.ts` files except `*.spec.ts`.

- Every top-level declaration (function, class, const, type, interface, enum), exported or not, has a JSDoc.
- Functions/methods: `@param` for each parameter, `@returns` if it returns a value, `@throws` if it can throw.
- `type`/`interface`/`enum`: document each member individually too.
- Always multi-line, never `/** Text. */`:

  ```ts
  /**
   * Text.
   */
  ```
