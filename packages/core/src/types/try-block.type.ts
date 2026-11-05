import type { Function } from '@xaendar/types';
import type { _Context } from '../utils/context/context.util';
import type { Block } from './if/block.type';
import type { NodeStrategy } from './node-strategy.type';

/**
 * The content of a `@try` and of its `@catch` (see `_try`).
 */
export type TryBlock = {
  /**
   * Renders the content before the anchor, getting its nodes with the given strategy, and returns the context owning
   * them.
   */
  readonly content: Block['block'];
  /**
   * Renders the `@catch` before the anchor, getting its nodes with the given strategy, with the error the content threw,
   * and returns the context owning them.
   */
  readonly catch: Function<[HTMLElement, _Context, Node | null, NodeStrategy, unknown], _Context>;
};
