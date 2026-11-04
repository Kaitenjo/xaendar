import type { RenderConditionalBinding } from '@xaendar/core';
import type { ServerAttribute } from './server-attribute.type';

/**
 * What a branch of a conditional binding writes on an element on the server: its attributes and its classes, and its
 * nested conditional bindings. Its events and its directives are left out.
 */
export type ServerBindings = {
  /**
   * The attributes and the classes of the branch.
   */
  attributes: ServerAttribute[];
  /**
   * The nested conditional bindings of the branch.
   */
  conditionalBindings: RenderConditionalBinding<ServerBindings>[];
};
