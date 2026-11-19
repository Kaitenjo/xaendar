import type { Span } from '../../types/span.type';

/**
 * Where the name of a trigger of a `@defer` or of a `@hydrate`, or the name of a parameter of a `@placeholder` or of a
 * `@loading`, is being written, between the parentheses of the block.
 */
export type TriggerContext = {
  /**
   * The names that can be written there: the triggers the block takes and are not written yet in the same list, with
   * `never` only alone and never after `prefetch`, then `when` and, outside of the triggers following it, `prefetch`; or
   * the parameters of the block not written yet.
   */
  readonly names: ReadonlyArray<'load' | 'idle' | 'timer' | 'visible' | 'interaction' | 'hover' | 'never' | 'when' | 'prefetch' | 'minimum' | 'after'>;
  /**
   * The span of the part of the name written so far.
   */
  readonly span: Span;
};
