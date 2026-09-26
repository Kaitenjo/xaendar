import type { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import type { DynamicBindingCloseToken } from '../../../lexer/types/tokens/dynamic-binding-close-token.type';
import type { DynamicBindingToken } from '../../../lexer/types/tokens/dynamic-binding-token.type';
import type { EventToken } from '../../../lexer/types/tokens/event-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { DynamicBindingNode } from '../../types/nodes/dynamic-binding-node.type';
import type { EventNode } from '../../types/nodes/event-node.type';
import { validateExpression } from '../../utils/expression-validator/expression-validator';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';
import { parseEvent } from '../parse-event/parse-event.state';

export function parseDynamicBinding(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: DynamicBindingToken): DynamicBindingNode {
  const startOffset = token.span.start;
  cursor.advance();

  const attributes = new Array<AttributeNode>();
  const events = new Array<EventNode>();
  const dynamicBindings = new Array<DynamicBindingNode>();
  const condition = validateExpression(token.parts[0]);

  let read = true;

  while (read) {
    const token = cursor.peek<AttributeToken | EventToken | DynamicBindingToken | DynamicBindingCloseToken>();
    switch (token.type) {
      case TokenType.ATTRIBUTE:
        attributes.push(parseAttribute(cursor, parseNode, token));
        break;

      case TokenType.EVENT:
        events.push(parseEvent(cursor, parseNode, token));
        break;

      case TokenType.DYNAMIC_BINDING:
        dynamicBindings.push(parseDynamicBinding(cursor, parseNode, token));
        break;

      case TokenType.DYNAMIC_BINDING_CLOSE:
        cursor.advance();
        read = false;
        break;

      default:
        throw new Error('Unexpected token in dynamic binding');
    }
  }

  return {
    type: ASTNodeType.DynamicBinding,
    condition: condition.node,
    attributes,
    events,
    dynamicBindings,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end,
    }
  };
}