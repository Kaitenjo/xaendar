import type { LayoutBranch } from './layout-branch.type';

/**
 * A control-flow block: an `@if` with its `@else if` and `@else` branches, a `@for`, a `@switch` with its cases, a
 * `@hydrate`, a `@client` with its `@placeholder`, or a `@try` with its `@catch`.
 */
export type LayoutBlock<Body> = {
  /**
   * Discriminant identifying the node as a block.
   */
  readonly kind: 'block';
  /**
   * The keyword opening the block: `if`, `for`, `switch`, `hydrate`, `client` or `try`.
   */
  readonly keyword: 'if' | 'for' | 'switch' | 'hydrate' | 'client' | 'try';
  /**
   * The expression a `@switch` is on, `undefined` for the other blocks.
   */
  readonly expression?: string;
  /**
   * The branches of the block, the first one included: the cases of a `@switch`.
   */
  readonly branches: LayoutBranch<Body>[];
};
