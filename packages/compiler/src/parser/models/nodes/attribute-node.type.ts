import { InterpolationNode } from './interpolation-node.type.js';

/**
 * AST node representing an HTML attribute on an element.
 */
export type AttributeNode = {
  /**
   * The attribute name.
   */
  name: string;
  /**
   * The attribute value, either a plain string or an interpolation node.
   */
  value: string | InterpolationNode;
}
