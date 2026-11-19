import type { Expression } from 'typescript';
import type { Span } from '../../../types/span.type';
import type { TypeCheckContext } from '../../models/context/context';
import type { Line } from '../../types/line.type';
import type { TypeCheckResult } from '../../types/type-checker-result.type';
import { indentLines, line, mapped, plain } from '../line-builder/line-builder.utils';
import { mappedExpression } from '../mapped-expression/mapped-expression.utils';

/**
 * The code of the error TypeScript reports on an expression not satisfying the type of a `satisfies`: "Type 'x' does
 * not satisfy the expected type 'y'".
 */
const NOT_SATISFIED = 1360;

/**
 * The message TypeScript writes for a value left uncovered by the cases, capturing its type.
 */
const UNCOVERED = /^Type '(.+)' does not satisfy the expected type 'never'\.$/;

/**
 * Writes the opening of the `switch` statement type-checking a `@switch`, block or conditional binding alike. An
 * exhaustive one (`@default never;`) keeps the value of its expression in a constant, `__switch<offset>`, so that
 * TypeScript narrows it through the cases and its `default` can require what is left to be `never` (see
 * {@link typeCheckExhaustiveDefault}).
 *
 * @param expression - The expression of the `@switch`.
 * @param span - The span of the `@switch`.
 * @param exhaustive - Whether the `@switch` ends with `@default never;`.
 * @param context - Current type-check scope.
 * @returns The lines opening the `switch`, up to its `{`.
 */
export function typeCheckSwitchHeader(expression: Expression, span: Span, exhaustive: boolean, context: TypeCheckContext): Line[] {
  if (!exhaustive) {
    return [line('switch (', mappedExpression(expression, context, span), ') {')];
  }

  const name = getSwitchConstant(span);
  return [line(`const ${name} = `, mappedExpression(expression, context, span, ';')), plain(`switch (${name}) {`)];
}

/**
 * Writes the `default` of the `switch` type-checking a `@switch` ending with `@default never;`: the value of the
 * expression, narrowed by the cases, must be `never`, so a value no `@case` covers is an error of TypeScript, reported on
 * `@default never;` and recorded so that it is told as such (see {@link describeExhaustiveSwitch}).
 *
 * @param span - The span of the `@switch`.
 * @param exhaustive - The span of `@default never;`.
 * @param context - Current type-check scope.
 * @returns The lines of the `default`, not indented inside the `switch`.
 */
export function typeCheckExhaustiveDefault(span: Span, exhaustive: Span, context: TypeCheckContext): Line[] {
  context.recordExhaustiveSwitch(exhaustive);
  return [plain('default:'), ...indentLines([line(mapped(`${getSwitchConstant(span)} satisfies never;`, exhaustive))])];
}

/**
 * Describes an error TypeScript reports on the type-check code of a template, when the `@case` branches of a `@switch`
 * ending with `@default never;` leave values of its expression uncovered, naming their type: a missing case
 * (`"error"`), or a type no case can cover (`string`).
 *
 * Shared by the editor and the build, so that both tell the same.
 *
 * @example
 * // @switch (status()) { @case ('idle') { … } @default never; }, status() being 'idle' | 'error'
 * describeExhaustiveSwitch(typeCheck, span, 1360, message); // '@switch is not exhaustive: no @case covers "error". …'
 *
 * @param typeCheck - The type-check code of the template, with the `@default never;` it declares.
 * @param span - The span of the template the error is reported on.
 * @param code - The code of the error.
 * @param message - The message of the error, whose first line names the type left uncovered.
 * @returns The message, `undefined` when the error is not the one of a `@default never;`.
 */
export function describeExhaustiveSwitch(typeCheck: Pick<TypeCheckResult, 'exhaustiveSwitches'>, span: Span, code: number, message: string): string | undefined {
  const switches = code === NOT_SATISFIED ? typeCheck.exhaustiveSwitches : undefined;
  if (!switches?.length) {
    return undefined;
  }

  for (let i = 0; i < switches.length; i++) {
    const { start, end } = switches[i];
    if (span.start >= start && span.end <= end) {
      const uncovered = UNCOVERED.exec(message.split('\n')[0])?.[1];
      return `@switch is not exhaustive: no @case covers ${uncovered ?? 'every value of its expression'}. Add the missing @case, or replace @default never; with a @default branch.`;
    }
  }

  return undefined;
}

/**
 * Names the constant holding the value of the expression of an exhaustive `@switch`, unique in the template.
 *
 * @param span - The span of the `@switch`.
 * @returns The name.
 */
function getSwitchConstant(span: Span): string {
  return `__switch${span.start}`;
}
