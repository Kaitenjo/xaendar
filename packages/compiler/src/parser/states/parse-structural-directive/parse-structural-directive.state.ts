import type { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import type { DirectiveCloseToken } from '../../../lexer/types/tokens/directive-close-token.type';
import type { StructuralDirectiveToken } from '../../../lexer/types/tokens/structural-directive-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { StructuralDirectiveNode } from '../../types/nodes/structural-directive-node.type';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';

/**
 * Parses a STRUCTURAL_DIRECTIVE token and the attributes declared in its body, up to the DIRECTIVE_CLOSE token,
 * into a `StructuralDirectiveNode`.
 *
 * @param cursor - Parser cursor positioned at the STRUCTURAL_DIRECTIVE token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The STRUCTURAL_DIRECTIVE token containing the directive selector.
 * @returns The parsed `StructuralDirectiveNode`.
 * @throws If a token other than an attribute or the directive closure is found in the directive body.
 */
export function parseStructuralDirective(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: StructuralDirectiveToken): StructuralDirectiveNode {
  const startOffset = token.span.start;
  cursor.advance();

  const attributes = new Array<AttributeNode>();
  let read = true;

  while (read) {
    const token = cursor.peek<AttributeToken | DirectiveCloseToken>();
    switch (token.type) {
      case TokenType.ATTRIBUTE:
        attributes.push(parseAttribute(cursor, parseNode, token));
        break;

      case TokenType.DIRECTIVE_CLOSE:
        cursor.advance();
        read = false;
        break;

      default:
        throw new Error('Unexpected token in structural directive');
    }
  }

  return {
    type: ASTNodeType.StructuralDirective,
    selector: token.parts[0],
    attributes,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end,
    }
  };
}
