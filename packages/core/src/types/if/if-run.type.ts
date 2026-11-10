import type { _Context } from '../../utils/context/context.util';
import type { NodeBlock } from '../node-block.type';
import type { Block } from './block.type';
import type { State } from './state.type';

/**
 * An `@if` (or a `@switch`) while it is rendered (see `_if`): where it is, its branches and the one it renders, held by
 * its effect as the argument of its callback.
 *
 * N.B. Deliberate, to save memory: the state of an `@if` lives in this object, passed to `runIf`, a function declared
 * once at module level, instead of local variables of `_if` captured by an arrow created per `@if`, which would cost a
 * closure and its context for each one. Do not move it back into a closure.
 */
export type IfRun = {
  /**
   * The parent HTML element the branches are rendered into.
   */
  readonly parentNode: HTMLElement;
  /**
   * The context owning the block.
   */
  readonly parentContext: _Context;
  /**
   * The block, as the node strategy opened it.
   */
  readonly nodeBlock: NodeBlock;
  /**
   * The branches, in order.
   */
  readonly blocks: Block[];
  /**
   * Selects the branch to render, reading the conditions of `blocks`: the index of the branch, `null` for none.
   */
  readonly select: (blocks: Block[]) => number | null;
  /**
   * The branch rendered, `undefined` when none is.
   */
  state: State | undefined;
  /**
   * Whether the first branch was rendered: the first render gets its nodes with the strategy of the context, adopting
   * the ones of the server.
   */
  started: boolean;
};
