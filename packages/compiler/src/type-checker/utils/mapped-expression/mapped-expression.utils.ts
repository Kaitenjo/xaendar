import type { Expression, Identifier } from 'typescript';
import { getTemplateSpan } from '../../../parser/utils/expression-validator/expression-validator';
import { resolveExpression } from '../../../generator/utils/generator/generator.utils';
import type { ResolveExpressionOptions } from '../../../generator/types/resolve-expresion-options.type';
import type { InterpolationNode } from '../../../parser/types/nodes/interpolation-node.type';
import type { Span } from '../../../types/span.type';
import type { TypeCheckContext } from '../../models/context/context';
import type { LineMapping } from '../../types/line-mapping.type';
import { castExpression } from '../cast/cast.utils';
import { mappedSegments } from '../line-builder/line-builder.utils';
import type { LinePart } from '../../types/line-part.type';

/**
 * The options resolving an expression of the template by default: the members of the component are read through `root`.
 */
const ROOT_OPTIONS: ResolveExpressionOptions = { resolver: 'root', preserveTypeScript: true };

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
export function mappedExpression(expression: Expression, context: TypeCheckContext, span: Span, suffix = '', options = ROOT_OPTIONS): LinePart {
  const segments = new Array<LineMapping>();
  const resolved = resolveMappedExpression(expression, context, options, segments);
  return mappedSegments(`${resolved}${suffix}`, span, segments);
}

/**
 * Resolves the expression of an interpolation like {@link mappedExpression}, mapped as a whole onto the span of the
 * interpolation, and casts it to the type of its cast, if any (see `castExpression`).
 *
 * @param interpolation - The interpolation.
 * @param context - Current type-check scope.
 * @param suffix - Text following the expression in the fragment, e.g. the `;` closing a statement.
 * @returns The mapped fragment.
 */
export function mappedInterpolation({ expression, cast, span }: InterpolationNode, context: TypeCheckContext, suffix = ''): LinePart {
  const segments = new Array<LineMapping>();
  const resolved = resolveMappedExpression(expression, context, ROOT_OPTIONS, segments);
  return mappedSegments(`${cast ? castExpression(expression, resolved, segments, cast) : resolved}${suffix}`, span, segments);
}

/**
 * Resolves an expression of the template, reading the signals an enclosing `@if` narrows through the constants holding
 * their values, and collects the finer mappings of its parts, recording the calls of the variables of the template it
 * makes (see `TypeCheckContext.recordVariableCall`).
 *
 * @param expression - The expression to resolve.
 * @param context - Current type-check scope.
 * @param options - The options of the resolution.
 * @param segments - Receives the finer mappings of the parts of the expression.
 * @returns The resolved expression.
 */
function resolveMappedExpression(expression: Expression, context: TypeCheckContext, options: ResolveExpressionOptions, segments: LineMapping[]): string {
  return resolveExpression(expression, context, Object.assign({ narrowedSignal: (name: string) => context.getNarrowedSignal(name), variableCall: (callee: Identifier) => recordCall(context, callee) }, options), segments).expression;
}

/**
 * Records the call of a variable of the template, mapped onto the name of the variable.
 *
 * @param context - Current type-check scope.
 * @param callee - The identifier of the variable called.
 */
function recordCall(context: TypeCheckContext, callee: Identifier): void {
  const span = getTemplateSpan(callee);
  if (span) {
    context.recordVariableCall({ name: callee.text, span });
  }
}
