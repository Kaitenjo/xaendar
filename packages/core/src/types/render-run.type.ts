import type { _Context } from '../utils/context/context.util';
import type { RenderTemplateConfig } from './render-template-config.type';
import type { _Template } from './template.type';

/**
 * A `@render` while it is rendered (see `_renderTemplate`): where it renders, the template, the scope declaring it, and
 * the instance it rendered, held by its binding as the argument of its callback.
 *
 * N.B. Deliberate, to save memory: the state of a `@render` lives in this object, passed to a function declared once at
 * module level, instead of local variables captured by an arrow created per `@render`. Do not move it into a closure.
 */
export type RenderRun = {
  /**
   * The element the instance is rendered into.
   */
  readonly parentNode: Element;
  /**
   * The context rendering the instance, which owns it and which the arguments read.
   */
  readonly parentContext: _Context;
  /**
   * The node the instance is rendered before, `null` to append it.
   */
  readonly referenceNode: Comment | null;
  /**
   * The `@render`, a constant of the module of the template.
   */
  readonly config: RenderTemplateConfig;
  /**
   * The context of the scope declaring the template, the parent of the context of the instance.
   */
  readonly owner: _Context;
  /**
   * The template.
   */
  readonly template: _Template;
  /**
   * The instance rendered, `null` before the first run.
   */
  instance: _Context | null;
};
