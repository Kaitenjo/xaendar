import type { Span } from '../../../types/span.type';
import type { EventCheck } from '../../types/event-check.type';
import type { TypeCheckResult } from '../../types/type-checker-result.type';

/**
 * The code of the error TypeScript reports on an expression not satisfying the type of a `satisfies`: "Type 'x' does
 * not satisfy the expected type 'y'".
 */
const NOT_SATISFIED = 1360;

/**
 * Finds the check of the name of an event binding an error TypeScript reports on the type-check code of a template
 * belongs to: an event the element does not declare (`(bubbling)` on a `<div>`), which the binding hears only when it
 * is dispatched on the element or bubbles up to it. The editor and the build report it as a warning, on the name of the
 * event, instead of the error.
 *
 * Shared by the editor and the build, so that both tell the same.
 *
 * @example
 * // <div (bubbling)="onBubbling($event)">
 * findEventCheck(typeCheck, span, 1360); // { span, nameSpan, message: "'bubbling' is not an event of <div>: …" }
 *
 * @param typeCheck - The type-check code of the template, with the checks of the names of its events.
 * @param span - The span of the template the error is reported on.
 * @param code - The code of the error.
 * @returns The check, `undefined` when the error is not the one of the name of an event.
 */
export function findEventCheck(typeCheck: Pick<TypeCheckResult, 'eventChecks'>, span: Span, code: number): EventCheck | undefined {
  const checks = code === NOT_SATISFIED ? typeCheck.eventChecks : undefined;
  if (!checks?.length) {
    return undefined;
  }

  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    if (span.start >= check.span.start && span.end <= check.span.end) {
      return check;
    }
  }

  return undefined;
}
