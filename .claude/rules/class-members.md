---
paths:
  - "**/*.ts"
---

# Class members

Every class (components, directives, plain classes) in `packages/**` and `src/**`; existing code in `packages/**` is migrated when touched.

## Order

public fields (decorated `accessor`s included: `@Property`, `@Model`, `@Event`, `@Query`) → protected fields → private fields → getters and setters (public, protected, private) → `constructor` → `onInit` → `afterRender` → public methods → protected methods → private methods → `onDestroy`.

Static members go with their kind and visibility; inside a group keep the existing order. Field initializers run in declaration order: when a public field is initialized eagerly from a private one, declare it without initializer and assign it in the constructor. Arrow functions and `computed` callbacks are lazy and unaffected.

## Private members

- Private fields and methods start with `_` (`private readonly _labels`, `private _write()`), never `#private`.
- Members a template reads are `public`: the template compiler rejects private and protected ones.

## Computed signals

A `computed` field's callback lives in a private method `_compute` + the field name in PascalCase, one-liners included; the field only calls it. The method has an explicit return type using the type names in scope (`Array<ApiEntry & { href: string }>`, not an expanded literal). Options (`{ equals }`) stay in the `computed` call. Module-level computeds (stores) keep their callback inline.

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

## Input types

- An input narrower than its default infers (literal union, nullable, `unknown`) passes the signal type to `@Property` as a generic, with the same type on the accessor. Never widen the accessor and cast on read:

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
- An input with an `alias` declares it in its type, `Aliased<InputSignal<T>, 'alias'>` (`@xaendar/core/signals`): templates, `createComponent` and `renderToString` bind it by the alias only.
- A `transform` taking another type declares it as the signal's second type argument, or `@Property` does not compile: `@Property(0, { transform: (value: string) => Number(value) }) public accessor size!: InputSignal<number, string>;`.
- An input the class also writes, bound two-way by the parent (`[(value)]="count"`), is a model: `@Model(default)` on `public accessor value!: ModelSignal<T>` (same generic and `Aliased` rules, no `transform`). Never pair a `@Property` `x` with an `@Event` `xChange` and a local signal copying the input: the model is the state, at the memory cost of one input.
- Any type works, imported aliases included (the parent's type-check reads it through the accessor). Statically bound inputs (`kind="tip"`) are type-checked as `string`, so a literal union rejects static values.

## Module signals and constants

- A module-level signal a template reads is imported by the template (`@import { count } from './cart.store.ts'`); the class reads it directly (`count()`), never copied into a member (`public readonly count = count;`) or forwarded by a method.
- Bindings follow any signal they read at runtime, but the type-check recognizes a signal only by its declaration: annotate a member initialized by an application function or from another object (`level = readLevel()`, `this.log = target.log`) with a type of `@xaendar/core/signals`, so `@if` conditions narrow it.
- A module-level constant used by a single class becomes a member: private (`private readonly _codeLangs = [...]`), or public if a template reads it. Module level keeps only what is exported, shared by several classes or functions, or state shared by every instance (counters, caches).
