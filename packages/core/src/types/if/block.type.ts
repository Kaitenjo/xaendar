import type { NoArgsFunction, Function } from '@xaendar/types';
import type { _Context } from '../../utils/context/context.util';

/**
 * Represents a single branch of a conditional structure (`if` / `else if` / `else`).
 *
 * @property condition - Function that evaluates the branch condition and returns a boolean.
 *   If absent, the branch is always considered valid (represents the `else` branch).
 * @property block - Function that, when executed, applies the branch's side effects and
 *   returns the list of cleanup (unwatch) functions generated within it.
 */
export type Block = {
  condition?: NoArgsFunction<boolean>,
  block: Function<[HTMLElement, _Context, Node | null], _Context>
};
