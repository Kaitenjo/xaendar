import { DOUBLE_QUOTE, GRAVE_ACCENT, GREATER_THEN, LESS_THAN, LPAREN, RPAREN, SINGLE_QUOTE } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';

/**
 * Consumes type arguments up to the character closing the one opening them, already consumed:
 * - `<…>`, the type arguments of a directive, e.g. `string, Map<string, number>` in `@@selector<string, Map<string, number>>(...)`;
 * - `(…)`, the type arguments of a web component, e.g. `string, (value: number) => void` in `<my-list(string, (value: number) => void)>`.
 *
 * The groups of the same kind nested in them don't close them, nor do the characters inside a string, nor the `>` of the
 * arrow of a function type.
 *
 * @param cursor - The lexer cursor positioned right after the character opening the type arguments.
 * @param open - The character opening the type arguments: {@link LESS_THAN} or {@link LPAREN}.
 * @returns The text of the type arguments, without the characters enclosing them.
 * @throws If the type arguments are empty, or the input ends before they are closed.
 */
export function lexTypeArguments(cursor: LexerCursor, open: typeof LESS_THAN | typeof LPAREN): string {
  const close = open === LESS_THAN ? GREATER_THEN : RPAREN;
  let depth = 1;
  let text = '';
  let quote: number | undefined;

  while (depth) {
    cursor.advance();
    const { code, value } = cursor.currentChar;

    if (quote !== undefined) {
      quote = code === quote ? undefined : quote;
    } else {
      switch (code) {
        case SINGLE_QUOTE:
        case DOUBLE_QUOTE:
        case GRAVE_ACCENT:
          quote = code;
          break;

        case open:
          depth++;
          break;

        case close:
          // The `>` of the arrow of a function type (`() => void`) closes nothing
          if (code !== GREATER_THEN || !text.endsWith('=')) {
            depth--;
          }
          break;
      }
    }

    if (depth) {
      text = `${text}${value}`;
    }
  }

  if (!text.trim()) {
    throw 'Type arguments cannot be empty';
  }

  return text;
}
