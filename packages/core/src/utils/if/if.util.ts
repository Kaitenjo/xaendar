import { _SSR_MARKERS } from '../../costants';
import { untracked } from '../../signals';
import { _bindEffect } from '../../signals/effect/effect';
import type { BlockConfig } from '../../types/if/block-config.type';
import type { IfRun } from '../../types/if/if-run.type';
import type { State } from '../../types/if/state.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { _Context } from '../../types/context.type';
import { addChild, clear, getNodeStrategy, removeChild } from '../context/context.util';
import { _selectBranchIndex } from '../select-branch/select-branch.util';

/**
 * Renders an `@if` / `@else if` / `@else` chain: the first branch, in order, whose condition holds, none when no
 * condition holds and there is no `@else`.
 *
 * The chain is a constant of the module of the template (see `BlockConfig`), whose conditions are functions of the
 * module called with the component and the context. The evaluation is a binding (see `_bindEffect`), so it is
 * automatically re-executed whenever any signal or variable of the template read by the conditions changes. On each
 * re-execution, the current state (which branch is active) and the related cleanup functions are only updated if the
 * active branch has actually changed.
 *
 * The first render gets its nodes with the strategy of the context: in the hydration of a component, the branch the
 * server rendered is adopted when the browser selects the same one, while a block the server rendered with another
 * branch is emptied, with a warning, and the branch created. Every later render reads the strategy of the context
 * again: once the hydration ends, the one creating the nodes.
 *
 * @param parentNode - The parent HTML element where the conditional structure is applied.
 * @param parentContext - The context of the scope holding the chain, which its conditions read.
 * @param referenceNode - The node to insert the structure before, `null` to append it.
 * @param config - The branches of the chain, a constant of the module of the template.
 * @param kind - The marker the server writes around the structure: the one of `@if`, or of `@switch`, which renders
 *   through it.
 */
export function _if(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, config: BlockConfig, kind: string = _SSR_MARKERS.if): void {
  const nodeBlock = getNodeStrategy(parentContext).block(parentContext, parentNode, referenceNode, 'if', kind, config.last, config.slot);
  const run: IfRun = {
    parentNode, parentContext,
    nodeBlock, config,
    state: undefined,
    started: false
  };

  _bindEffect(parentContext, runIf, run, undefined, undefined, config.reads);
}

/**
 * Selects the branch of an `@if` and renders it: the callback of the binding of {@link _if}, shared by every `@if`. Only
 * the conditions are tracked.
 *
 * @param run - The `@if`.
 */
function runIf(run: IfRun): void {
  // The @default of a @switch holds only when no @case does, wherever it is written
  const index = _selectBranchIndex(run.config, run.parentContext, true);
  const selected = index === -1 ? null : index;
  untracked(() => showBranch(run, selected));
}

/**
 * Renders the branch selected, when it is not the one rendered already. The first render, run synchronously by
 * {@link _if}, gets its nodes with the strategy of the context: in a hydration, it adopts the ones of the server.
 *
 * @param run - The `@if`.
 * @param selected - The index of the branch to render, `null` to render none.
 */
function showBranch(run: IfRun, selected: number | null): void {
  const { parentNode, parentContext, nodeBlock, config, state } = run;
  if (!run.started) {
    run.started = true;
    const nodeStrategy = getNodeStrategy(parentContext);
    // The marker of the server holds the index of the branch it rendered, none when it rendered none
    run.state = renderBranch(parentNode, parentContext, nodeBlock.anchor, config, state, selected, nodeStrategy.adopt(parentNode, nodeBlock, selected === null ? '' : `${selected}`));
    nodeStrategy.close(parentNode, nodeBlock);
  } else if ((state?.activeBranch ?? null) !== selected) {
    run.state = renderBranch(parentNode, parentContext, nodeBlock.anchor, config, state, selected, getNodeStrategy(parentContext));
  }
}

/**
 * Destroys the active branch, if any, and renders the selected one, if any, getting its nodes with a strategy.
 *
 * @param parentNode - The parent HTML element the branch is rendered into.
 * @param parentContext - The context owning the block.
 * @param anchor - The node to insert the branch before, `null` to append it.
 * @param config - The branches.
 * @param state - The active branch, `undefined` when none is.
 * @param selected - The index of the branch to render, `null` to render none.
 * @param nodeStrategy - The strategy the branch gets its nodes with.
 * @returns The branch rendered, `undefined` when none is.
 */
function renderBranch(parentNode: HTMLElement, parentContext: _Context, anchor: Comment | null, config: BlockConfig, state: State | undefined, selected: number | null, nodeStrategy: NodeStrategy): State | undefined {
  if (state) {
    clear(state.context);
    removeChild(parentContext, state.context);
  }

  if (selected === null) {
    return undefined;
  }

  const context = config.branches[selected].block(parentNode, parentContext, anchor, nodeStrategy);
  addChild(parentContext, context);
  return { activeBranch: selected, context };
}
