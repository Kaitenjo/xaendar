import { _SSR_MARKERS, BRANCH, CONTENT, POSITION } from '../../costants';
import { untracked } from '../../signals';
import { _bindSite } from '../../signals/effect/effect';
import type { _Context } from '../../types/context.type';
import type { Branch } from '../../types/if/branch.type';
import type { BlockConfig } from '../../types/if/block-config.type';
import type { InlineBranch } from '../../types/inline-branch.type';
import type { NodeBlock } from '../../types/node-block.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import { blockAnchor, blockParent, clear, clearInline, containerSlot, getNodeStrategy, renderInline } from '../context/context.util';
import { _selectBranchIndex } from '../select-branch/select-branch.util';

/**
 * The block an `@if` opened, read by its first run, which adopts the nodes of the server (see {@link showBranch}).
 *
 * N.B. Deliberate, to save memory: the first run is synchronous, inside `_if`, so the block travels through a variable
 * of the module, set by `_if` and read at once, instead of the state of the block: what it says of the server (the
 * detail of its marker) is read only by the first run, and its anchor is kept in the container. Do not keep the block.
 */
let openedBlock: NodeBlock | null = null;

/**
 * Renders an `@if` / `@else if` / `@else` chain: the first branch, in order, whose condition holds, none when no
 * condition holds and there is no `@else`.
 *
 * The chain is a constant of the module of the template (see `BlockConfig`), whose conditions are functions of the
 * module called with the component and the context. The evaluation is a binding (see `_bindSite`), so it is
 * automatically re-executed whenever any signal or variable of the template read by the conditions changes. On each
 * re-execution, the current state (which branch is active) and the related cleanup functions are only updated if the
 * active branch has actually changed.
 *
 * The state of the block lives in its container (see `CONTAINER_SLOTS`): the branch rendered, the index of that branch,
 * `-1` until the first run, and its anchor, or the node it renders into when it is the last node of its parent. A branch
 * declaring no variable and rendering no block is rendered inline into the context holding the block (see
 * `InlineBranch`), any other one in a context of its own.
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
  const block = getNodeStrategy(parentContext).block(parentContext, parentNode, referenceNode, 'if', kind, config.last, config.slot);
  const container = containerSlot(parentContext, config.container);
  parentContext[container + BRANCH] = -1;
  parentContext[container + POSITION] = block.anchor ?? parentNode;
  openedBlock = block;
  try {
    _bindSite(parentContext, config, undefined, _runIf);
  } finally {
    openedBlock = null;
  }
}

/**
 * Selects the branch of an `@if` and renders it: the callback of the binding of {@link _if}, shared by every `@if`. Only
 * the conditions are tracked. The compiler names it in the binding.
 *
 * @param context - The context holding the block.
 * @param _target - Unused: the block keeps its state in its container.
 * @param config - The block.
 */
export function _runIf(context: _Context, _target: unknown, config: BlockConfig): void {
  // The @default of a @switch holds only when no @case does, wherever it is written
  const index = _selectBranchIndex(config, context, true);
  const selected = index === -1 ? null : index;
  untracked(() => showBranch(context, config, selected));
}

/**
 * Renders the branch selected, when it is not the one rendered already. The first render, run synchronously by
 * {@link _if}, gets its nodes with the strategy of the context: in a hydration, it adopts the ones of the server.
 *
 * @param context - The context holding the block.
 * @param config - The block.
 * @param selected - The index of the branch to render, `null` to render none.
 */
function showBranch(context: _Context, config: BlockConfig, selected: number | null): void {
  const container = containerSlot(context, config.container);
  const active = context[container + BRANCH] as number | null;
  if (active === -1) {
    const block = openedBlock!;
    openedBlock = null;
    const nodeStrategy = getNodeStrategy(context);
    const parentNode = blockParent(context[container + POSITION] as Node);
    // The marker of the server holds the index of the branch it rendered, none when it rendered none
    renderBranch(context, config, container, selected, nodeStrategy.adopt(parentNode, block, selected === null ? '' : `${selected}`));
    nodeStrategy.close(parentNode, block);
  } else if (active !== selected) {
    renderBranch(context, config, container, selected, getNodeStrategy(context));
  }
}

/**
 * Destroys the active branch, if any, and renders the selected one, if any, getting its nodes with a strategy: its
 * context, or the branch itself when it renders inline, is held by the container of the block.
 *
 * @param context - The context holding the block.
 * @param config - The block.
 * @param container - The first slot of the container of the block.
 * @param selected - The index of the branch to render, `null` to render none.
 * @param nodeStrategy - The strategy the branch gets its nodes with.
 */
function renderBranch(context: _Context, config: BlockConfig, container: number, selected: number | null, nodeStrategy: NodeStrategy): void {
  const position = context[container + POSITION] as Node;
  const parentNode = blockParent(position) as HTMLElement;
  const shown = context[container + CONTENT] as _Context | InlineBranch | null | undefined;
  if (Array.isArray(shown)) {
    clear(shown);
  } else if (shown) {
    clearInline(context, shown, true, parentNode);
  }

  context[container + BRANCH] = selected;
  context[container + CONTENT] = null;
  if (selected === null) {
    return;
  }

  const branch: Branch = config.branches[selected];
  const anchor = blockAnchor(position);
  if (branch.base === undefined) {
    context[container + CONTENT] = branch.block(parentNode, context, anchor, nodeStrategy);
  } else {
    // Held before it renders, so that clearing the context empties what a render failing halfway leaves
    context[container + CONTENT] = branch;
    renderInline(context, branch as Branch & InlineBranch, parentNode, anchor, nodeStrategy);
  }
}
