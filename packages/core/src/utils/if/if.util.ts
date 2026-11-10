import { _SSR_MARKERS } from '../../costants';
import { untracked } from '../../signals';
import { _bindEffect } from '../../signals/effect/effect';
import type { Block } from '../../types/if/block.type';
import type { IfRun } from '../../types/if/if-run.type';
import type { State } from '../../types/if/state.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import { _Context } from '../context/context.util';

/**
 * Creates a reactive conditional structure from a list of branches.
 *
 * Depending on the branches provided, the appropriate evaluation strategy
 * is selected:
 * - a single branch with a condition → simple `if` (see {@link selectIf});
 * - a branch with a condition followed by one without → `if` / `else` (see {@link selectIfElse});
 * - any other chain → `if` / `else if` / ... / `else` (see {@link selectIfElseIf}).
 *
 * The strategy depends on the conditions of the branches and not only on their number:
 * two branches are an `if` / `else if` when both of them declare a condition, and a
 * single branch may have none (e.g. a `@switch` declaring only its `@default`).
 *
 * The evaluation is wrapped in an effect, so it is automatically re-executed
 * whenever any signal read by the conditions changes. On each re-execution, the current
 * state (which branch is active) and the related cleanup functions are only updated if
 * the active branch has actually changed.
 *
 * The first render gets its nodes with the strategy of the context: in the hydration of a component, the branch the
 * server rendered is adopted when the browser selects the same one, while a block the server rendered with another
 * branch is emptied, with a warning, and the branch created. Every later render reads the strategy of the context
 * again: once the hydration ends, the one creating the nodes.
 *
 * @param parentNode - The parent HTML element where the conditional structure is applied.
 * @param parentContext - The parent Context object containing all the variables definition from the Parent Closure
 * @param referenceNode - The node to insert the structure before, `null` to append it.
 * @param blocks - Ordered list of conditional branches to evaluate.
 * @param kind - The marker the server writes around the structure: the one of `@if`, or of `@switch`, which renders
 *   through it.
 */
export function _if(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, blocks: Block[], kind: string = _SSR_MARKERS.if): void {
  const nodeBlock = parentContext.nodeStrategy.block(parentContext, parentNode, referenceNode, 'if', kind);
  const [first, second] = blocks;
  let select: IfRun['select'];

  if (blocks.length === 1 && first.condition) {
    select = selectIf;
  } else if (blocks.length === 2 && first.condition && !second.condition) {
    select = selectIfElse;
  } else {
    select = selectIfElseIf;
  }

  const run: IfRun = { 
    parentNode, parentContext, 
    nodeBlock, blocks, 
    select, 
    state: undefined, 
    started: false 
  };
  
  _bindEffect(parentContext, runIf, run);
}

/**
 * Selects the branch of an `@if` and renders it: the callback of the effect of {@link _if}, shared by every `@if`. Only
 * the conditions are tracked.
 *
 * @param run - The `@if`.
 */
function runIf(run: IfRun): void {
  const selected = run.select(run.blocks);
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
  const { parentNode, parentContext, nodeBlock, blocks, state } = run;
  if (!run.started) {
    run.started = true;
    const { nodeStrategy } = parentContext;
    // The marker of the server holds the index of the branch it rendered, none when it rendered none
    run.state = renderBranch(parentNode, parentContext, nodeBlock.anchor, blocks, state, selected, nodeStrategy.adopt(parentNode, nodeBlock, selected === null ? '' : `${selected}`));
    nodeStrategy.close(parentNode, nodeBlock);
  } else if ((state?.activeBranch ?? null) !== selected) {
    run.state = renderBranch(parentNode, parentContext, nodeBlock.anchor, blocks, state, selected, parentContext.nodeStrategy);
  }
}

/**
 * Destroys the active branch, if any, and renders the selected one, if any, getting its nodes with a strategy.
 *
 * @param parentNode - The parent HTML element the branch is rendered into.
 * @param parentContext - The context owning the block.
 * @param anchor - The node to insert the branch before.
 * @param blocks - The branches.
 * @param state - The active branch, `undefined` when none is.
 * @param selected - The index of the branch to render, `null` to render none.
 * @param nodeStrategy - The strategy the branch gets its nodes with.
 * @returns The branch rendered, `undefined` when none is.
 */
function renderBranch(parentNode: HTMLElement, parentContext: _Context, anchor: Comment, blocks: Block[], state: State | undefined, selected: number | null, nodeStrategy: NodeStrategy): State | undefined {
  if (state) {
    state.context.clear();
    parentContext.removeChild(state.context);
  }

  if (selected === null) {
    return undefined;
  }

  const context = blocks[selected].block(parentNode, parentContext, anchor, nodeStrategy);
  parentContext.addChild(context);
  return { activeBranch: selected, context };
}

/**
 * Selects the branch of a simple `if` (a single branch with a condition, no `else`).
 *
 * @param blocks - The branches: the `if` branch only.
 * @returns `0` when its condition holds, `null` otherwise.
 */
function selectIf(blocks: Block[]): number | null {
  return blocks[0].condition!() ? 0 : null;
}

/**
 * Selects the branch of an `if` / `else` (exactly two branches, only the first one with a condition).
 *
 * @param blocks - The branches: the `if` branch and the `else` one.
 * @returns `0` when the condition of the `if` holds, `1`, the `else`, otherwise.
 */
function selectIfElse(blocks: Block[]): number {
  return blocks[0].condition!() ? 0 : 1;
}

/**
 * Selects the branch of an `if` / `else if` / ... / `else` chain: any number of branches, each one with or without a
 * condition (e.g. an `if` / `else if` with no `else`). The first branch whose condition holds is selected; a branch
 * without a condition always holds, and acts as the final `else`.
 *
 * @param blocks - Ordered list of conditional branches to evaluate.
 * @returns The index of the selected branch, `null` when no branch holds.
 */
function selectIfElseIf(blocks: Block[]): number | null {
  for (let i = 0; i < blocks.length; i++) {
    const { condition } = blocks[i];
    if (!condition || condition()) {
      return i;
    }
  }

  return null;
}
