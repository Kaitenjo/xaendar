import type { LiteralUnion } from 'type-fest';

/**
 * The bindings of a component created by `createComponent`, opened to the inputs and the events its host directives
 * expose: TypeScript cannot read them, since the exposures live in the options of `@WebComponent` and not in the type
 * of the class. Every name is accepted, with the type of `Exposed`, while the names the class declares keep their own
 * type and stay the ones the editor suggests: `LiteralUnion` keeps them apart from `string`, which would absorb them.
 *
 * Written as a mapped type over the names, not as an intersection with an index signature, which would check the
 * declared names against it too (a native listener would have to take any event).
 *
 * @template Bindings - The bindings the class declares, by name (see `BindableProperties` and `BindableEvents`).
 * @template Exposed - The type of a binding of a name the class does not declare.
 */
export type ExposableBindings<Bindings, Exposed> = {
  [Name in LiteralUnion<keyof Bindings & string, string>]?: Name extends keyof Bindings ? Bindings[Name] : Exposed
};
