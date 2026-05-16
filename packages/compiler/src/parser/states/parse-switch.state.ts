import { TokenType } from '../../lexer/models/token-type.enum.js';
import { Token } from '../../lexer/models/token.type.js';
import { ConditionToken } from '../../lexer/models/tokens/condition-token.type.js';
import { ASTNodeType } from '../models/node.enum.js';
import { ParserContext } from '../models/parser-context.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { CaseNode } from '../models/nodes/case-node.type.js';
import { SwitchNode } from '../models/nodes/switch-node.type.js';
import { parseBlockChildren } from './parse-block-children.state.js';

/**
 * Parses a `@switch` directive, consuming the SWITCH token, the CONDITION token,
 * the outer BLOCK_OPEN, all `@case` and `@default` branches, and the outer BLOCK_CLOSE.
 *
 * @param cursor Parser cursor positioned at the SWITCH token.
 * @param context Parser context for recursive child parsing.
 * @param _token The SWITCH token (unused; consumed for position advancement).
 * @returns The parsed `SwitchNode`.
 */
export function parseSwitchControlFlow(cursor: ParserCursor, context: ParserContext, _token: Token): SwitchNode {
  cursor.advance(); // consume SWITCH

  const conditionToken = cursor.peek();
  if (conditionToken.type !== TokenType.CONDITION) {
    throw new Error(`[Parser] Expected CONDITION after SWITCH, got ${TokenType[conditionToken.type]}`);
  }
  const expression = (conditionToken as ConditionToken).parts[0];
  cursor.advance(); // consume CONDITION
  cursor.advance(); // consume BLOCK_OPEN

  const cases: CaseNode[] = [];

  while (cursor.peek().type !== TokenType.BLOCK_CLOSE) {
    const t = cursor.peek();

    if (t.type === TokenType.CASE) {
      cursor.advance(); // consume CASE
      const caseCondition = cursor.peek();
      if (caseCondition.type !== TokenType.CONDITION) {
        throw new Error(`[Parser] Expected CONDITION after CASE`);
      }
      const caseExpr = (caseCondition as ConditionToken).parts[0];
      cursor.advance(); // consume CONDITION
      cursor.advance(); // consume BLOCK_OPEN
      cases.push({ type: ASTNodeType.Case, condition: caseExpr, children: parseBlockChildren(cursor, context) });
    } else if (t.type === TokenType.DEFAULT) {
      cursor.advance(); // consume DEFAULT
      cursor.advance(); // consume BLOCK_OPEN
      cases.push({ type: ASTNodeType.Case, condition: null, children: parseBlockChildren(cursor, context) });
    } else {
      break;
    }
  }

  cursor.advance(); // consume outer BLOCK_CLOSE

  return { type: ASTNodeType.Switch, expression, cases };
}
