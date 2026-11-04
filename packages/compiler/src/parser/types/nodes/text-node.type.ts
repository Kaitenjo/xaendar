import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';

/**
 * AST node representing a run of plain text content.
 */
export type TextNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as plain text.
   */
  type: ASTNodeType.Text
  /**
   * The text content string.
   */
  value: string;
}>
