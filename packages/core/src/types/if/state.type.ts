import type { _Context } from '../../utils/context/context.util';

/**
 * The state of an `@if`: the branch it renders, `null` when it renders none, and the context of that branch.
 */
export type State = {
  /**
   * The index of the branch rendered, `null` when none is.
   */
  activeBranch: number | null;
  /**
   * The context of the branch rendered.
   */
  context: _Context
}
