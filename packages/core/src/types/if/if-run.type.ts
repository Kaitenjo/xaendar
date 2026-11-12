import type { _Context } from '../context.type';
import type { NodeBlock } from '../node-block.type';
import type { BlockConfig } from './block-config.type';

/**
 * An `@if` (or a `@switch`) while it is rendered (see `_if`): where it is, its branches and the one it renders, held by
 * its binding as the argument of its callback. The context of the branch rendered is held by the container of the block
 * (see `_ScopeLayout`).
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
   * The slot of the container of the block in the context owning it, holding the context of the branch rendered.
   */
  readonly slot: number;
  /**
   * The index of the branch rendered, `null` when none is.
   */
  active: number | null;
  /**
   * Whether the first branch was rendered: the first render gets its nodes with the strategy of the context, adopting
   * the ones of the server.
   */
  started: boolean;
};
