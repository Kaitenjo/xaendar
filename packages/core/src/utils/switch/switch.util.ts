import { Function, NoArgsFunction } from '@xaendar/types';
import { _Context } from '../context/context.util';
import { _if } from '../if/if.util';

/**
 * Creates a reactive switch/case structure by converting it into an if/else-if chain
 * and delegating to {@link _if}.
 *
 * Each run evaluates the `expression` function once, and selects the first block one of whose
 * condition values is strictly equal (`===`) to the result, or else the block with
 * `condition: null`, the `default` branch, wherever it is declared. Multiple values per case
 * are supported (e.g. fall-through cases) and matched with `Array.some`.
 *
 * The condition of the first block of the underlying chain makes the selection, since `_if` always evaluates
 * it first, and the others only compare their position with the selected one.
 *
 * Because it delegates to `_if`, the switch benefits from the same optimisation:
 * the active branch is only re-rendered when it actually changes.
 *
 * @param parentNode - The parent HTML element where the conditional structure is applied.
 * @param parentContext - The parent Context object containing all the variables definition from the Parent Closure
 * @param expression - Function that evaluates the switch expression. Called
 *   reactively inside an effect so that signal reads are tracked.
 * @param blocks - Ordered list of case branches. Each entry contains:
 *   - `condition`: array of values to match against the expression result,
 *     or `null` for the default branch.
 *   - `block`: function that applies the branch's side effects and returns
 *     its cleanup functions.
 */
export function _switch(
  parentNode: HTMLElement,
  parentContext: _Context,
  anchor: Comment | null,
  expression: NoArgsFunction<unknown>,
  blocks: Array<{
    condition: unknown[] | null,
    block: Function<[HTMLElement, _Context, Node | null], _Context>
  }>
): void {
  /*
    The expression is evaluated only once per run, inside the effect of `_if`, so that the switch stays reactive:
    the condition of the first block, always evaluated first, makes the selection, and the others only compare
    their position with it. Evaluating it here, once and for all, would freeze the selected case.
  */
  let selected = -1;
  const select = (): number => {
    const value = expression();
    const matching = blocks.findIndex(({ condition }) => condition?.some(candidate => candidate === value));
    return matching !== -1 ? matching : blocks.findIndex(({ condition }) => !condition);
  };

  _if(parentNode, parentContext, anchor, blocks.map(({ block }, index) => ({
    condition: index === 0
      ? () => (selected = select()) === index
      : () => selected === index,
    block
  })));
}
