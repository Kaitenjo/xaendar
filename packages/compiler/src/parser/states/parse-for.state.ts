import { TokenType } from '../../lexer/models/token-type.enum.js';
import { ForToken } from '../../lexer/models/tokens/for-token.type.js';
import { ConditionToken } from '../../lexer/models/tokens/condition-token.type.js';
import { ASTNodeType } from '../models/node.enum.js';
import { ParserContext } from '../models/parser-context.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { ForNode } from '../models/nodes/for-node.type.js';
import { parseBlockChildren } from './parse-block-children.state.js';

/**
 * Parses a `@for` directive, consuming the FOR token, the CONDITION token,
 * the BLOCK_OPEN token, and all child nodes until BLOCK_CLOSE.
 *
 * @param cursor Parser cursor positioned at the FOR token.
 * @param context Parser context for recursive child parsing.
 * @param _token The FOR token (unused; consumed for position advancement).
 * @returns The parsed `ForNode`.
 */
export function parseForControlFlow(cursor: ParserCursor, context: ParserContext, _token: ForToken): ForNode {
  cursor.advance(); // consume FOR

  const conditionToken = cursor.peek();
  if (conditionToken.type !== TokenType.CONDITION) {
    throw new Error(`[Parser] Expected CONDITION after FOR, got ${TokenType[conditionToken.type]}`);
  }
  const expression = (conditionToken as ConditionToken).parts[0];
  cursor.advance(); // consume CONDITION

  cursor.advance(); // consume BLOCK_OPEN

  const children = parseBlockChildren(cursor, context);

  return { type: ASTNodeType.For, expression, children };
}
