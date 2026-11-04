import type { _ComponentRuntime } from '@xaendar/core';

/**
 * The runtime of a page rendered on the server.
 */
export type ServerRuntime = _ComponentRuntime & {
  /**
   * The events the components of the page listen to, collected while they render: the event contract of the page
   * records them.
   */
  readonly events: Set<string>;
};
