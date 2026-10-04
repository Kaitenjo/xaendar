import { Function, NoArgsFunction } from '@xaendar/types';
import { effect, untracked } from '../../signals';
import { _Context, createAnchor } from '../context/context.util';

/**
 * Represents a single branch of a conditional structure (`if` / `else if` / `else`).
 *
 * @property condition - Function that evaluates the branch condition and returns a boolean.
 *   If absent, the branch is always considered valid (represents the `else` branch).
 * @property block - Function that, when executed, applies the branch's side effects and
 *   returns the list of cleanup (unwatch) functions generated within it.
 */
type Block = {
  condition?: NoArgsFunction<boolean>,
  block: Function<[HTMLElement, _Context, Node | null], _Context>
};

type State = {
  activeBranch: number | null;
  context: _Context
}

/**
 * Creates a reactive conditional structure from a list of branches.
 *
 * Depending on the branches provided, the appropriate evaluation strategy
 * is selected:
 * - a single branch with a condition → simple `if` (see {@link handleIf});
 * - a branch with a condition followed by one without → `if` / `else` (see {@link handleIfElse});
 * - any other chain → `if` / `else if` / ... / `else` (see {@link handleIfElseIf}).
 *
 * The strategy depends on the conditions of the branches and not only on their number:
 * two branches are an `if` / `else if` when both of them declare a condition, and a
 * single branch may have none (e.g. a `@switch` declaring only its `@default`).
 *
 * The evaluation is wrapped in an {@link effect}, so it is automatically re-executed
 * whenever any signal read by the conditions changes. On each re-execution, the current
 * state (which branch is active) and the related cleanup functions are only updated if
 * the active branch has actually changed.
 *
 * @param parentNode - The parent HTML element where the conditional structure is applied.
 * @param parentContext - The parent Context object containing all the variables definition from the Parent Closure
 * @param blocks - Ordered list of conditional branches to evaluate.
 */
export function _if(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, blocks: Block[]): void {
  const anchor = createAnchor('if', parentNode, parentContext, referenceNode);
  
  const [first, second] = blocks;
  let state: State | undefined;
  let fn: (state: State | undefined) => State | undefined;

  if (blocks.length === 1 && first.condition) {
    fn = (state: State | undefined) => handleIf(parentNode, parentContext, first, state, anchor);
  } else if (blocks.length === 2 && first.condition && !second.condition) {
    fn = (state: State | undefined) => handleIfElse(parentNode, parentContext, first, second, state, anchor);
  } else {
    fn = (state: State | undefined) => handleIfElseIf(parentNode, parentContext, blocks, state, anchor);
  }

  const unlistener = effect(() => state = fn(state));
  parentContext.addUnlistener(unlistener);
}

/**
 * Handles the simple `if` case (a single branch with a condition, no `else`).
 *
 * If the condition is true, the branch is activated (state `0`); otherwise, any
 * previously active branch is deactivated by resetting the state to `null` and
 * executing an empty block.
 *
 * @param parentNode - The parent HTML element where the conditional structure is applied.
 * @param parentContext - The parent Context object containing all the variables definition from the Parent Closure
 * @param ifBlock - The `if` branch to evaluate.
 * @param state - The current state (index of the active branch, or `null` if none).
 * @returns The new state and new cleanup functions if the active branch changed,
 *   otherwise `undefined`.
 */
function handleIf(
  parentNode: HTMLElement,
  parentContext: _Context,
  ifBlock: Block,
  state: State | undefined,
  anchor: Comment
): State | undefined {
  if (ifBlock.condition!()) {
    return checkAndUpdateState(parentNode, parentContext, state, 0, ifBlock.block, anchor);
  }

  teardown(parentContext, state);
}

/**
 * Handles the `if` / `else` case (exactly two branches, only the first one with a condition).
 *
 * If the `if` condition is true, the first branch is activated (state `0`); otherwise,
 * the `else` branch is activated (state `1`).
 * 
 * @param parentNode - The parent HTML element where the conditional structure is applied.
 * @param parentContext - The parent Context object containing all the variables definition from the Parent Closure
 * @param ifBlock - The `if` branch to evaluate.
 * @param elseBlock - The `else` branch used when the `if` condition is false.
 * @param state - The current state (index of the active branch, or `null` if none).
 * @returns The new state and new cleanup functions if the active branch changed,
 *   otherwise `undefined`.
 */
