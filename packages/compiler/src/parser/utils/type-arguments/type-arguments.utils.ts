import type { TypeArgumentNode } from '../../types/nodes/type-argument-node.type';

/**
 * The characters opening a group a comma doesn't separate the type arguments in: the arguments of a generic type,
 * a tuple, an object type, a function type.
 */
const OPENERS = '<([{';

/**
 * The characters closing a group opened by one of {@link OPENERS}.
 */
const CLOSERS = '>)]}';

/**
 * Splits the text of the type arguments of a directive at the commas outside of any group, so that
 * `string, Map<string, number>` holds the two types `string` and `Map<string, number>`. A trailing comma is accepted,
 * like TypeScript does.
 *
 * @example
 * parseTypeArguments('string, Map<string, number>', 10);  // [{ text: 'string', span: { start: 10, end: 16 } }, { text: 'Map<string, number>', span: { start: 18, end: 37 } }]
 *
 * @param text - The text of the type arguments, without the angle brackets.
 * @param offset - The offset of the template the text starts at.
 * @returns The type arguments, with their span in the template.
 * @throws If a type argument is empty.
 */
export function parseTypeArguments(text: string, offset: number): TypeArgumentNode[] {
  const typeArguments = new Array<TypeArgumentNode>();
  let depth = 0;
  let quote: string | undefined;
  let start = 0;

  const add = (end: number, isLast: boolean): void => {
    const segment = text.slice(start, end);
    const trimmed = segment.trim();
    if (trimmed) {
      const spanStart = offset + start + segment.indexOf(trimmed);
      typeArguments.push({ text: trimmed, span: { start: spanStart, end: spanStart + trimmed.length } });
    } else if (!isLast) {
      throw 'A type argument of a directive cannot be empty';
    }

    start = end + 1;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote !== undefined) {
      quote = char === quote ? undefined : quote;
    } else if (char === '\'' || char === '"' || char === '`') {
      quote = char;
    } else if (OPENERS.includes(char)) {
      depth++;
    } else if (CLOSERS.includes(char)) {
      // The `>` of the arrow of a function type (`() => void`) closes nothing
      depth -= char === '>' && text[i - 1] === '=' ? 0 : 1;
    } else if (char === ',' && !depth) {
      add(i, false);
    }
  }

  add(text.length, true);
  return typeArguments;
}
