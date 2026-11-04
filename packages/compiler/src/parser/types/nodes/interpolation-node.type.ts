import { Expression } from 'typescript';
import { ASTNodeType } from '../node.enum';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';

/**
 * AST node representing an inline interpolation binding `{ expression }` or `` {`literal`} ``.
 */
export type InterpolationNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as an interpolation.
   */
  type: ASTNodeType.Interpolation
  /**
   * The interpolated JavaScript expression string.
   */
  expression: Expression;
}>
