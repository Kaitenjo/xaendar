import { _SSR_MARKERS } from '../../costants';
import type { BlockConfig } from '../../types/if/block-config.type';
import { _Context } from '../context/context.util';
import { _if } from '../if/if.util';

/**
 * Renders a `@switch` block: the first `@case`, in order, one of whose values is strictly equal to the value of the
 * expression, or the `@default` when none is, wherever it is written, none when there is no `@default`.
 *
 * The block is a constant of the module of the template (see `BlockConfig`): its expression, a function of the module
 * called with the component and the context, and its cases, each with its values, `null` for the `@default`, and the
 * function rendering it. It renders through `_if`, which selects the case in its binding: the expression is evaluated
 * once per run, and the block follows it whenever a signal or a variable of the template it reads changes.
 *
 * @param parentNode - The parent HTML element where the switch structure is applied.
 * @param parentContext - The context of the scope holding the block, which its expression reads.
 * @param anchor - The node to insert the structure before, `null` to append it.
 * @param config - The expression and the cases of the block, a constant of the module of the template.
 */
export function _switch(parentNode: HTMLElement, parentContext: _Context, anchor: Comment | null, config: BlockConfig): void {
  _if(parentNode, parentContext, anchor, config, _SSR_MARKERS.switch);
}
