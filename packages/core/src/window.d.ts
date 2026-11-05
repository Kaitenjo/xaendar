import type { _EVENT_CONTRACT_KEY } from './costants';
import type { _EventContract } from './types/event-contract.type';

declare global {
  /**
   * The page, holding the event contract until the runtime takes it.
   */
  interface Window {
    /**
     * The event contract, the script `renderToString` writes into the page: `undefined` without it, or once the runtime
     * has taken its events.
     */
    [_EVENT_CONTRACT_KEY]?: _EventContract;
  }
}
