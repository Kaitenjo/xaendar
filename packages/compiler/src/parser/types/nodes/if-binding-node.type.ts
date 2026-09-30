import type { Expression } from 'typescript';
import type { ASTNodeWithSpan } from '../ast.type';
import type { ASTNodeType } from '../node.enum';
import type { ConditionalBindingBranchNode } from './conditional-binding-branch-node.type';

/**
 * AST node representing a conditional binding declared as an `@if` chain,
 * e.g. `@if (condition) { name="value" } @else if (other) { @event="handler()" } @else { @@directive }`.
 */
export type IfBindingNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as an `@if` conditional binding.
   */
  type: ASTNodeType.IfBinding;
  /**
   * The `@if`, `@else if` and `@else` branches, in declaration order: the selected one is the first
   * whose condition holds, the `@else` branch being the only one without a condition.
   */
  branches: ConditionalBindingBranchNode<Expression>[];
}>
