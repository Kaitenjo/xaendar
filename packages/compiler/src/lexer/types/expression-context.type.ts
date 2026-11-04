import type { Span } from '../../types/span.type';

/**
 * Where an expression is being written: in an interpolation (`{ expression }`, in the text or as the value of an
 * attribute), on the name of the method an event calls (`(name)="method()"`), in its arguments, in the condition
 * of `@if`, `@else if`, `@for` or `@switch`, in the arguments of a `@render`, or in the value of a `@let`.
 */
export type ExpressionContext = {
  /**
   * Whether the offset is in an interpolation, on the name of the method an event calls, in its arguments, in a
   * condition, in the arguments of a `@render` or in the value of a `@let`.
   */
  readonly kind: 'interpolation' | 'handler' | 'argument' | 'condition' | 'render' | 'let';
  /**
   * The span of the part of the identifier written so far, empty when nothing is written yet.
   */
  readonly span: Span;
  /**
   * The template with the expression ending at the offset and closed, so that it compiles while the user is
   * typing: the template up to the offset is unchanged, a placeholder identifier is written at the offset when no
   * identifier is, the arguments of a method also pass `$event`, so that it is declared, and a condition is followed
   * by an empty block when its block is not written yet.
   */
  readonly source: string;
};
