import type { RenderConditionalBinding } from '@xaendar/core';
import type { ServerAttribute } from './server-attribute.type';
import type { ServerDirective } from './server-directive.type';

/**
 * What an element, or a branch of one of its conditional bindings, writes on the server: its attributes and its
 * classes, the custom directives it applies, and its nested conditional bindings, the lists it does not declare left
 * out. Its events are left out. A constant of the module of the template, which the runtime only reads.
 */
export type ServerBindings = {
  /**
   * The attributes and the classes.
   */
  readonly attributes?: readonly ServerAttribute[];
  /**
   * The custom directives applied, if any: only the ones of an element other than a component run.
   */
  readonly directives?: readonly ServerDirective[];
  /**
   * The nested conditional bindings.
   */
  readonly conditionalBindings?: ReadonlyArray<RenderConditionalBinding<ServerBindings>>;
};
