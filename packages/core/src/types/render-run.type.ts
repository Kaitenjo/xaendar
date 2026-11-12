import type { _Context } from './context.type';
import type { RenderTemplateConfig } from './render-template-config.type';

/**
 * A `@render` while it is rendered (see `_renderTemplate`): where it renders, the scope declaring the template, and
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
   * The slot of the container of the `@render` in the context rendering the instance (see `_ScopeLayout`), holding the
   * context of the instance, `null` before the first run.
   */
  readonly slot: number;
};
