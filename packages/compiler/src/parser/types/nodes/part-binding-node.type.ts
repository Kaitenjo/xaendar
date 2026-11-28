import type { Span } from '../../../types/span.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import type { ASTNodeType } from '../node.enum';
import type { InterpolationNode } from './interpolation-node.type';

/**
 * AST node representing a part exposed by an element, `part.name="{expression}"`: the element has the part, which
 * `::part(name)` styles from outside the shadow root, while the value of the expression is truthy.
 */
export type PartBindingNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a part binding.
   */
  type: ASTNodeType.PartBinding;
  /**
   * The name of the part, e.g. `selected` in `part.selected`.
   */
  partName: string;
  /**
   * Span of the name of the binding, e.g. `part.selected`.
   */
  nameSpan: Span;
  /**
   * The interpolation whose value toggles the part.
   */
  value: InterpolationNode;
}>
