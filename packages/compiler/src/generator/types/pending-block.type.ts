import type { BlockBranch } from './block-branch.type';

/**
 * The constant of an `@if` or of a `@switch` rendering some branches inline, declared once the layout of the scope
 * holding it is (see `GeneratorContext.declareLayout`): the slots of the branches are known only once every function is
 * generated.
 */
export type PendingBlock = {
  /**
   * The name the constant is declared with.
   */
  readonly name: string;
  /**
   * The members of the constant before its branches.
   */
  readonly members: readonly string[];
  /**
   * The branches of the block.
   */
  readonly branches: readonly BlockBranch[];
};
