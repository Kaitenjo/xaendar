import { EventToken } from '../../lexer/models/tokens/event-token.type.js';
import { ParserContext } from '../models/parser-context.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { EventNode } from '../models/nodes/event-node.type.js';

/**
 * Parses an EVENT token into an `EventNode` by splitting the raw
 * `eventName=handler` string.
 *
 * @param cursor Parser cursor; advanced past the EVENT token.
 * @param _context Unused parser context.
 * @param token The EVENT token to parse.
 * @returns The parsed `EventNode`.
 */
export function parseEvent(cursor: ParserCursor, _context: ParserContext, token: EventToken): EventNode {
  cursor.advance();
  const raw = token.parts[0];
  const [name, value] = raw.split('=');

  if (!name || !value) {
    throw new Error(`[Parser] Invalid event format: ${raw}`);
  }

  return {
    name,
    handler: value.replace(/^[""]|[""]$/g, '')
  };
}
