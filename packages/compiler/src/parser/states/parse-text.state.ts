import { ASTNodeType } from '../models/node.enum.js';
import { ParserContext } from '../models/parser-context.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { TextToken } from '../../lexer/models/tokens/text-token.type.js';
import { TextNode } from '../models/nodes/text-node.type.js';

/**
 * Parses a TEXT token into a `TextNode`.
 *
 * @param cursor Parser cursor; advanced past the TEXT token.
 * @param _context Unused parser context.
 * @param token The TEXT token containing the raw text content.
 * @returns The parsed `TextNode`.
 */
export function parseText(cursor: ParserCursor, _context: ParserContext, token: TextToken): TextNode {
  cursor.advance();
  return {
    type: ASTNodeType.Text,
    value: token.parts[0]
  };
}
