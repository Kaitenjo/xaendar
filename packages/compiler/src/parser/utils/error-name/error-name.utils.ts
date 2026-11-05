import { TokenType } from '../../../lexer/types/token-type.enum';
import type { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { CatchNode } from '../../types/nodes/catch-node.type';
import { assertDeclaredName } from '../identifier/identifier.utils';

/**
 * Reads the name a block receiving an error gives it, between the parentheses following its keyword, as `catch (error)`
 * does in JavaScript: the one of a `@catch` or of an `@error`. The name is optional: without parentheses, nothing is
 * read.
 *
 * @param cursor - The parser cursor positioned after the keyword of the block.
 * @param node - The node of the block, receiving the name and its span.
 * @param kind - What the name names, used in the error messages, e.g. `@catch error`.
 * @throws When the name is not one a template can declare.
 */
export function readErrorName(cursor: ParserCursor, node: Pick<CatchNode, 'name' | 'nameSpan'>, kind: string): void {
  const nameToken = cursor.peek();
  if (nameToken.type !== TokenType.CONDITION) {
    return;
  }

  const raw = nameToken.parts[0];
  const name = raw.trim();
  const start = cursor.findConditionSpan(nameToken).start + raw.length - raw.trimStart().length;
  const nameSpan = { start, end: start + name.length };
  assertDeclaredName(name, nameSpan, kind);
  node.name = name;
  node.nameSpan = nameSpan;
  // consume the name
  cursor.advance();
}
