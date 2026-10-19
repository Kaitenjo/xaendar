import type { ElementRefToken } from '../../../lexer/types/tokens/element-ref-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ElementRefNode } from '../../types/nodes/element-ref-node.type';
import { assertDeclaredName } from '../../utils/identifier/identifier.utils';

/**
 * Parses an ELEMENT_REF token declared on an element, e.g. `#name` in `<input #name />`, into a `ElementRefNode`.
 *
 * @param cursor - Parser cursor positioned at the ELEMENT_REF token; advanced past it.
 * @param token - The ELEMENT_REF token.
 * @returns The parsed `ElementRefNode`.
 * @throws If the name is not an identifier, or is reserved.
 */
export function parseElementRef(cursor: ParserCursor, token: ElementRefToken): ElementRefNode {
  cursor.advance();
  const [name] = token.parts;
  const nameSpan = cursor.findSpan(name, token.span.start);
  assertDeclaredName(name, nameSpan, 'element ref');

  // The `#` comes right before the name
  return { name, nameSpan, span: { start: nameSpan.start - 1, end: nameSpan.end } };
}
