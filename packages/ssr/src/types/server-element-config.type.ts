import type { ServerBindings } from './server-bindings.type';

/**
 * An element whose start tag the server writes through the runtime (`_ssrStartTag`, `_ssrComponent`, `_ssrIsland`,
 * `_ssrClientComponent`): its tag and its bindings.
 *
 * N.B. Deliberate, to save allocations: a constant of the module of the template, written once by the compiler, instead
 * of the arrays and the descriptors the render code would create for every element it writes. Do not build it in the
 * render code.
 */
export type ServerElementConfig = ServerBindings & {
  /**
   * The tag name of the element.
   */
  readonly tagName: string;
};
