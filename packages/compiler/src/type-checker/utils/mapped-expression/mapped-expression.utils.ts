import type { Expression } from 'typescript';
import { resolveExpression } from '../../../generator/utils/generator/generator.utils';
import type { ResolveExpressionOptions } from '../../../generator/types/resolve-expresion-options.type';
import type { Span } from '../../../types/span.type';
import type { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { LineMapping } from '../../types/line-mapping.type';
import { mappedSegments } from '../line-builder/line-builder.utils';
import type { LinePart } from '../../types/line-part.type';

/**
 * Resolves an expression of the template into a fragment of a type-check line, mapped as a whole onto `span` and,
 * finely, onto the spans of its identifiers and of its pieces copied verbatim (see `resolveExpression`). The signals
 * an enclosing `@if` narrows are read through the constants holding their values (see `narrowSignals`).
 *
 * @param expression - The expression to resolve.
 * @param context - Current type-check scope.
 * @param span - The span of the template the whole fragment is mapped onto.
 * @param suffix - Text following the expression in the fragment, e.g. the `;` closing a statement.
 * @param options - The options of the resolution, reading the members of the component through `root` by default.
 * @returns The mapped fragment.
 */
export function mappedExpression(expression: Expression, context: TypeCheckContext, span: Span, suffix = '', options: ResolveExpressionOptions = { resolver: 'root', preserveNonNull: true }): LinePart {
  const segments = new Array<LineMapping>();
  const resolved = resolveExpression(expression, context, Object.assign({ narrowedSignal: (name: string) => context.getNarrowedSignal(name) }, options), segments).expression;
  return mappedSegments(`${resolved}${suffix}`, span, segments);
}
