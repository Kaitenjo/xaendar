import type { _RenderElementTemplate } from '@xaendar/core';
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
  /**
   * The templates written among the children of the element of a component, the functions writing them, passed to the
   * component before it renders (see `_setContentTemplates` of core). Left out when there are none.
   */
  readonly templates?: readonly _RenderElementTemplate[];
};
