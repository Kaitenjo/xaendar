import type { BindingSite } from './binding-site.type';

/**
 * The layout of the scopes of a block of a template (see `_Context`): a constant of the module of the template, written
 * by the compiler and shared by every instance of the block (the body of a `@for`, a branch of an `@if` or of a
 * `@switch`, the content of a template, the root of a component...), or a constant of the runtime for the scopes it
 * creates by itself.
 *
 * A scope is an array of exactly `size` slots: the header (see `HEADER`), then the variables, then the nodes at the top
 * of the block, from `nodes` to `bindings`, then the slots of its bindings, then the areas of the branches its `@if`s
 * and `@switch`es render inline (see `InlineBranch`), up to `containers`, then the containers of the blocks it renders,
 * `CONTAINER_SLOTS` slots each, from `containers` to the end.
 *
 * N.B. Deliberate, to save memory and time: each block a scope renders (`@if`, `@switch`, `@for`, `@defer`, `@try`,
 * `@hydrate`, `@client`, `@render`, the content of an element structural directives are applied to) holds what it shows
 * and its state in a few slots of the scope the compiler gives it, a container: the scope shown, `null`, the rows of a
 * `@for` and their keys, the branch rendered inline, where it renders. The scope finds the scopes inside it in its
 * containers, instead of a list of children every block registers into and removes from, which costs an array per
 * scope and a search of the list for every scope removed, quadratic when a `@for` removes its rows. The compiler counts
 * the blocks as it generates the body, after its nodes, so the constant of a block holds the index of its container
 * among the containers of its scope (`container`, left out for the first), from which the runtime finds its first slot
 * once per block (`containerSlot`). Do not go back to a list of children.
 */
export type _ScopeLayout = {
  /**
   * The number of slots of a scope: the length of its array.
   */
  readonly size: number;
  /**
   * The slot of the first node at the top of the block: the nodes fill the slots from it to the first binding, or to
   * the first container.
   */
  readonly nodes: number;
  /**
   * The first slot of the bindings of the block (see `BindingSite`), after its nodes: the slots of the bindings follow
   * it, then the areas of the branches rendered inline, up to the first container. Left out when the block has no
   * binding the compiler reserves slots for, as it has none rendering a branch inline.
   */
  readonly bindings?: number;
  /**
   * The bindings of the block, in the order they are rendered: the scope runs again the ones reading a variable changed
   * when it is refreshed, and disposes their effects when it is cleared. Left out with {@link bindings}.
   */
  readonly sites?: readonly BindingSite[];
  /**
   * The slot of the first container: the containers fill the slots from it to the end of the scope. Left out when the
   * block renders no block.
   */
  readonly containers?: number;
  /**
   * The names of the variables, the one of the slot `HEADER + i` at `i`, which only the errors read: left out when the
   * block declares none.
   */
  readonly variables?: readonly string[];
};
