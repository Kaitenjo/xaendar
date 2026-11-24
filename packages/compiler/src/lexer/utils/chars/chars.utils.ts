import { A, BACKSLASH, CR, DELETE, DOLLAR, DOUBLE_QUOTE, LESS_THAN, LF, NINE, SINGLE_QUOTE, SPACE, TAB, UNDERSCORE, Z, ZERO, a, z } from '../../../costants/chars.constant';

/**
 * Checks whether a string contains at least one non-whitespace character.
 *
 * Whitespace characters include space, `\n`, `\r`, `\t`, `\f`, and `\v`.
 *
 * @param str - The string to check.
 * @returns `true` if the string is not blank, `false` if it consists entirely of whitespace.
 */
export function isNotBlank(str: string): boolean {
  /* 
    Differently from the approach of the other functions
    here we are working with string and not numbers.

    Number checks are usually faster when checking a character is
    included in a specific range.
    For this case we are checking if the string contains at least one char
    different from a list of non adiacent characters in the ASCII code, resulting
    in a very long condition with multiple OR

    This has been proven slower than using a regex
  */
  return /\S/.test(str)
}

/**
 * Tells whether a character can be part of a name the template declares, e.g. the one of a template in `@render row()`
 * or the one of a `@let`.
 *
 * @param code - The code of the character.
 * @returns `true` for a letter, a digit, `_` or `$`.
 */
export function isIdentifierChar(code: number): boolean {
  return (code >= a && code <= z) || (code >= A && code <= Z) || (code >= ZERO && code <= NINE) || code === UNDERSCORE || code === DOLLAR;
}

/**
 * Tells whether a character cannot be part of the name of an attribute, of an event or of the selector of a directive,
 * as in HTML: a quote and `<`, a parse error of the tokenizer of HTML in the name of an attribute, and `\` and the
 * control characters, which no name of HTML, of the DOM or of a directive holds.
 *
 * N.B. The generated code writes these names as they are between single quotes (`name: 'title'`): rejecting the
 * characters that would end the string or change its value is what keeps a name from writing code. Do not let one of
 * them through, nor escape the names in the generator instead.
 *
 * @param code - The code of the character.
 * @returns `true` for `"`, `'`, `<`, `\`, and the control characters (U+0000 to U+001F and U+007F).
 */
export function isForbiddenNameChar(code: number): boolean {
  return code === DOUBLE_QUOTE || code === SINGLE_QUOTE || code === LESS_THAN || code === BACKSLASH || code < SPACE || code === DELETE;
}

/**
 * Finds the first character of a name that {@link isForbiddenNameChar} rejects.
 *
 * @param name - The name.
 * @returns The offset of the character, `-1` when the name holds none.
 */
export function findForbiddenNameChar(name: string): number {
  for (let i = 0; i < name.length; i++) {
    if (isForbiddenNameChar(name.charCodeAt(i))) {
      return i;
    }
  }

  return -1;
}

/**
 * Describes a character {@link isForbiddenNameChar} rejects, for the message of the error reporting it.
 *
 * @param code - The code of the character.
 * @returns The character between single quotes, or its code point (`U+0007`) for a control character.
 */
export function describeNameChar(code: number): string {
  return code < SPACE || code === DELETE ? `U+${code.toString(16).toUpperCase().padStart(4, '0')}` : `'${String.fromCharCode(code)}'`;
}

/**
 * Tells whether a character is an ASCII letter, the first character of a tag name, as in HTML.
 *
 * @param code - The code of the character.
 * @returns `true` for a letter from `a` to `z` or from `A` to `Z`.
 */
export function isAsciiLetter(code: number): boolean {
  return (code >= a && code <= z) || (code >= A && code <= Z);
}

/**
 * Tells whether a character is whitespace laying out a template: a space, a tab or a line break.
 *
 * @param code - The code of the character.
 * @returns `true` for a space, a tab, a line feed or a carriage return.
 */
export function isWhitespace(code: number): boolean {
  return code === SPACE || code === TAB || code === LF || code === CR;
}
