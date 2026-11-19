import { TokenType } from '../../../lexer/types/token-type.enum';
import type { CastToken } from '../../../lexer/types/tokens/cast-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { CastNode } from '../../types/nodes/cast-node.type';

/**
 * Parses the CAST token closing an interpolation or a parameter of an event handler, if the next token is one, into a
 * `CastNode`, e.g. `string` in `{ value() as string }`. The span of the type is the one of the text after `as`.
 *
 * @param cursor - Parser cursor positioned right before the token that may be a CAST; advanced past it when it is.
 * @returns The parsed `CastNode`, `undefined` if the next token is not a CAST.
 */
export function parseCast(cursor: ParserCursor): CastNode | undefined {
  const token = cursor.peek<CastToken>();
  if (token.type !== TokenType.CAST) {
    return undefined;
  }

  cursor.advance();
  const [text] = token.parts;
  // The token starts at the whitespace before `as`: the first `as` it holds is the keyword
  return { text, span: cursor.findSpan(text, cursor.findSpan('as', token.span.start).end) };
}
