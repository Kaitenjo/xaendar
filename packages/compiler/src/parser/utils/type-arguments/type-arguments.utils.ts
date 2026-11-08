import { splitTopLevel } from '../../../lexer/utils/balanced-text/balanced-text.utils';
import type { TypeArgumentNode } from '../../types/nodes/type-argument-node.type';

/**
 * Splits the text of the type arguments of a directive or of a web component at the commas outside of any group, so that
 * `string, Map<string, number>` holds the two types `string` and `Map<string, number>`. A trailing comma is accepted,
 * like TypeScript does.
 *
 * @example
 * parseTypeArguments('string, Map<string, number>', 10);  // [{ text: 'string', span: { start: 10, end: 16 } }, { text: 'Map<string, number>', span: { start: 18, end: 37 } }]
 *
 * @param text - The text of the type arguments, without the characters enclosing them.
 * @param offset - The offset of the template the text starts at.
 * @returns The type arguments, with their span in the template.
 * @throws If a type argument is empty.
 */
export function parseTypeArguments(text: string, offset: number): TypeArgumentNode[] {
  const parts = splitTopLevel(text, ',', true);
  if (!parts[parts.length - 1].text) {
    parts.pop();
  }

  return parts.map(({ text: type, start }) => {
    if (!type) {
      throw 'A type argument cannot be empty';
    }

    return { text: type, span: { start: offset + start, end: offset + start + type.length } };
  });
}
