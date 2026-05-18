import { TokenType } from '../../lexer/models/token-type.enum.js';
import { TagOpenNameToken } from '../../lexer/models/tokens/tag-open-name-token.type.js';
import { ASTNodeType } from '../models/node.enum.js';
import { ASTNode } from '../models/ast.type.js';
import { ParserContext } from '../models/parser-context.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { AttributeNode } from '../models/nodes/attribute-node.type.js';
import { ElementNode } from '../models/nodes/element-node.type.js';
import { EventNode } from '../models/nodes/event-node.type.js';
import { parseAttribute } from './parse-attribute.state.js';
import { parseEvent } from './parse-event.state.js';

/**
 * Parses a TAG_OPEN_NAME token and the subsequent attributes, events, and children
 * into an `ElementNode`. Handles both regular and self-closing tags.
 *
 * @param cursor Parser cursor positioned at the TAG_OPEN_NAME token.
 * @param context Parser context for recursive child parsing.
 * @param token The TAG_OPEN_NAME token containing the tag name.
 * @returns The parsed `ElementNode`.
 */
export function parseElement(cursor: ParserCursor, context: ParserContext, token: TagOpenNameToken): ElementNode {
  cursor.advance();
  const tagName = token.parts[0];

  const attributes = new Array<AttributeNode>();
  const events = new Array<EventNode>();

  let read = true;
  while (read) {
    const t = cursor.peek();
    switch (t.type) {
      case TokenType.ATTRIBUTE:
        attributes.push(parseAttribute(cursor, context, t));
        break;

      case TokenType.EVENT:
        events.push(parseEvent(cursor, context, t));
        break;

      default:
        read = false;
    }
  }

  // Consume TAG_OPEN_END if present: <div>
  if (cursor.peek().type === TokenType.TAG_OPEN_END) {
    cursor.advance();
  }

  // Handle self-closing tags: <div />
  if (cursor.peek().type === TokenType.TAG_SELF_CLOSE) {
    cursor.advance();
    return {
      type: ASTNodeType.Element,
      tagName,
      attributes,
      events,
      children: []
    };
  }

  // Parse children recursively until closing tag
  const children: ASTNode[] = [];
  while (!isTagClose(cursor, tagName)) {
    children.push(context.parseNode());
  }

  // Consume closing tag </div>
  cursor.advance();

  return {
    type: ASTNodeType.Element,
    tagName,
    attributes,
    events,
    children
  };
}

/**
 * Returns `true` if the next token in the stream is a closing tag for the given tag name.
 *
 * @param cursor Parser cursor to peek from.
 * @param tagName The expected tag name to match.
 * @returns `true` if the next token is TAG_CLOSE_NAME matching `tagName`.
 */
function isTagClose(cursor: ParserCursor, tagName: string): boolean {
  const nextToken = cursor.peek();
  return nextToken.type === TokenType.TAG_CLOSE_NAME && nextToken.parts[0] === tagName;
}
