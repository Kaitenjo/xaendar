import type { Span } from '../../types/span.type';

/**
 * The check of the name of an event binding the element does not declare in its event map, nor as an `@Event` of its
 * component or of a directive applied to it (`(bubbling)` on a `<div>`): the binding hears it only when it is dispatched
 * on the element or bubbles up to it, so TypeScript rejecting the name is a warning, not an error (see
 * `findEventCheck`).
 */
export type EventCheck = {
  /**
   * The span of the event binding, where TypeScript reports the name its check rejects.
   */
  readonly span: Span;
  /**
   * The span of the name of the event, where the warning is reported.
   */
  readonly nameSpan: Span;
  /**
   * The message of the warning.
   */
  readonly message: string;
};
