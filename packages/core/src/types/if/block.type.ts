import type { Function } from '@xaendar/types';
import type { _Context } from '../context.type';
import type { NodeStrategy } from '../node-strategy.type';

/**
 * A part of a block rendered in a context of its own (the content of a `@try`, of a `@hydrate`, of a `@client`, the
 * parts of a `@defer`): what renders it.
 */
export type Block = {
  /**
   * Renders the part before the anchor, getting its nodes with the given strategy, and returns the context owning them:
   * a function of the module of the template, called as it is.
   */
  readonly block: Function<[HTMLElement, _Context, Node | null, NodeStrategy], _Context>;
};
