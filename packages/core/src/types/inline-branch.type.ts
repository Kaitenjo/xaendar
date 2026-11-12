import type { BindingSite } from './binding-site.type';

/**
 * A branch of an `@if` or of a `@switch` rendered inline (see `renderInline`): it declares no variable and renders no
 * block, so it creates no scope, and renders into the scope holding the block, in an area of slots the compiler
 * reserves for the branches of the block, as large as the largest one. The container of the block holds the branch
 * while it is rendered (see `CONTENT`), which tells the scope where its nodes, its bindings and its cleanups are.
 *
 * N.B. Deliberate, to save memory: a simple branch, as the `@default` of a cell rendering a `<span>`, costs a few slots
 * of the scope of the cell instead of a scope of its own, an array with its whole header. The branches of a block share
 * the slots, emptied and disposed when another branch is rendered, in the order `clear` disposes a scope. Do not give
 * such a branch a scope again.
 */
export type InlineBranch = {
  /**
   * The first slot of the area of the block, the same for each of its branches: the slots of the branch are counted
   * from it.
   */
  readonly base: number;
  /**
   * The number of slots of the area the branch fills, emptied when it is no longer rendered.
   */
  readonly size: number;
  /**
   * The slots of the nodes at the top of the branch, counted from {@link base}, in the order they are rendered: all
   * inserted into the node the block renders into.
   */
  readonly nodes: readonly number[];
  /**
   * The bindings of the branch, in the order they are rendered, their slots counted from {@link base} (see
   * `BindingSite`): left out when it has none.
   */
  readonly sites?: readonly BindingSite[];
  /**
   * The slot, counted from {@link base}, holding the cleanups of the branch, its listeners, as the slot `CLEANUP` of a
   * scope holds them: left out when it has none.
   */
  readonly cleanup?: number;
};
