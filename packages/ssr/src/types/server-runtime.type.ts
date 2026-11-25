import type { _ComponentRuntime } from '@xaendar/core';
import type { ServerStyles } from './server-styles.type';

/**
 * The runtime of a page rendered on the server.
 */
export type ServerRuntime = _ComponentRuntime & {
  /**
   * The events the components of the page listen to, collected while they render: the event contract of the page
   * records them.
   */
  readonly events: Set<string>;
  /**
   * The nonce of the `Content-Security-Policy` of the response, written on the script of the event contract and on the
   * `<style>` elements of the page, if any.
   */
  readonly nonce: string | undefined;
  /**
   * The inline styles of the tree whose elements are being written: the ones of the declarative shadow root rendering,
   * or the ones of the page around its root.
   */
  styles: ServerStyles;
};
