import type { Expression } from 'typescript';
import type { ASTNodeWithSpan } from '../ast.type';
import type { ASTNodeType } from '../node.enum';
import type { ConditionalBindingBranchNode } from './conditional-binding-branch-node.type';

/**
 * AST node representing a conditional binding declared as a `@switch`,
 * e.g. `@switch (expression) { @case ('a') @case ('b') { name="value" } @default { @event="handler()" } }`.
 */
export type SwitchBindingNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a `@switch` conditional binding.
   */
  type: ASTNodeType.SwitchBinding;
  /**
   * The expression whose value selects the branch.
   */
  expression: Expression;
  /**
   * The `@case` and `@default` branches, in declaration order: the selected one is the first listing the value
   * of the expression among its conditions, the `@default` branch being the only one without conditions.
   */
  branches: ConditionalBindingBranchNode<string[]>[];
}>
