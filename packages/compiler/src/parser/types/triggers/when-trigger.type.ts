import type { Expression } from 'typescript';
import type { BaseTrigger } from './base-trigger.type';

/**
 * The trigger firing once an expression is truthy: `when ready()`.
 */
export type WhenTrigger = BaseTrigger<'when'> & {
  /**
   * The expression, as written.
   */
  expression: string;
  /**
   * The parsed expression.
   */
  expressionNode: Expression;
};
