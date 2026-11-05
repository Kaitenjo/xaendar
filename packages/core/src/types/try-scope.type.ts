import type { _Context } from '../utils/context/context.util';

/**
 * A `@try` rendering its content for the first time, along with the code of the components the content creates: the
 * contexts created meanwhile, so that the ones a throw leaves behind, not registered in their parent yet, can be disposed.
 */
export type TryScope = {
  /**
   * The contexts created so far, in creation order.
   */
  readonly contexts: _Context[];
  /**
   * The `@try` holding this one, which collects the same contexts.
   */
  readonly outer: TryScope | undefined;
};
