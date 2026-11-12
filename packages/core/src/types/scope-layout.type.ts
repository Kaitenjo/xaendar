/**
 * The layout of the scopes of a block of a template (see `_Context`): a constant of the module of the template, written
 * by the compiler and shared by every instance of the block (the body of a `@for`, a branch of an `@if` or of a
 * `@switch`, the content of a template, the root of a component...), or a constant of the runtime for the scopes it
 * creates by itself.
 *
 * A scope is an array of exactly `size` slots: the header (see `HEADER`), then the variables, then the nodes at the top
 * of the block, from `nodes` to the end.
 */
export type _ScopeLayout = {
  /**
   * The number of slots of a scope: the length of its array.
   */
  readonly size: number;
  /**
   * The slot of the first node at the top of the block: the nodes fill the slots from it to the end of the scope.
   */
  readonly nodes: number;
  /**
   * The names of the variables, the one of the slot `HEADER + i` at `i`, which only the errors read: left out when the
   * block declares none.
   */
  readonly variables?: readonly string[];
};
