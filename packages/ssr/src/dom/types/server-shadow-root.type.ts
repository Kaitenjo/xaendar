import type { ServerHTMLElement } from '../server-html-element/server-html-element';

/**
 * The shadow root a component of the server DOM attaches: the server renders its content as a declarative shadow root.
 */
export type ServerShadowRoot = {
  /**
   * The element the shadow root is attached to.
   */
  readonly host: ServerHTMLElement;
  /**
   * The mode of the shadow root.
   */
  readonly mode: ShadowRootMode;
  /**
   * The stylesheets adopted by the shadow root, which the server never reads.
   */
  adoptedStyleSheets: unknown[];
};
