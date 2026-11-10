import type { Span } from '../../../types/span.type';
import type { TypeCheckResult } from '../../types/type-checker-result.type';

/**
 * The code of the error TypeScript reports on the call of a value that is not a function: "This expression is not
 * callable".
 */
const NOT_CALLABLE = 2349;

/**
 * Describes an error TypeScript reports on the type-check code of a template, when it rejects the call of a variable of
 * the template (`row()`, `$index()`, a `@let`, a parameter of a template) whose value is not a function: the variables of
 * the template are values, not signals, so the expressions read them without calling them. The call of a variable
 * holding a function is valid, and TypeScript reports nothing.
 *
 * Shared by the editor and the build, so that both tell the same.
 *
 * @example
 * // @for (row of rows(); track row.id) { { row().name } }
 * describeVariableCall(typeCheck, span, 2349); // "'row' is a template variable, not a signal: remove the parentheses, …"
 *
 * @param typeCheck - The type-check code of the template, with the calls of its variables.
 * @param span - The span of the template the error is reported on.
 * @param code - The code of the error.
 * @returns The message, `undefined` when the error is not the call of a variable.
 */
export function describeVariableCall(typeCheck: Pick<TypeCheckResult, 'variableCalls'>, span: Span, code: number): string | undefined {
  const calls = code === NOT_CALLABLE ? typeCheck.variableCalls : undefined;
  if (!calls?.length) {
    return undefined;
  }

  for (let i = 0; i < calls.length; i++) {
    const { name, span: callee } = calls[i];
    if (callee.start === span.start && callee.end === span.end) {
      return `'${name}' is a template variable, not a signal: remove the parentheses and read it as ${name}, since the variables of a template (@for, @let, parameters of a template) hold their values`;
    }
  }

  return undefined;
}
