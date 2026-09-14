import type { Expression } from 'typescript';
import type { ASTNodeWithSpan } from '../ast.type';
import type { ASTNodeType } from '../node.enum';
import type { AttributeNode } from './attribute-node.type';
import type { EventNode } from './event-node.type';

export type DynamicBindingNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a dynamic binding.
   */
  type: ASTNodeType.DynamicBinding,
  /**
   * The condition expression string.
   */
  condition: Expression;
  /**
   * Attribute nodes bound to this element.
   */
  attributes: AttributeNode[];
  /**
   * Event binding nodes attached to this element.
   */
  events: EventNode[],
  /**
   * Nested dynamic binding nodes within this dynamic binding.
   */
  dynamicBindings: DynamicBindingNode[];
}>