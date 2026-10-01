import type { ASTNodeWithSpan } from '../ast.type';
import type { ASTNodeType } from '../node.enum';
import type { AttributeNode } from './attribute-node.type';
import type { ConditionalBindingNode } from './conditional-binding-node.type';
import type { EventNode } from './event-node.type';

/**
 * AST node representing a directive applied to an element,
 * e.g. `@@myDirective(display="block" (change)="onChange($event)" @if (condition) { position="top" })`.
 */
export type DirectiveNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a directive.
   */
  type: ASTNodeType.Directive,
  /**
   * The selector of the directive.
   */
  selector: string;
  /**
   * Attribute nodes bound to the directive properties.
   */
  attributes: AttributeNode[];
  /**
   * Event binding nodes listening to the directive events.
   */
  events: EventNode[];
  /**
   * Conditional binding nodes binding the directive properties and events only while one of their branches is selected.
   */
  conditionalBindings: ConditionalBindingNode[];
}>
