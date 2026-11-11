import type { _Context } from '../../utils/context/context.util';
import type { NodeBlock } from '../node-block.type';
import type { BlockConfig } from './block-config.type';
import type { State } from './state.type';

/**
 * An `@if` (or a `@switch`) while it is rendered (see `_if`): where it is, its branches and the one it renders, held by
 * its binding as the argument of its callback.
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
   * The context owning the block, which the conditions read.
   */
  readonly parentContext: _Context;
  /**
   * The block, as the node strategy opened it.
   */
  readonly nodeBlock: NodeBlock;
  /**
   * The branches and what selects them, a constant of the module of the template.
   */
  readonly config: BlockConfig;
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
