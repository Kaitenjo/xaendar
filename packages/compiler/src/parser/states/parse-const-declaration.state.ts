import { ConstDeclarationToken } from '../../lexer/models/tokens/const-declaration-token.type.js';
import { ASTNodeType } from '../models/node.enum.js';
import { ParserContext } from '../models/parser-context.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { ConstDeclarationNode } from '../models/nodes/const-declaration-node.type.js';

/**
 * Parses a CONST_DECLARATION token into a `ConstDeclarationNode`.
 *
 * @param cursor Parser cursor; advanced past the CONST_DECLARATION token.
 * @param _context Unused parser context.
 * @param token The CONST_DECLARATION token containing variable name and expression.
 * @returns The parsed `ConstDeclarationNode`.
 */
export function parseConstDeclaration(cursor: ParserCursor, _context: ParserContext, token: ConstDeclarationToken): ConstDeclarationNode {
  cursor.advance();

  return {
    type: ASTNodeType.ConstDeclaration,
    varName: token.parts[0],
    expression: token.parts[1]
  };
}
