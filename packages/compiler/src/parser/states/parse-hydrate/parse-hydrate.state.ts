import { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { HydrateToken } from '../../../lexer/types/tokens/hydrate-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { HydrateNode } from '../../types/nodes/hydrate-node.type';
import { parseHydrateTriggers } from '../../utils/triggers/triggers.utils';
import { parseBlockChildren } from '../parse-block-children/parse-block-children.state';

/**
 * Parses a `@hydrate` block: its triggers, between parentheses, which can be left out to wait for the browser to be
 * idle, and its content.
 *
 * @param cursor - The parser cursor positioned on the `@hydrate` keyword.
 * @param parseNode - Parses the next node.
 * @param token - The `@hydrate` keyword.
 * @returns The hydrate node.
 * @throws When the triggers are not valid.
 */
export function parseHydrate(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: HydrateToken): HydrateNode {
  const startOffset = token.span.start;
  cursor.advance();

  const conditionToken = cursor.peek();
  const { triggers, prefetch } = conditionToken.type === TokenType.CONDITION
    ? parseHydrateTriggers(conditionToken.parts[0], cursor.findConditionSpan(conditionToken).start)
    : { triggers: [], prefetch: [] };
  // consume CONDITION, if any, and BLOCK_OPEN
  cursor.advance(conditionToken.type === TokenType.CONDITION ? 2 : 1);
  const children = parseBlockChildren(cursor, parseNode);

  return {
    type: ASTNodeType.Hydrate,
    triggers,
    prefetch,
    children,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end
    }
  };
}
