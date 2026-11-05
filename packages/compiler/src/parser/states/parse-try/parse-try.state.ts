import { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { CatchToken } from '../../../lexer/types/tokens/catch-token.type';
import type { TryToken } from '../../../lexer/types/tokens/try-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { CatchNode } from '../../types/nodes/catch-node.type';
import type { TryNode } from '../../types/nodes/try-node.type';
import { assertDeclaredName } from '../../utils/identifier/identifier.utils';
import { parseBlockChildren } from '../parse-block-children/parse-block-children.state';

/**
 * Parses a `@try` block and the `@catch` that must follow it, as in JavaScript, with the name of its error between
 * parentheses, when it has one: an identifier.
 *
 * @param cursor - The parser cursor positioned on the `@try` keyword.
 * @param parseNode - Parses the next node.
 * @param token - The `@try` keyword.
 * @returns The try node.
 * @throws When no `@catch` follows the block, or the name of the error is not one a template can declare.
 */
export function parseTry(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: TryToken): TryNode {
  // consume the keyword and BLOCK_OPEN
  cursor.advance(2);
  const children = parseBlockChildren(cursor, parseNode);

  const catchToken = cursor.peek();
  if (catchToken.type !== TokenType.CATCH) {
    throw new Error('@try needs a @catch: write @catch (error) { … } right after its block', { cause: token.span });
  }

  // consume the keyword
  cursor.advance();
  const catchNode: CatchNode = { type: ASTNodeType.Catch, children: [], span: catchToken.span };
  const nameToken = cursor.peek();
  if (nameToken.type === TokenType.CONDITION) {
    const raw = nameToken.parts[0];
    const name = raw.trim();
    const start = cursor.findConditionSpan(nameToken).start + raw.length - raw.trimStart().length;
    const nameSpan = { start, end: start + name.length };
    assertDeclaredName(name, nameSpan, '@catch error');
    catchNode.name = name;
    catchNode.nameSpan = nameSpan;
    // consume the name
    cursor.advance();
  }

  // consume BLOCK_OPEN
  cursor.advance();
  catchNode.children = parseBlockChildren(cursor, parseNode);
  const end = cursor.getCurrentToken().value.span.end;
  catchNode.span = { start: catchToken.span.start, end };

  return {
    type: ASTNodeType.Try,
    children,
    catch: catchNode,
    span: { start: token.span.start, end }
  };
}

/**
 * Rejects a `@catch` block not following the block of a `@try`.
 *
 * @param _cursor - Unused parser cursor.
 * @param _parseNode - Unused.
 * @param token - The keyword of the block.
 * @throws Always.
 */
export function parseOrphanCatch(_cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, token: CatchToken): never {
  throw new Error('@catch must follow the block of a @try', { cause: token.span });
}
