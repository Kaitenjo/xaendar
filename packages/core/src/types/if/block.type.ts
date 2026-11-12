import type { Function } from '@xaendar/types';
import type { _Context } from '../context.type';
import type { NodeStrategy } from '../node-strategy.type';

/**
 * A branch of an `@if` or a `@switch` block (see `BlockConfig`), beside what selects it: what renders its content.
 */
export type Block = {
  /**
   * Renders the branch before the anchor, getting its nodes with the given strategy, and returns the context owning
   * them: a function of the module of the template, called as it is.
   */
  readonly block: Function<[HTMLElement, _Context, Node | null, NodeStrategy], _Context>;
};
