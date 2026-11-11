import type { TemplateHandler } from './template-handler.type';

/**
 * Describes a single DOM event listener to be attached to a rendered element: a constant of the module of the template,
 * shared by every element it describes (see `TemplateListener`).
 */
export type RenderElementEvent = {
  /**
   * The DOM event name (e.g. `click`, `input`).
   */
  readonly name: string;
  /**
   * The handler: makes the call written in the template, receiving the event as `$event` (see `TemplateHandler`).
   */
  readonly handler: TemplateHandler;
};
