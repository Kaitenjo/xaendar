import type { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import type { ConditionalBindingCloseToken } from '../../../lexer/types/tokens/conditional-binding-close-token.type';
import type { ConditionalBindingToken } from '../../../lexer/types/tokens/conditional-binding-token.type';
import type { DirectiveToken } from '../../../lexer/types/tokens/directive-token.type';
import type { EventToken } from '../../../lexer/types/tokens/event-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { ConditionalBindingNode } from '../../types/nodes/conditional-binding-node.type';
import type { DirectiveNode } from '../../types/nodes/directive-node.type';
import type { EventNode } from '../../types/nodes/event-node.type';
import { validateExpression } from '../../utils/expression-validator/expression-validator';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';
import { parseDirective } from '../parse-directive/parse-directive.state';
import { parseEvent } from '../parse-event/parse-event.state';

/**
 * Parses a CONDITIONAL_BINDING token and the attributes, events, nested conditional bindings and directives
 * declared in its body, up to the CONDITIONAL_BINDING_CLOSE token, into a `ConditionalBindingNode`.
 *
 * @param cursor - Parser cursor positioned at the CONDITIONAL_BINDING token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The CONDITIONAL_BINDING token containing the condition.
 * @returns The parsed `ConditionalBindingNode`.
 * @throws If the condition is not a valid expression, or an unexpected token is found in the conditional binding body.
 */
export function parseConditionalBinding(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: ConditionalBindingToken): ConditionalBindingNode {
  const startOffset = token.span.start;
  cursor.advance();

  const attributes = new Array<AttributeNode>();
  const events = new Array<EventNode>();
  const conditionalBindings = new Array<ConditionalBindingNode>();
  const directives = new Array<DirectiveNode>();
  const condition = validateExpression(token.parts[0]);

  let read = true;

  while (read) {
    const token = cursor.peek<AttributeToken | EventToken | ConditionalBindingToken | DirectiveToken | ConditionalBindingCloseToken>();
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

      case TokenType.DIRECTIVE:
        directives.push(parseDirective(cursor, parseNode, token));
        break;

      case TokenType.CONDITIONAL_BINDING_CLOSE:
        cursor.advance();
        read = false;
        break;

      default:
        throw new Error('Unexpected token in conditional binding');
    }
  }

  return {
    type: ASTNodeType.ConditionalBinding,
    condition: condition.node,
    attributes,
    events,
    conditionalBindings,
    directives,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end,
    }
  };
}