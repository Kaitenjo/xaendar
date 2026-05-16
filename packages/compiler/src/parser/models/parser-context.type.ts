import { ASTNode } from './ast.type.js';

/**
 * Context object passed between parser state functions to support recursive parsing.
 */
export type ParserContext = {
  /**
   * Parses the next AST node from the current cursor position.
   */
  parseNode: () => ASTNode;
}
