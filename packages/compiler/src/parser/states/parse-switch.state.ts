import { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../lexer/types/token-type.enum.js';
import { Token } from '../../lexer/types/token.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { ASTNode } from '../types/ast.type.js';
import { ASTNodeType } from '../types/node.enum.js';
import { CaseNode } from '../types/nodes/case-node.type.js';
import { SwitchNode } from '../types/nodes/switch-node.type.js';
import { parseBlockChildren } from './parse-block-children.state.js';

/**
 * Parses a `@switch` directive, consuming the SWITCH token, the CONDITION token,
 * the outer BLOCK_OPEN, all `@case` and `@default` branches, and the outer BLOCK_CLOSE.
 *
 * @param cursor Parser cursor positioned at the SWITCH token.
 * @param parseNode Parser function for recursive child parsing.
 * @param _token The SWITCH token (unused; consumed for position advancement).
 * @returns The parsed `SwitchNode`.
 */
export function parseSwitchControlFlow(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode>, _token: Token): SwitchNode {
  // consume SWITCH
  cursor.advance();

  const conditionToken = cursor.peek();
  if (conditionToken.type !== TokenType.CONDITION) {
    throw new Error(`[Parser] Expected CONDITION after SWITCH, got ${TokenType[conditionToken.type]}`);
  }

  const expression = conditionToken.parts[0];
  // consume CONDITION and BLOCK_OPEN
  cursor.advance(2);

  const cases = new Array<CaseNode>;

  while (cursor.peek().type !== TokenType.BLOCK_CLOSE) {
    const token = cursor.peek();

    if (token.type === TokenType.CASE) {
      cursor.advance();
      const caseCondition = cursor.peek();
      if (caseCondition.type !== TokenType.CONDITION) {
        throw new Error(`[Parser] Expected CONDITION after CASE`);
      }
      const caseExpr = caseCondition.parts[0];
      // consume CONDITION and BLOCK_OPEN
      cursor.advance(2);
      cases.push({ type: ASTNodeType.Case, condition: caseExpr, children: parseBlockChildren(cursor, parseNode) });
    } else if (token.type === TokenType.DEFAULT) {
      // consume DEFAULT and BLOCK_OPEN
      cursor.advance(2);
      cases.push({ type: ASTNodeType.Case, condition: null, children: parseBlockChildren(cursor, parseNode) });
    } else {
      break;
    }
  }

  // consume outer BLOCK_CLOSE
  cursor.advance();

  return { 
    type: ASTNodeType.Switch, 
    expression, 
    cases 
  };
}
