import type { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import type { ConditionalBindingToken } from '../../../lexer/types/tokens/conditional-binding-token.type';
import type { DirectiveCloseToken } from '../../../lexer/types/tokens/directive-close-token.type';
import type { DirectiveToken } from '../../../lexer/types/tokens/directive-token.type';
import type { EventToken } from '../../../lexer/types/tokens/event-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { ConditionalBindingNode } from '../../types/nodes/conditional-binding-node.type';
import type { DirectiveNode } from '../../types/nodes/directive-node.type';
import type { EventNode } from '../../types/nodes/event-node.type';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';
import { parseConditionalBinding } from '../parse-conditional-binding/parse-conditional-binding.state';
import { parseEvent } from '../parse-event/parse-event.state';

/**
 * Parses a DIRECTIVE token and the attributes, events and conditional bindings declared in its body,
 * up to the DIRECTIVE_CLOSE token, into a `DirectiveNode`.
 *
 * @param cursor - Parser cursor positioned at the DIRECTIVE token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The DIRECTIVE token containing the directive selector.
 * @returns The parsed `DirectiveNode`.
 * @throws If a token other than an attribute, an event, a conditional binding or the directive closure is found in the directive body.
 */
export function parseDirective(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: DirectiveToken): DirectiveNode {
  const startOffset = token.span.start;
  cursor.advance();

  const attributes = new Array<AttributeNode>();
  const events = new Array<EventNode>();
  const conditionalBindings = new Array<ConditionalBindingNode>();
  let read = true;

  while (read) {
    const token = cursor.peek<AttributeToken | EventToken | ConditionalBindingToken | DirectiveCloseToken>();
    switch (token.type) {
      case TokenType.ATTRIBUTE:
        attributes.push(parseAttribute(cursor, parseNode, token));
        break;

      case TokenType.EVENT:
        events.push(parseEvent(cursor, parseNode, token));
        break;

      case TokenType.CONDITIONAL_BINDING:
        conditionalBindings.push(parseConditionalBinding(cursor, parseNode, token));
        break;

      case TokenType.DIRECTIVE_CLOSE:
        cursor.advance();
        read = false;
        break;

      default:
        throw new Error('Unexpected token in directive');
    }
  }

  return {
    type: ASTNodeType.Directive,
    selector: token.parts[0],
    attributes,
    events,
    conditionalBindings,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end,
    }
  };
}
