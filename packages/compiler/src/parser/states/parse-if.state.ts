import { TokenType } from '../../lexer/models/token-type.enum.js';
import { IfToken } from '../../lexer/models/tokens/if-token.type.js';
import { ASTNodeType } from '../models/node.enum.js';
import { ParserContext } from '../models/parser-context.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { ElseNode } from '../models/nodes/else-node.type.js';
import { IfNode } from '../models/nodes/if-node.type.js';
import { parseBlockChildren } from './parse-block-children.state.js';

/**
 * Parses an `@if` directive, consuming the IF token, the CONDITION token,
 * the BLOCK_OPEN token, all consequent children, and an optional `@else` branch.
 *
 * @param cursor Parser cursor positioned at the IF token.
 * @param context Parser context for recursive child parsing.
 * @param _token The IF token (unused; consumed for position advancement).
 * @returns The parsed `IfNode`.
 */
export function parseIfControlFlow(cursor: ParserCursor, context: ParserContext, _token: IfToken): IfNode {
  cursor.advance();

  const conditionToken = cursor.peek();
  if (conditionToken.type !== TokenType.CONDITION) {
    throw new Error(`[Parser] Expected CONDITION after IF, got ${TokenType[conditionToken.type]}`);
  }

  const condition = conditionToken.parts[0];
  cursor.advance();
  cursor.advance();

  const consequent = parseBlockChildren(cursor, context);

  let alternate: ElseNode | null = null;
  const next = cursor.peek();

  if (next.type === TokenType.ELSE) {
    cursor.advance();
    cursor.advance();
    const elseChildren = parseBlockChildren(cursor, context);
    alternate = { type: ASTNodeType.Else, children: elseChildren };
  }

  return { type: ASTNodeType.If, condition, consequent, alternate };
}
