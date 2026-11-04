import type { Span } from '../../../types/span.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import type { ASTNodeType } from '../node.enum';
import type { InterpolationNode } from './interpolation-node.type';

/**
 * AST node representing a class toggled on an HTML element, `[class.name]="{expression}"`: the element has the class
 * while the value of the expression is truthy.
 */
export type ClassBindingNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a class binding.
   */
  type: ASTNodeType.ClassBinding;
  /**
   * The name of the class, e.g. `active` in `[class.active]`.
   */
  className: string;
  /**
   * Span of the name of the binding, e.g. `[class.active]`.
   */
  nameSpan: Span;
  /**
   * The interpolation whose value toggles the class.
   */
  value: InterpolationNode;
}>
