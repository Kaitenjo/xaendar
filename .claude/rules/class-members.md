---
paths:
  - "**/*.ts"
---

# Class members

Applies to every class: components, directives and plain classes, in `packages/**` and `src/**`. Existing code in `packages/**` is migrated when touched.

## Order

1. public fields (including decorated `accessor`s: `@Property`, `@Event`, `@Query`)
2. protected fields
3. private fields
4. `constructor`
5. `onInit`
6. `afterRender`
7. public methods
8. protected methods
9. private methods
10. `onDestroy`

Getters and setters go with the methods of their visibility, and static members with the group of their kind and visibility. Inside a group, keep the existing order.

A field initializer runs in declaration order. When a public field is initialized eagerly from a private one, declare the public field without an initializer and assign it in the constructor; do not break the order. Arrow functions and `computed` callbacks are lazy and are not affected.

## Private members

- Every private field and method starts with `_` (`private readonly _labels`, `private _write()`). `#private` names are not used.
- Members read by a template must be `public`. The template compiler rejects private and protected members.

## Computed signals

The callback of a `computed` stored in a field lives in a private method named `_compute` + the field name in PascalCase. The field only calls it:

```ts
/**
 * The text of the rating to draw.
 */
public readonly label = computed(() => this._computeLabel());

/**
 * Computes the value of `label`.
 *
 * @returns The text of the rating to draw.
 */
private _computeLabel(): string {
  return this._labels[this.shown() - 1];
}
```

This applies to every computed field, one-liners included. The method has an explicit return type, written with the type names already in scope (`Array<ApiEntry & { href: string }>`, not an expanded object literal). Other options (`{ equals }`) stay in the `computed` call. Computed signals at module level (stores) keep their callback inline.

## Input types

When the type of an input is narrower than what its default infers (a union of literals, a nullable value, `unknown`), pass the signal type to `@Property` as a generic and give the accessor the same type. Never widen the accessor to `string` and cast on read:

```ts
// ✗
@Property('ts', { alias: 'lang' })
public accessor language!: InputSignal<string>;
const lang = this.language() as CodeLang;

// ✓
@Property<InputSignal<CodeLang>>('ts', { alias: 'lang' })
public accessor language!: InputSignal<CodeLang>;
const lang = this.language();
```

Any type works, imported aliases included: the type-check code of the parent templates references it through the accessor of the class, never as a copy. Inputs bound statically (`kind="tip"`) are type-checked as `string`, so a literal union there rejects static values.

## Module signals

A module-level signal exposed to the template is a member initialized with it, without annotation: `public readonly count = count;`. TypeScript infers its type, and the template compiler follows the import to the declaration of the signal, so attribute bindings reading it are reactive. Do not import `Signal`/`Computed` only to annotate it. A signal taken from another object (`this.log = target.log`) is not followed: type that member with its signal type.

## Module constants

A module-level constant used by a single class only belongs in that class, as a private field (`private readonly _codeLangs = [...]`), or as a public one if a template reads it. Keep at module level only what is exported, shared by several classes or functions, or state shared by every instance (instance counters, caches).
