import { TokenType } from '../../lexer/models/token-type.enum.js';
import { ASTNode } from '../models/ast.type.js';
import { ParserContext } from '../models/parser-context.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';

/**
 * Parses child AST nodes inside a flow-control block until a BLOCK_CLOSE token is reached.
 * Consumes the BLOCK_CLOSE token before returning.
 *
 * @param cursor Parser cursor positioned at the first token inside the block.
 * @param context Parser context for recursive child parsing.
 * @returns Array of parsed child `ASTNode`s.
 */
export function parseBlockChildren(cursor: ParserCursor, context: ParserContext): ASTNode[] {
  const children = new Array<ASTNode>;

  while (cursor.peek().type !== TokenType.BLOCK_CLOSE) {
    children.push(context.parseNode());
  }

  cursor.advance(); // consume BLOCK_CLOSE
  return children;
}
