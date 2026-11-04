import type { Expression } from 'typescript';
import type { Span } from '../../types/span.type';

/**
 * A trigger of a `@hydrate`: `load` as soon as the page is rendered, `idle` when the browser is idle, `visible` when
 * the content enters the viewport, `interaction` at the first event on it, `when` once an expression is truthy, `never`
 * leaving it as the HTML of the server for good.
 */
export type HydrateTrigger = {
  /**
   * The kind of the trigger.
   */
  kind: 'load' | 'idle' | 'visible' | 'interaction' | 'never';
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
