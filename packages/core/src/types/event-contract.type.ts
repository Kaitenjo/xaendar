import type { NoArgsVoidFunction } from '@xaendar/types';

/**
 * An event the contract recorded.
 */
export type _ContractEvent = {
  /**
   * The event.
   */
  readonly event: Event,
  /**
   * The node it was dispatched on, inside the shadow roots too.
   */
  readonly target: EventTarget,
  /**
   * The nodes it went through, read while it was dispatched: the path of an event is empty afterwards.
   */
  readonly path: readonly EventTarget[]
};

/**
 * What the event contract, the script `renderToString` writes into the page, leaves on `window` for the runtime: the
 * events the user generated before the runtime was there.
 */
export type _EventContract = {
  /**
   * The events, in the order they happened.
   */
  readonly events: _ContractEvent[],
  /**
   * Removes each one of the listeners of the contract.
   */
  readonly stops: NoArgsVoidFunction[]
};
