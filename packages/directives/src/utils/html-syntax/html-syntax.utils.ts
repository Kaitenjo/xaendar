/**
 * Tells whether a character is an ASCII letter.
 *
 * @param code - The code of the character, `NaN` past the end of a string.
 * @returns Whether it is a letter from `a` to `z` or from `A` to `Z`.
 */
export function isAsciiLetter(code: number): boolean {
  return (code >= 97 && code <= 122) || (code >= 65 && code <= 90);
}

/**
 * Tells whether a character is a white space of HTML: tab, line feed, form feed, carriage return or space.
 *
 * @param code - The code of the character.
 * @returns Whether it is a white space.
 */
export function isWhitespace(code: number): boolean {
  return code === 32 || code === 9 || code === 10 || code === 12 || code === 13;
}

/**
 * Lowercases the ASCII letters of a name, as the HTML parser does with the names of the tags and of the attributes: the
 * other letters are kept (`toLowerCase` would turn the Kelvin sign into a `k`).
 *
 * @param name - The name.
 * @returns The name with its ASCII letters lowercase.
 */
export function toAsciiLowerCase(name: string): string {
  return name.replace(/[A-Z]+/g, letters => letters.toLowerCase());
}
