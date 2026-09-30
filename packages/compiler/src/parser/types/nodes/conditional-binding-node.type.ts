import type { Expression } from 'typescript';
import type { ASTNodeWithSpan } from '../ast.type';
import type { ASTNodeType } from '../node.enum';
import type { AttributeNode } from './attribute-node.type';
import type { DirectiveNode } from './directive-node.type';
import type { EventNode } from './event-node.type';

/**
 * AST node representing a conditional binding, e.g. `@(condition, name="value" @event="handler()" @@directive)`:
 * its bindings are applied only while the condition holds.
 *
 * A conditional binding is declared either on an element, where it binds the attributes and events of the
 * element and applies directives to it, or inside a directive, where it binds the properties and events of
 * that directive.
 */
export type ConditionalBindingNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a conditional binding.
   */
  type: ASTNodeType.ConditionalBinding,
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
   * Nested conditional binding nodes within this conditional binding.
   */
  conditionalBindings: ConditionalBindingNode[];
  /**
   * Directive nodes applied to the element while the condition holds.
   * Always empty for a conditional binding declared inside a directive.
   */
  directives: DirectiveNode[];
}>