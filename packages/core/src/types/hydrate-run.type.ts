import type { NoArgsVoidFunction } from '@xaendar/types';
import type { _Context } from './context.type';
import type { HydrateBlock } from './hydrate-block.type';
import type { NodeBlock } from './node-block.type';
import type { RecordedEvents } from './recorded-events.type';

/**
 * A `@hydrate` block while it is rendered (see `_hydrate`): where it is, and how far it got.
 */
export type HydrateRun = {
  /**
   * The parent HTML element the block is rendered into.
   */
  readonly parentNode: HTMLElement;
  /**
   * The context owning the block.
   */
  readonly parentContext: _Context;
  /**
   * The slot of the container of the block in the context owning it (see `_ScopeLayout`): it holds the scope owning the
   * nodes the server rendered until the content adopts them, when the block is at the top of a scope (see
   * `HydrateBlock.track`) and the server rendered some, then the context of the content.
   */
  readonly slot: number;
  /**
   * The block, as the node strategy opened it.
   */
  readonly nodeBlock: NodeBlock;
  /**
   * The triggers and the content.
   */
  readonly block: HydrateBlock;
  /**
   * Disarm the triggers armed, and dispose the effects of the `when` expressions.
   */
  readonly disarms: NoArgsVoidFunction[];
  /**
   * The nodes the server rendered, owned by the context until the content adopts them.
   */
  serverNodes: readonly Node[];
  /**
   * Whether the context owning the block is not destroyed.
   */
  active: boolean;
  /**
   * Whether a trigger fired.
   */
  fired: boolean;
  /**
   * Whether the content adopted the nodes of the server.
   */
  hydrated: boolean;
  /**
   * Whether an event on the content fires the block.
   */
  interaction: boolean;
  /**
   * Whether an event on the content loads its modules.
   */
  prefetchInteraction: boolean;
  /**
   * The events recorded on the content until it is hydrated, if any are.
   */
  recorded?: RecordedEvents;
  /**
   * The load of the modules of the content, once started.
   */
  loaded?: Promise<unknown>;
};
