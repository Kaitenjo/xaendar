import type { RenderConditionalBinding } from '@xaendar/core';
import type { ServerAttribute } from './server-attribute.type';
import type { ServerDirective } from './server-directive.type';

/**
 * What a branch of a conditional binding writes on an element on the server: its attributes and its classes, the
 * custom directives it applies, and its nested conditional bindings. Its events are left out.
 */
export type ServerBindings = {
  /**
   * The attributes and the classes of the branch.
   */
  attributes: ServerAttribute[];
  /**
   * The custom directives the branch applies, if any: only the ones of an element other than a component run.
   */
  directives?: ServerDirective[];
  /**
   * The nested conditional bindings of the branch.
   */
  conditionalBindings: RenderConditionalBinding<ServerBindings>[];
};
