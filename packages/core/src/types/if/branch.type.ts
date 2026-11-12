import type { Function } from '@xaendar/types';
import type { _Context } from '../context.type';
import type { InlineBranch } from '../inline-branch.type';
import type { NodeStrategy } from '../node-strategy.type';

/**
 * A branch of an `@if` or a `@switch` block (see `BlockConfig`), beside what selects it: what renders its content, and,
 * for a branch rendered inline, the slots it fills (see `InlineBranch`).
 */
export type Branch = Partial<InlineBranch> & {
  /**
   * Renders the branch before the anchor, getting its nodes with the given strategy: a function of the module of the
   * template, called as it is. It returns the context owning them, or, rendered inline, renders them into the context
   * holding the block, returning nothing.
   */
  readonly block: Function<[HTMLElement, _Context, Node | null, NodeStrategy], _Context | undefined>;
};
