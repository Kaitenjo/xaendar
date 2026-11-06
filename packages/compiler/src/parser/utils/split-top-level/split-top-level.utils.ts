/**
 * Splits a text on the commas outside of parentheses, brackets, braces and string literals, trimming each part: the
 * triggers of a `@defer` and of a `@hydrate`, the arguments of a trigger, the parameters of a `@placeholder` and of a
 * `@loading`.
 *
 * @example
 * splitTopLevel('visible, when check(a, b)'); // [{ text: 'visible', start: 0 }, { text: 'when check(a, b)', start: 9 }]
 *
 * @param source - The text.
 * @returns The parts, with where each one starts in the text.
 */
export function splitTopLevel(source: string): Array<{ text: string, start: number }> {
  const parts = new Array<{ text: string, start: number }>();
  let depth = 0;
  let quote: string | undefined;
  let partStart = 0;
  const push = (end: number) => {
    const raw = source.slice(partStart, end);
    const leading = raw.length - raw.trimStart().length;
    parts.push({ text: raw.trim(), start: partStart + leading });
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === '\\') {
        i++;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    switch (char) {
      case '\'':
      case '"':
      case '`':
        quote = char;
        break;

      case '(':
      case '[':
      case '{':
        depth++;
        break;

      case ')':
      case ']':
      case '}':
        depth--;
        break;

      case ',':
        if (!depth) {
          push(i);
          partStart = i + 1;
        }
    }
  }

  push(source.length);
  return parts;
}
