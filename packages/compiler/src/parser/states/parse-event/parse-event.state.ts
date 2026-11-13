import { parseKeyEvent, type KeyEventFilter } from '@xaendar/common';
import { NoArgsFunction } from '@xaendar/types';
import { Expression } from 'typescript';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { EventHandlerToken } from '../../../lexer/types/tokens/event-handler-token.type';
import { EventParAmeterToken } from '../../../lexer/types/tokens/event-parameter-token.type';
import { EventToken } from '../../../lexer/types/tokens/event-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { CastNode } from '../../types/nodes/cast-node.type';
import { EventNode } from '../../types/nodes/event-node.type';
import { validateExpression } from '../../utils/expression-validator/expression-validator';
import { parseCast } from '../parse-cast/parse-cast.state';

/**
 * Parses EVENT + EVENT_HANDLER tokens, the EVENT_PARAMETER tokens following them and the CAST token closing each
 * parameter, if any, into an `EventNode`. The name of a key event (`keydown.enter`) gives the key the listener is filtered
 * by (see `parseKeyEvent` of `@xaendar/common`).
 *
 * @param cursor - Parser cursor; advanced past the EVENT token.
 * @param _parseNode - Unused parser function (kept for signature consistency).
 * @param token - The EVENT token to parse.
 * @returns The parsed `EventNode`.
 * @throws If the handler is missing, or the name is a key event naming no key or a modifier that does not exist.
 */
export function parseEvent(cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, token: EventToken): EventNode {
  const startOffset = token.span.start;
  cursor.advance();
  const name = token.parts[0];
  const nameSpan = cursor.findSpan(name, startOffset);
  let key: KeyEventFilter | undefined;
  try {
    key = parseKeyEvent(name);
  } catch (error) {
    // Reported on the name of the event
    throw Object.assign(error as Error, { cause: nameSpan });
  }

  const handlerToken = cursor.peek<EventHandlerToken>();

  if (handlerToken.type !== TokenType.EVENT_HANDLER) {
    throw `Invalid event format for ${name}`;
  }

  cursor.advance();

  let endOffset = cursor.getCurrentToken().value.span.end;

  const parameters = new Array<Expression>
  let casts: Map<number, CastNode> | undefined;
  while (cursor.peek().type === TokenType.EVENT_PARAMETER) {
    cursor.advance();
    const { parts: [parameter], span } = cursor.getCurrentToken<EventParAmeterToken>().value;
    parameters.push(validateExpression(parameter, cursor.findSpan(parameter, span.start).start).node);
    const cast = parseCast(cursor);
    if (cast) {
      casts ??= new Map();
      casts.set(parameters.length - 1, cast);
    }

    endOffset = cursor.getCurrentToken().value.span.end;
  }

  const node: EventNode = {
    type: ASTNodeType.Event,
    name,
    nameSpan,
    handler: handlerToken.parts[0],
    handlerSpan: cursor.findSpan(handlerToken.parts[0], handlerToken.span.start),
    parameters,
    span: {
      start: startOffset,
      end: endOffset,
    },
  };

  if (casts?.size) {
    node.casts = casts;
  }

  if (key) {
    node.key = key;
  }

  return node;
}
