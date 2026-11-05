import type { Expression } from 'typescript';
import type { Span } from '../../types/span.type';

/**
 * A trigger of a `@defer`, and of a `@hydrate`: `load` as soon as the page is rendered, `idle` when the browser is idle,
 * `visible` when the elements it watches enter the viewport, `interaction` at the first event on them, `when` once an
 * expression is truthy.
 */
export type DeferTrigger = {
  /**
   * The kind of the trigger.
   */
  kind: 'load' | 'idle' | 'visible' | 'interaction';
  /**
   * Where the trigger is written.
   */
  span: Span;
} | {
  /**
   * The kind of the trigger.
   */
  kind: 'when';
  /**
   * The expression, as written.
   */
  expression: string;
  /**
   * The parsed expression.
   */
  expressionNode: Expression;
  /**
   * Where the expression is written.
   */
  span: Span;
};