function handleIfElse(
  parentNode: HTMLElement,
  parentContext: _Context,
  ifBlock: Block,
  elseBlock: Block,
  state: State | undefined,
  anchor: Comment
): State | undefined {
  return ifBlock.condition!()
    ? checkAndUpdateState(parentNode, parentContext, state, 0, ifBlock.block, anchor)
    : checkAndUpdateState(parentNode, parentContext, state, 1, elseBlock.block, anchor);
}

/**
 * Handles the general case of an `if` / `else if` / ... / `else` chain: any number of branches,
 * each one with or without a condition (e.g. an `if` / `else if` with no `else`).
 *
 * Iterates through the branches in order and activates the first one whose condition is
 * true; a branch without a condition is always considered valid and acts as the final
 * `else`. The state is set to the index of the activated branch.
 * 
 * @param parentNode - The parent HTML element where the conditional structure is applied.
 * @param parentContext - The parent Context object containing all the variables definition from the Parent Closure
 * @param blocks - Ordered list of conditional branches to evaluate.
 * @param state - The current state (index of the active branch, or `null` if none).
 * @returns The new state and new cleanup functions if the active branch changed,
 *   otherwise `undefined`. Also returns `undefined` if no branch matches.
 */
function handleIfElseIf(
  parentNode: HTMLElement,
  parentContext: _Context,
  blocks: Block[],
  state: State | undefined,
  anchor: Comment
): State | undefined {
  for (let i = 0; i < blocks.length; i++) {
    const { condition, block } = blocks[i];
    if (!condition || condition()) {
      return checkAndUpdateState(parentNode, parentContext, state, i, block, anchor);
    }
  }

  teardown(parentContext, state);
}

/**
 * Updates the conditional structure state only when the active branch changes.
 *
 * If `newState` differs from `state`:
 * 1. runs cleanup of the previous branch's functions (see {@link unwatch});
 * 2. executes the new branch's block via {@link Signal.subtle.untrack} to avoid
 *    creating unwanted reactive dependencies during block execution;
 * 3. registers the new cleanup functions in the shared `unwatchFns` array.
 *
 * If the branch has not changed, no operation is performed.
 *
 * @param parentNode - The parent HTML element where the conditional structure is applied.
 * @param parentContext - The parent Context object containing all the variables definition from the Parent Closure
 * @param state - The current state (index of the active branch, or `null` if none).
 * @param newState - The new state to set (index of the branch to activate, or `null`).
 * @param conditionalBlockFn - Branch function to execute, which returns its own
 *   cleanup functions.
 * @returns The updated state if the active branch changed, or `undefined` if the branch
 *   is unchanged.
 */
function checkAndUpdateState(
  parentNode: HTMLElement,
  parentContext: _Context,
  state: State | undefined,
  newState: number | null,
  conditionalBlockFn: Function<[HTMLElement, _Context, Node | null], _Context>,
  anchor: Comment
): State | undefined {
 if (state?.activeBranch === newState) {
    return state;
  }

  if (state) {
    untracked(() => state.context.clear());
    parentContext.removeChild(state.context);
  }

  const context = untracked(() => conditionalBlockFn(parentNode, parentContext, anchor));
  parentContext.addChild(context);

  return { 
    activeBranch: newState, 
    context 
  };
}

/**
 * Handles the case where no branch condition matched: tears down the previously
 * active branch, if one existed, by unlistening its context (running cleanup
 * functions and destroying its subtree) and detaching it from the parent context.
 * A no-op if no branch was previously active.
 *
 * @param parentContext - The parent Context from which the previous branch's
 *   context should be detached.
 * @param state - The current state (active branch index and its context), or
 *   `undefined` if no branch is currently active.
 */
function teardown(parentContext: _Context, state: State | undefined): void {
  if (state) {
    untracked(() => state.context.clear());
    parentContext.removeChild(state.context);
  }
}