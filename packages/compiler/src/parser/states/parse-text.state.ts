import { NoArgsFunction } from '@xaendar/types';
import { TextToken } from '../../lexer/types/tokens/text-token.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { ASTNode } from '../types/ast.type.js';
import { ASTNodeType } from '../types/node.enum.js';
import { TextNode } from '../types/nodes/text-node.type.js';

/**
 * Parses a TEXT token into a `TextNode`.
 *
 * @param cursor Parser cursor; advanced past the TEXT token.
 * @param _parseNode Function to parse the next AST node.
 * @param token The TEXT token containing the raw text content.
 * @returns The parsed `TextNode`.
 */
export function parseText(cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode>, token: TextToken): TextNode {
  cursor.advance();

  return {
    type: ASTNodeType.Text,
    value: token.parts[0]
  };
}
