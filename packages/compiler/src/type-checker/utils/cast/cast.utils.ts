import type { Expression } from 'typescript';
import type { CastNode } from '../../../parser/types/nodes/cast-node.type';
import { getTemplateSpan } from '../../../parser/utils/expression-validator/expression-validator';
import type { LineMapping } from '../../types/line-mapping.type';

/**
 * The text opening the cast of an expression: a parenthesis around the cast, one around the expression.
 */
const CAST_OPENING = '((';

/**
 * Writes the cast of a resolved expression of the template, `((expression) as Type)`. The expression is parenthesized,
 * so that the cast applies to all of it, as written in the template (`{ first ?? second as string }` casts
 * `first ?? second`), and so is the cast, which fits wherever the expression does. The type is written as is, mapped
 * onto its span in the template, where TypeScript reports a type it doesn't know, and the cast onto the template from
 * the expression to the type, where TypeScript reports a conversion it rejects.
 *
 * @param expression - The expression of the template.
 * @param resolved - The resolved expression.
 * @param segments - The finer mappings of the resolved expression, relative to its start: they are moved past the
 *   parentheses opening the cast, and the mappings of the cast and of the type are added to them.
 * @param cast - The type the expression is cast to.
 * @returns The text of the cast.
 */
export function castExpression(expression: Expression, resolved: string, segments: LineMapping[], { text, span }: CastNode): string {
  for (let i = 0; i < segments.length; i++) {
    const { columnStart, columnEnd, original } = segments[i];
    segments[i] = { columnStart: columnStart + CAST_OPENING.length, columnEnd: columnEnd + CAST_OPENING.length, original };
  }

  const head = `${CAST_OPENING}${resolved}) as `;
  const end = head.length + text.length;
  const expressionSpan = getTemplateSpan(expression);
  if (expressionSpan) {
    segments.push({ columnStart: 1, columnEnd: end, original: { start: expressionSpan.start, end: span.end } });
  }

  segments.push({ columnStart: head.length, columnEnd: end, original: span });
  return `${head}${text})`;
}
