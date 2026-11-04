import type { Span } from '../../types/span.type';
import type { ASTNodeType } from './node.enum';

/**
 * An AST node with its span.
 *
 * @template T - The AST node.
 */
export type ASTNodeWithSpan<T extends { type: ASTNodeType }> = T & {
  /**
   * Where the node is in the template.
   */
  span: Span
}
