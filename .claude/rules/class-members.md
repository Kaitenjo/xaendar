---
paths:
  - "**/*.ts"
---

# Class members

Applies to every class: components, directives and plain classes, in `packages/**` and `src/**`. Existing code in `packages/**` is migrated when touched.

## Order

1. public fields (including decorated `accessor`s: `@Property`, `@Model`, `@Event`, `@Query`)
2. protected fields
3. private fields
4. getters and setters
5. `constructor`
6. `onInit`
7. `afterRender`
8. public methods
9. protected methods
10. private methods
11. `onDestroy`

Getters and setters always go before the constructor, public ones first, then protected and private ones. Static members go with the group of their kind and visibility. Inside a group, keep the existing order.

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
public accessor language!: Aliased<InputSignal<string>, 'lang'>;
const lang = this.language() as CodeLang;

// ✓
@Property<Aliased<InputSignal<CodeLang>, 'lang'>>('ts', { alias: 'lang' })
public accessor language!: Aliased<InputSignal<CodeLang>, 'lang'>;
const lang = this.language();
```

An input with an `alias` declares it in its type too, `Aliased<InputSignal<T>, 'alias'>` (imported from `@xaendar/core/signals`): templates, `createComponent` and `renderToString` bind it by the alias only.

A `transform` taking another type than the value of the input is declared as the second type argument of the signal, which templates, `createComponent` and `renderToString` take: `@Property(0, { transform: (value: string) => Number(value) }) public accessor size!: InputSignal<number, string>;` (without it `@Property` does not compile).

An input the class also writes, and that the parent binds two-way (`[(value)]="count"`), is a model: `@Model(default)` on `public accessor value!: ModelSignal<T>` (the same generic and `Aliased` rules as `@Property`, without `transform`). Never pair a `@Property` `x` with an `@Event` `xChange` and a local signal copying the input: the model is the state, and it costs the memory of a single input.

Any type works, imported aliases included: the type-check code of the parent templates references it through the accessor of the class, never as a copy. Inputs bound statically (`kind="tip"`) are type-checked as `string`, so a literal union there rejects static values.

## Module signals

A module-level signal a template reads is imported by the template (`@import { count } from './cart.store.ts'`). The class reads it directly (`count()`): never copy it into a member (`public readonly count = count;`) or forward it through a method. The bindings follow any signal they read at runtime, however they reach it, but the type-check recognizes a signal only by its declaration: annotate a member initialized by a function of the application or from another object (`level = readLevel()`, `this.log = target.log`) with a type of `@xaendar/core/signals`, so that the conditions of `@if` narrow it.

## Module constants

A module-level constant used by a single class only belongs in that class, as a private field (`private readonly _codeLangs = [...]`), or as a public one if a template reads it. Keep at module level only what is exported, shared by several classes or functions, or state shared by every instance (instance counters, caches).
