import { LESS_THAN, LPAREN } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { lexGroup } from '../group/group.utils';

/**
 * Consumes type arguments up to the character closing the one opening them, already consumed:
 * - `<…>`, the type arguments of a directive, e.g. `string, Map<string, number>` in `@@selector<string, Map<string, number>>(...)`;
 * - `(…)`, the type arguments of a web component, e.g. `string, (value: number) => void` in `<my-list(string, (value: number) => void)>`.
 *
 * The groups of the same kind nested in them don't close them, nor do the characters inside a string, nor the `>` of the
 * arrow of a function type (see {@link lexGroup}).
 *
 * @param cursor - The lexer cursor positioned right after the character opening the type arguments.
 * @param open - The character opening the type arguments: {@link LESS_THAN} or {@link LPAREN}.
 * @returns The text of the type arguments, without the characters enclosing them.
 * @throws If the type arguments are empty, or the input ends before they are closed.
 */
export function lexTypeArguments(cursor: LexerCursor, open: typeof LESS_THAN | typeof LPAREN): string {
  const text = lexGroup(cursor, open);
  if (!text.trim()) {
    throw 'Type arguments cannot be empty';
  }

  return text;
}
