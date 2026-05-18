import { ASTNodeType } from '../node.enum.js';
import { ASTNode } from '../ast.type.js';
import { AttributeNode } from './attribute-node.type.js';
import { EventNode } from './event-node.type.js';

/**
 * AST node representing an HTML element with a tag name, attributes, events, and children.
 */
export type ElementNode = {
  /**
   * Discriminant identifying this node as an element.
   */
  type: ASTNodeType.Element
  /**
   * The HTML tag name of the element.
   */
  tagName: string;
  /**
   * Attribute nodes bound to this element.
   */
  attributes: AttributeNode[];
  /**
   * Event binding nodes attached to this element.
   */
  events: EventNode[];
  /**
   * Child AST nodes nested inside this element.
   */
  children: ASTNode[];
}
