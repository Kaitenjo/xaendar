import { TokenType } from '../../../lexer/types/token-type.enum';
import type { Span } from '../../../types/span.type';
import type { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';

/**
 * The error of a `@switch` declaring both `@default never;` and a `@default` branch.
 */
const WITH_DEFAULT = '@default never; cannot be declared with a @default branch: it states that the @case branches cover every value of the @switch';

/**
 * Parses `@default never;` of an exhaustive `@switch`, block or conditional binding alike, consuming its DEFAULT token:
 * it declares no branch, so it must close the `@switch` and cannot be declared with a `@default` branch.
 *
 * @param cursor - Parser cursor positioned at the DEFAULT token flagged `never`.
 * @param span - The span of `@default never;`.
 * @param declaresDefault - Whether the `@switch` declares a `@default` branch before it.
 * @returns The span of `@default never;`, which the type-check reports a value left uncovered on.
 * @throws If the `@switch` declares a `@default` branch, or anything follows `@default never;` in it.
 */
export function parseDefaultNever(cursor: ParserCursor, span: Span, declaresDefault: boolean): Span {
  if (declaresDefault) {
    throw new Error(WITH_DEFAULT, { cause: span });
  }

  // consume DEFAULT
  cursor.advance();
  const next = cursor.peek();
  if (next.type === TokenType.DEFAULT) {
    throw new Error(WITH_DEFAULT, { cause: next.span });
  }

  if (next.type !== TokenType.BLOCK_CLOSE) {
    throw new Error('@default never; must be the last item of a @switch', { cause: span });
  }

  return span;
}
