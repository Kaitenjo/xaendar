import type { ASTNodeWithSpan } from '../ast.type';
import type { ASTNodeType } from '../node.enum';
import type { AttributeNode } from './attribute-node.type';
import type { ConditionalBindingNode } from './conditional-binding-node.type';
import type { DirectiveNode } from './directive-node.type';
import type { EventNode } from './event-node.type';

/**
 * AST node representing a branch of a conditional binding, i.e. the bindings declared in the block of an
 * `@if`, `@else if`, `@else`, `@case` or `@default`: they are applied only while the branch is the selected one.
 *
 * @template Condition - What selects the branch: the condition expression in an `@if` chain, the values matched in a `@switch`.
 */
export type ConditionalBindingBranchNode<Condition = unknown> = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a branch of a conditional binding.
   */
  type: ASTNodeType.ConditionalBindingBranch;
  /**
   * What selects the branch, or `null` for the branch selected when no other one is (`@else`, `@default`).
   */
  condition: Condition | null;
  /**
   * Attribute nodes bound while the branch is selected.
   */
  attributes: AttributeNode[];
  /**
   * Event binding nodes attached while the branch is selected.
   */
  events: EventNode[];
  /**
   * Conditional binding nodes nested in the branch, evaluated only while the branch is selected.
   */
  conditionalBindings: ConditionalBindingNode[];
  /**
   * Directive nodes applied to the element while the branch is selected.
   * Always empty for a conditional binding declared inside a directive.
   */
  directives: DirectiveNode[];
}>
