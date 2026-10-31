import type { _Context } from '../utils/context/context.util';

/**
 * The rendering of an item of a `@for`: the context of its body, and the function updating the implicit variables it
 * reads when the index of the item changes.
 */
export type ForEntry = {
  /**
   * The context of the body of the item.
   */
  context: _Context;
  /**
   * Updates the implicit variables the body reads, when the index of the item changes.
   */
  update?: (newIndex: number, items: unknown[]) => void;
};
