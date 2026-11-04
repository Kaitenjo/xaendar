import type { NoArgsFunction, Function } from '@xaendar/types';
import type { _Context } from '../../utils/context/context.util';
import type { NodeStrategy } from '../node-strategy.type';

/**
 * Represents a single branch of a conditional structure (`if` / `else if` / `else`).
 *
 * @property condition - Function that evaluates the branch condition and returns a boolean.
 *   If absent, the branch is always considered valid (represents the `else` branch).
 * @property block - Function that, when executed, renders the branch before the anchor, getting its nodes with the
 *   given strategy, and returns the context owning them.
 */
export type Block = {
  condition?: NoArgsFunction<boolean>,
  block: Function<[HTMLElement, _Context, Node | null, NodeStrategy], _Context>
};
