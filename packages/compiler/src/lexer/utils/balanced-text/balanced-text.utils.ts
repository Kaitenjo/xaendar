import { LESS_THAN } from '../../../costants/chars.constant';
import { CLOSERS } from '../../../costants/closers.costant';
import { ExpressionScanner } from '../../../models/expression-scanner/expression-scanner.model';

/**
 * Finds where an expression, or a type, ends in a text: the first of `terminators` ending it where the scanner reads it
 * (see `ExpressionScanner.endsAt`), e.g. the `;` ending the value of a `@let`. The literals and the groups of the text
 * never end it.
 *
 * @example
 * findEnd('a(\';\'); b', 0, ';');   // 6
 *
 * @param text - The text.
 * @param start - The index the expression starts at.
 * @param terminators - The characters that can end the expression.
 * @param scanner - The scanner reading the expression, which can go on reading where a previous search stopped.
 * @param end - The index the search stops at, excluded.
 * @returns The index of the character ending the expression, `undefined` if none does before `end`.
 */
export function findEnd(text: string, start: number, terminators: string, scanner = new ExpressionScanner(), end = text.length): number | undefined {
  for (let i = start; i < end; i++) {
    const char = text.charCodeAt(i);
    if (scanner.endsAt(char, terminators)) {
      return i;
    }

    scanner.read(char);
  }

  return undefined;
}

/**
 * Finds the character closing the group opened at an index of a text, `{`, `(`, `[` or `<` (a group of types).
 *
 * @example
 * findClosing('{ a: { b } }', 0);   // 11
 * findClosing('f(\')\')', 1);        // 5
 *
 * @param text - The text.
 * @param openIndex - The index of the opening character.
 * @returns The index of the closing character, `undefined` if the group is not closed.
 */
export function findClosing(text: string, openIndex: number): number | undefined {
  const open = text.charCodeAt(openIndex);
  return findEnd(text, openIndex + 1, String.fromCharCode(CLOSERS.get(open)!), new ExpressionScanner(open === LESS_THAN));
}

/**
 * Splits a text on the separators outside of the groups and of the literals, trimming each part: the triggers of a
 * `@defer` and of a `@hydrate`, the arguments of a trigger, the parameters of a `@placeholder` and of a `@loading`, the
 * sections of a `@for`, the type arguments of a directive.
 *
 * @example
 * splitTopLevel('visible, when check(a, b)'); // [{ text: 'visible', start: 0 }, { text: 'when check(a, b)', start: 9 }]
 *
 * @param source - The text.
 * @param separator - The character separating the parts.
 * @param types - Whether the text holds types, whose type arguments (`<…>`) are groups.
 * @returns The parts, with where each one starts in the text, the last one empty when the text ends with a separator.
 */
export function splitTopLevel(source: string, separator = ',', types = false): Array<{ text: string, start: number }> {
  const parts = new Array<{ text: string, start: number }>();
  const scanner = new ExpressionScanner(types);
  let start = 0;
  let end: number | undefined;

  do {
    end = findEnd(source, start, separator, scanner);
    const raw = source.slice(start, end);
    const trimmed = raw.trimStart();
    parts.push({ text: trimmed.trimEnd(), start: start + raw.length - trimmed.length });
    start = (end ?? source.length) + 1;
  } while (end !== undefined);

  return parts;
}
