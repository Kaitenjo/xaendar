import type { ServerAttribute } from './server-attribute.type';

/**
 * A custom directive the code rendering on the server applies to an element: the descriptor of the client, without the
 * events and the conditional bindings, since the server listens to nothing and binds the properties once.
 */
export type ServerDirective = {
  /**
   * The selector the directive is registered with, as the template writes it.
   */
  readonly selector: string;
  /**
   * The properties of the directive, left out when it binds none.
   */
  readonly attributes?: readonly ServerAttribute[];
};
