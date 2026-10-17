import type { TemplateVariableToken } from '../../../lexer/types/tokens/template-variable-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { TemplateVariableNode } from '../../types/nodes/template-variable-node.type';
import { assertDeclaredName } from '../../utils/identifier/identifier.utils';

/**
 * Parses a TEMPLATE_VARIABLE token declared on an element, e.g. `#name` in `<input #name />`, into a `TemplateVariableNode`.
 *
 * @param cursor - Parser cursor positioned at the TEMPLATE_VARIABLE token; advanced past it.
 * @param token - The TEMPLATE_VARIABLE token.
 * @returns The parsed `TemplateVariableNode`.
 * @throws If the name is not an identifier, or is reserved.
 */
export function parseTemplateVariable(cursor: ParserCursor, token: TemplateVariableToken): TemplateVariableNode {
  cursor.advance();
  const [name] = token.parts;
  const nameSpan = cursor.findSpan(name, token.span.start);
  assertDeclaredName(name, nameSpan, 'template variable');

  // The `#` comes right before the name
  return { name, nameSpan, span: { start: nameSpan.start - 1, end: nameSpan.end } };
}
