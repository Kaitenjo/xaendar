import { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { DeferToken } from '../../../lexer/types/tokens/defer-token.type';
import type { ErrorToken } from '../../../lexer/types/tokens/error-token.type';
import type { LoadingToken } from '../../../lexer/types/tokens/loading-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { DeferNode } from '../../types/nodes/defer-node.type';
import type { ErrorNode } from '../../types/nodes/error-node.type';
import { readErrorName } from '../../utils/error-name/error-name.utils';
import { parseDeferTriggers } from '../../utils/triggers/triggers.utils';
import { parseBlockChildren } from '../parse-block-children/parse-block-children.state';

/**
 * Parses a `@defer` block: its triggers, its content, and the blocks following it, each one optional and declared once,
 * in any order: `@placeholder`, `@loading`, and `@error` with the name of its error between parentheses, when it has one.
 *
 * @param cursor - The parser cursor positioned on the `@defer` keyword.
 * @param parseNode - Parses the next node.
 * @param token - The `@defer` keyword.
 * @returns The defer node.
 * @throws When the triggers are missing or not valid, a block following the content is declared twice, or the name of
 *   the error is not one a template can declare.
 */
export function parseDefer(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: DeferToken): DeferNode {
  cursor.advance();
  const conditionToken = cursor.peek();
  if (conditionToken.type !== TokenType.CONDITION) {
    throw `Expected the triggers of @defer between parentheses, got ${TokenType[conditionToken.type]}`;
  }

  // consume CONDITION and BLOCK_OPEN
  cursor.advance(2);
  const node: DeferNode = {
    type: ASTNodeType.Defer,
    triggers: parseDeferTriggers(conditionToken.parts[0], cursor.findConditionSpan(conditionToken).start),
    children: parseBlockChildren(cursor, parseNode),
    placeholder: null,
    loading: null,
    error: null,
    span: { start: token.span.start, end: cursor.getCurrentToken().value.span.end }
  };

  for (let next = cursor.peek(); next.type === TokenType.PLACEHOLDER || next.type === TokenType.LOADING || next.type === TokenType.ERROR; next = cursor.peek()) {
    const start = next.span.start;
    // consume the keyword
    cursor.advance();
    switch (next.type) {
      case TokenType.PLACEHOLDER: {
        assertNotDeclared(node.placeholder, '@placeholder', next.span);
        const children = parseFollowingChildren(cursor, parseNode);
        node.placeholder = { type: ASTNodeType.Placeholder, children, span: { start, end: cursor.getCurrentToken().value.span.end } };
        break;
      }

      case TokenType.LOADING: {
        assertNotDeclared(node.loading, '@loading', next.span);
        const children = parseFollowingChildren(cursor, parseNode);
        node.loading = { type: ASTNodeType.Loading, children, span: { start, end: cursor.getCurrentToken().value.span.end } };
        break;
      }

      default: {
        assertNotDeclared(node.error, '@error', next.span);
        const error: ErrorNode = { type: ASTNodeType.Error, children: [], span: next.span };
        readErrorName(cursor, error, 'error of @error');
        error.children = parseFollowingChildren(cursor, parseNode);
        error.span = { start, end: cursor.getCurrentToken().value.span.end };
        node.error = error;
      }
    }

    node.span.end = cursor.getCurrentToken().value.span.end;
  }

  return node;
}

/**
 * Rejects a `@loading` block not following the block of a `@defer`.
 *
 * @param _cursor - Unused parser cursor.
 * @param _parseNode - Unused.
 * @param token - The keyword of the block.
 * @throws Always.
 */
export function parseOrphanLoading(_cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, token: LoadingToken): never {
  throw new Error('@loading must follow the block of a @defer', { cause: token.span });
}

/**
 * Rejects an `@error` block not following the block of a `@defer`.
 *
 * @param _cursor - Unused parser cursor.
 * @param _parseNode - Unused.
 * @param token - The keyword of the block.
 * @throws Always.
 */
export function parseOrphanError(_cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, token: ErrorToken): never {
  throw new Error('@error must follow the block of a @defer', { cause: token.span });
}

/**
 * Parses the content of a block following the one of a `@defer`.
 *
 * @param cursor - The parser cursor positioned on the BLOCK_OPEN of the block.
 * @param parseNode - Parses the next node.
 * @returns The nodes of the content.
 */
function parseFollowingChildren(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>): ASTNode[] {
  // consume BLOCK_OPEN
  cursor.advance();
  return parseBlockChildren(cursor, parseNode);
}

/**
 * Ensures a block following the one of a `@defer` is declared once.
 *
 * @param declared - The block already declared, if any.
 * @param keyword - The keyword of the block.
 * @param span - The span of the keyword declaring it again.
 * @throws When the block is already declared.
 */
function assertNotDeclared(declared: object | null, keyword: string, span: DeferNode['span']): void {
  if (declared) {
    throw new Error(`${keyword} is declared twice for this @defer`, { cause: span });
  }
}
