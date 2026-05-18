import { TokenType } from '../../lexer/models/token-type.enum.js';
import { AttributeToken } from '../../lexer/models/tokens/attribute-token.type.js';
import { ParserContext } from '../models/parser-context.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { AttributeNode } from '../models/nodes/attribute-node.type.js';
import { parseInterpolation } from './parse-interpolation.state.js';

/**
 * Parses an ATTRIBUTE token into an `AttributeNode`.
 * Handles boolean attributes (no `=`), string values, and interpolation values.
 *
 * @param cursor Parser cursor; advanced past the ATTRIBUTE token.
 * @param context Parser context for recursive parsing.
 * @param token The ATTRIBUTE token to parse.
 * @returns The parsed `AttributeNode`.
 */
export function parseAttribute(cursor: ParserCursor, context: ParserContext, token: AttributeToken): AttributeNode {
  cursor.advance();
  const raw = token.parts[0];

  if (!raw.includes('=')) {
    return { name: raw, value: 'true' };
  }

  const [name, value] = raw.split('=');
  if (!name) {
    throw new Error(`[Parser] Attribute name missing in: ${raw}`);
  }

  const nextToken = cursor.peek();
  if (nextToken.type === TokenType.INTERPOLATION_EXPRESSION || nextToken.type === TokenType.INTERPOLATION_LITERAL) {
    return {
      name,
      value: parseInterpolation(cursor, context, nextToken)
    };
  }

  if (!value) {
    throw new Error(`[Parser] Attribute value missing for ${name} in: ${raw}`);
  }

  return {
    name,
    value: value.replace(/^['']|['']$/g, '')
  };
}
