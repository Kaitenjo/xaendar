import type { Cleanup } from './cleanup.type';
import type { NodeStrategy } from './node-strategy.type';
import type { _ScopeLayout } from './scope-layout.type';

/**
 * The scope of a block of a template at runtime (the root of a component, the body of an item of a `@for`, a branch of
 * an `@if`...): a plain array of the exact length its layout gives (see `_ScopeLayout`), whose slots the compiler
 * decides. The header holds what every scope has, at the indices of `costants.ts` (`PARENT`, `PARENT_NODE`, `STATE`,
 * `COMPONENT`, `STRATEGY`, `CLEANUP`, `LAYOUT`, `CHILDREN`), followed by the variables the block declares and by the
 * nodes at its top.
 *
 * Read and written only through the functions of `utils/context`: the generated code reads a variable with `_read` and
 * writes one with `_set`, given how many scopes up it is declared and its slot.
 */
export interface _Context extends Array<unknown> {
  /**
   * The scope declaring the block: the one its variables of the enclosing blocks are read from. `null` for the root of a
   * render, and for the scopes the runtime creates outside of any template (the staging scopes of the components and of
   * the directives, the scope of a component `createComponent` creates).
   */
  0: _Context | null;
  /**
   * The node the nodes at the top of the block are inserted into, the same for all of them: set by the first node
   * tracked, `null` before.
   */
  1: Node | null;
  /**
   * The last refresh that brought the scope up to date (see `refresh`).
   */
  2: number;
  /**
   * The component whose template the scope renders: the expressions of the template are called with it as `this`.
   */
  3: unknown;
  /**
   * How the nodes rendered in the scope are got: `null` for `CREATE_NODES`, the strategy of nearly every scope.
   */
  4: NodeStrategy | null;
  /**
   * What the scope runs or disposes when it is cleared: `null`, a single cleanup, or an array of them from the second.
   */
  5: Cleanup | Cleanup[] | null;
  /**
   * The layout of the scope, shared by every instance of its block.
   */
  6: _ScopeLayout;
  /**
   * The scopes inside this one (the branch of an `@if`, the items of a `@for`...): `null`, a single scope, or an array
   * of them from the second, told apart by its `STATE` slot, a scope being an array too.
   *
   * N.B. Deliberate, to save memory: most scopes hold one child (the branch of the `@switch` of a cell, the row of a
   * `@for` holding one block), and the scope itself costs nothing, where the array `[child]` costs a `JSArray` and its
   * backing store per scope. Do not go back to an array for a single child.
   */
  7:_Context | _Context[] | null;
}
