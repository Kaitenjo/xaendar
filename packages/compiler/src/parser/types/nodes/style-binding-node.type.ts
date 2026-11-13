import type { Span } from '../../../types/span.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import type { ASTNodeType } from '../node.enum';
import type { InterpolationNode } from './interpolation-node.type';

/**
 * AST node representing a style property set on an HTML element, `[style.name]="{expression}"`: the element has the
 * property while the value of the expression is neither `null`, `undefined` nor `false`, followed by the unit of the
 * binding, if any (`[style.width.px]`). A custom property (`[style.--accent]`) is set as well.
 */
export type StyleBindingNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a style binding.
   */
  type: ASTNodeType.StyleBinding;
  /**
   * The name of the property, as CSS writes it: `background-color` in `[style.background-color]` and in
   * `[style.backgroundColor]`, `--accent` in `[style.--accent]`.
   */
  property: string;
  /**
   * The unit appended to the value, e.g. `px` in `[style.width.px]`, if any.
   */
  unit?: string;
  /**
   * Span of the name of the binding, e.g. `[style.width.px]`.
   */
  nameSpan: Span;
  /**
   * The interpolation whose value sets the property.
   */
  value: InterpolationNode;
}>
