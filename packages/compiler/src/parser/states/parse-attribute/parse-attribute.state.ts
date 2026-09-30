import { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import { AttributeValueToken } from '../../../lexer/types/tokens/attribute-value-token.type';
import { ConditionalBindingCloseToken } from '../../../lexer/types/tokens/conditional-binding-close-token.type';
import { ConditionalBindingToken } from '../../../lexer/types/tokens/conditional-binding-token.type';
import { DirectiveCloseToken } from '../../../lexer/types/tokens/directive-close-token.type';
import { DirectiveToken } from '../../../lexer/types/tokens/directive-token.type';
import { EventToken } from '../../../lexer/types/tokens/event-token.type';
import { InterpolationExpressionToken } from '../../../lexer/types/tokens/interpolation-expression-token.type';
import { InterpolationLiteralToken } from '../../../lexer/types/tokens/interpolation-literal-token.type';
import { TagCloseNameToken } from '../../../lexer/types/tokens/tag-close-name-token.type';
import { TagCloseToken } from '../../../lexer/types/tokens/tag-close-token.type';
import { TagSelfCloseToken } from '../../../lexer/types/tokens/tag-self-close-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import { AttributeNode } from '../../types/nodes/attribute-node.type';
import { parseInterpolation } from '../parse-interpolation/parse-interpolation.state';

/**
 * Parses an ATTRIBUTE token into an `AttributeNode`.
 * Handles boolean attributes (no `=`), string values, and interpolation values.
 *
 * @param cursor - Parser cursor; advanced past the ATTRIBUTE token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The ATTRIBUTE token to parse.
 * @returns The parsed `AttributeNode`.
 * @throws If the attribute is followed by a token that is neither a value nor another binding or the end of the tag.
 */
export function parseAttribute(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: AttributeToken): AttributeNode {
  const startOffset = token.span.start;

  // consume Attribute token
  cursor.advance();
  const name = token.parts[0];
  
  // All possible tokens after an Attribute Token
  const nextToken = cursor.peek<
    | AttributeValueToken 
    | AttributeToken 
    | EventToken 
    | TagCloseNameToken 
    | InterpolationExpressionToken 
    | InterpolationLiteralToken
    | TagCloseToken
    | TagSelfCloseToken
    | ConditionalBindingToken
    | ConditionalBindingCloseToken
    | DirectiveToken
    | DirectiveCloseToken
  >();

  if (isBooleanAttributeSuccessor(nextToken.type)) {
    return {
      type: ASTNodeType.Attribute,
      name,
      value: 'true',
      span: {
        start: startOffset,
        end: cursor.getCurrentToken().value.span.end,
      },
    };
  }

  if (nextToken.type === TokenType.INTERPOLATION_EXPRESSION || nextToken.type === TokenType.INTERPOLATION_LITERAL) {
    const interpolation = parseInterpolation(cursor, parseNode, nextToken);
    return {
      type: ASTNodeType.Attribute,
      name,
      value: interpolation,
      span: {
        start: startOffset,
        end: cursor.getCurrentToken().value.span.end,
      },
    };
  }

  if (nextToken.type !== TokenType.ATTRIBUTE_VALUE) {
    throw `Attribute value missing for ${name} in: ${name}`;
  }

  cursor.advance();

  return {
    type: ASTNodeType.Attribute,
    name,
    value: nextToken.parts[0],
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end,
    },
  };
}

/**
 * Tells whether the token following an attribute makes it a boolean attribute (declared without value),
 * i.e. it is another binding, the start or the end of a conditional binding or a directive, or the end of the tag.
 *
 * @param type - The type of the token following the attribute.
 * @returns `true` if the attribute has no value, `false` otherwise.
 */
function isBooleanAttributeSuccessor(type: TokenType): boolean {
  switch (type) {
    case TokenType.ATTRIBUTE:
    case TokenType.TAG_CLOSE_NAME:
    case TokenType.EVENT:
    case TokenType.TAG_OPEN_END:
    case TokenType.TAG_SELF_CLOSE:
    case TokenType.CONDITIONAL_BINDING:
    case TokenType.CONDITIONAL_BINDING_CLOSE:
    case TokenType.DIRECTIVE:
    case TokenType.DIRECTIVE_CLOSE:
      return true;

    default:
      return false;
  }
}
