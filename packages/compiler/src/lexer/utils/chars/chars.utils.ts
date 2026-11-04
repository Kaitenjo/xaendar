import { A, DOLLAR, NINE, UNDERSCORE, Z, ZERO, a, z } from '../../../costants/chars.constant';

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