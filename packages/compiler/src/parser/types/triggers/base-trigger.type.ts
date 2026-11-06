import type { Span } from '../../../types/span.type';

/**
 * What every trigger of a `@defer` and of a `@hydrate` holds.
 */
export type BaseTrigger<TKind extends string> = {
  /**
   * The kind of the trigger.
   */
  kind: TKind;
  /**
   * Where the trigger is written.
   */
  span: Span;
};
