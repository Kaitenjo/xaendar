import { CLOSERS } from '../../../costants/closers.costant';

/**
 * Finds the character closing the group opened at an index of a text, `{`, `(`, `[` or `<`: the groups nested in it
 * don't close it, nor do the characters inside a string (`'…'`, `"…"` or a template literal, whose `${…}` are read as
 * groups), nor the `>` of an arrow (`=>`) when the group is opened by `<`.
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
  const open = text[openIndex];
  const close = CLOSERS[open];
  let depth = 0;

  for (let i = openIndex; i < text.length; i++) {
    const char = text[i];
    if (char === '\'' || char === '"' || char === '`') {
      const end = findStringEnd(text, i);
      if (end === undefined) {
        return undefined;
      }

      i = end;
    } else if (char === open) {
      depth++;
    } else if (char === close && !(close === '>' && text[i - 1] === '=')) {
      depth--;
      if (!depth) {
        return i;
      }
    }
  }

  return undefined;
}

/**
 * Finds the end of a string.
 *
 * @param text - The text.
 * @param quoteIndex - The index of the quote opening the string: `'`, `"` or a backtick.
 * @returns The index of the quote closing the string, `undefined` if the string is not closed.
 */
function findStringEnd(text: string, quoteIndex: number): number | undefined {
  const quote = text[quoteIndex];
  for (let i = quoteIndex + 1; i < text.length; i++) {
    const char = text[i];
    if (char === '\\') {
      i++;
    } else if (char === quote) {
      return i;
    } else if (quote === '`' && char === '$' && text[i + 1] === '{') {
      const end = findClosing(text, i + 1);
      if (end === undefined) {
        return undefined;
      }

      i = end;
    }
  }

  return undefined;
}
