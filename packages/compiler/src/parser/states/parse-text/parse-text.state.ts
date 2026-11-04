import { NoArgsFunction } from '@xaendar/types';
import { decodeHTML } from 'entities';
import { TextToken } from '../../../lexer/types/tokens/text-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import type { MaybeASTNodeWithSpan } from '../../types/maybe-ast-node-with-span.type';
import { ASTNodeType } from '../../types/node.enum';
import { TextNode } from '../../types/nodes/text-node.type';

/**
 * Parses a TEXT token into a `TextNode`, decoding its character references as in HTML (`&lt;` holds `<`).
 *
 * @param cursor - Parser cursor; advanced past the TEXT token.
 * @param _parseNode - Unused parser function (kept for signature consistency).
 * @param token - The TEXT token containing the raw text content.
 * @returns The parsed `TextNode`.
 */
export function parseText(cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, token: TextToken): MaybeASTNodeWithSpan<TextNode> {
  cursor.advance();

  return {
    type: ASTNodeType.Text,
    value: decodeHTML(token.parts[0])
  };
}
