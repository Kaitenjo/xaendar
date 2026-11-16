import { NoArgsFunction } from '@xaendar/types';
import { decodeHTMLAttribute } from 'entities';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import { AttributeValueToken } from '../../../lexer/types/tokens/attribute-value-token.type';
import { BlockCloseToken } from '../../../lexer/types/tokens/block-close-token.type';
import { CaseToken } from '../../../lexer/types/tokens/case-token.type';
import { DefaultToken } from '../../../lexer/types/tokens/default-token.type';
import { DirectiveCloseToken } from '../../../lexer/types/tokens/directive-close-token.type';
import { DirectiveToken } from '../../../lexer/types/tokens/directive-token.type';
import { ElseIfToken } from '../../../lexer/types/tokens/else-if-token.type';
import { ElseToken } from '../../../lexer/types/tokens/else-token.type';
import { EventToken } from '../../../lexer/types/tokens/event-token.type';
import { IfToken } from '../../../lexer/types/tokens/if-token.type';
import { InterpolationExpressionToken } from '../../../lexer/types/tokens/interpolation-expression-token.type';
import { StructuralDirectiveToken } from '../../../lexer/types/tokens/structural-directive-token.type';
import { SwitchToken } from '../../../lexer/types/tokens/switch-token.type';
import { TagCloseNameToken } from '../../../lexer/types/tokens/tag-close-name-token.type';
import { TagCloseToken } from '../../../lexer/types/tokens/tag-close-token.type';
import { TagSelfCloseToken } from '../../../lexer/types/tokens/tag-self-close-token.type';
import type { ElementRefToken } from '../../../lexer/types/tokens/element-ref-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import { AttributeNode } from '../../types/nodes/attribute-node.type';
import { parseInterpolation } from '../parse-interpolation/parse-interpolation.state';

/**
 * The prefix of an attribute always written as the attribute of the element, never as an input (`attr.title`).
 */
const ATTRIBUTE_PREFIX = 'attr.';

/**
 * Parses an ATTRIBUTE token into an `AttributeNode`.
 * Handles boolean attributes (no `=`), string values, and interpolation values. An attribute written with `attr.`
 * (`attr.title="Close"`) keeps its name as written and gets the name of the attribute it writes (`attribute`), which no
 * input of a component takes.
 *
 * @param cursor - Parser cursor; advanced past the ATTRIBUTE token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The ATTRIBUTE token to parse.
 * @returns The parsed `AttributeNode`.
 * @throws If the attribute is followed by a token that is neither a value nor another binding or the end of the tag, or
 *   its name is in brackets without being a two-way binding, or `attr.` names no attribute, or `class` or `style`.
 */
export function parseAttribute(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: AttributeToken): AttributeNode {
  const node = readAttribute(cursor, parseNode, token);
  const { name, nameSpan } = node;
  // Brackets declare only a two-way binding, `[(value)]`
  if (name.startsWith('[') && !name.startsWith('[(')) {
    const unbracketed = name.slice(1, name.endsWith(']') ? -1 : undefined);
    throw new Error(`"${name}" is not a binding: brackets declare only a two-way binding, [(name)]="signal": write ${unbracketed}="{ expression }"`, { cause: nameSpan });
  }

  if (!name.startsWith(ATTRIBUTE_PREFIX)) {
    return node;
  }

  const attribute = name.slice(ATTRIBUTE_PREFIX.length);
  switch (attribute) {
    case '':
      throw new Error(`${name} names no attribute: write attr. followed by the name of the attribute, e.g. attr.title="…"`, { cause: nameSpan });

    case 'class':
    case 'style':
      throw new Error(`${name} cannot be written: ${attribute} is merged with the directives and the component writing it, bound with ${attribute}="…" and ${attribute}.name="{ expression }"`, { cause: nameSpan });
  }

  node.attribute = attribute;
  return node;
}

/**
 * Reads an ATTRIBUTE token and its value, if any, into an `AttributeNode` (see {@link parseAttribute}).
 *
 * @param cursor - Parser cursor; advanced past the ATTRIBUTE token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The ATTRIBUTE token to parse.
 * @returns The parsed `AttributeNode`.
 * @throws If the attribute is followed by a token that is neither a value nor another binding or the end of the tag.
 */
function readAttribute(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: AttributeToken): AttributeNode {
  const startOffset = token.span.start;

  // consume Attribute token
  cursor.advance();
  const name = token.parts[0];
  const nameSpan = cursor.findSpan(name, startOffset);
  
  // All possible tokens after an Attribute Token
  const nextToken = cursor.peek<
    | AttributeValueToken 
    | AttributeToken 
    | EventToken 
    | TagCloseNameToken 
    | InterpolationExpressionToken 
    | TagCloseToken
    | TagSelfCloseToken
    | IfToken
    | ElseIfToken
    | ElseToken
    | SwitchToken
    | CaseToken
    | DefaultToken
    | BlockCloseToken
    | DirectiveToken
    | StructuralDirectiveToken
    | DirectiveCloseToken
    | ElementRefToken
  >();

  if (isBooleanAttributeSuccessor(nextToken.type)) {
    return {
      type: ASTNodeType.Attribute,
      name,
      nameSpan,
      value: 'true',
      bare: true,
      span: {
        start: startOffset,
        end: cursor.getCurrentToken().value.span.end,
      },
    };
  }

  if (nextToken.type === TokenType.INTERPOLATION_EXPRESSION) {
    const interpolation = parseInterpolation(cursor, parseNode, nextToken);
    return {
      type: ASTNodeType.Attribute,
      name,
      nameSpan,
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
    nameSpan,
    // Character references are decoded as in HTML: `title="a &amp; b"` holds `a & b`
    value: decodeHTMLAttribute(nextToken.parts[0]),
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end,
    },
  };
}

/**
 * Tells whether the token following an attribute makes it a boolean attribute (declared without value),
 * i.e. it is another binding, a flow-control keyword or the end of a block of a conditional binding,
 * the start of a directive or of a structural directive, the end of a directive, an element ref, or the end of the tag.
 *
 * A flow-control keyword makes the attribute a boolean one even when it is misplaced,
 * so that it is reported by the state parsing the construct the attribute is declared in.
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
    case TokenType.IF:
    case TokenType.ELSE_IF:
    case TokenType.ELSE:
    case TokenType.SWITCH:
    case TokenType.CASE:
    case TokenType.DEFAULT:
    case TokenType.BLOCK_CLOSE:
    case TokenType.DIRECTIVE:
    case TokenType.STRUCTURAL_DIRECTIVE:
    case TokenType.DIRECTIVE_CLOSE:
    case TokenType.ELEMENT_REF:
      return true;

    default:
      return false;
  }
}
