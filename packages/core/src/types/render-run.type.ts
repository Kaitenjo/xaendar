import type { NoArgsFunction } from '@xaendar/types';
import type { _Context } from '../utils/context/context.util';
import type { _Template } from './template.type';

/**
 * A `@render` while it is rendered (see `_renderTemplate`): where it is, the template, the arguments and the instance it
 * renders, held by its binding as the argument of its callback.
 *
 * N.B. Deliberate, to save memory: the state of a `@render` lives in this object, passed to a function declared once at
 * module level, instead of local variables captured by an arrow created per `@render`, which would cost a closure and its
 * context for each one, in every row of a table rendering a template. Do not move it back into a closure.
 */
export type RenderRun = {
  /**
   * The element the instance is rendered into.
   */
  readonly parentNode: Element;
  /**
   * The context rendering the instance, which owns it.
   */
  readonly parentContext: _Context;
  /**
   * The node the instance is rendered before, `null` to append it.
   */
  readonly referenceNode: Comment | null;
  /**
   * The template.
   */
  readonly template: _Template;
  /**
   * The functions computing the arguments, one for each parameter passed.
   */
  readonly args: NoArgsFunction<unknown>[];
  /**
   * Whether the server wrote `<!---->` before the instance, as it does after a text.
   */
  readonly separated: boolean;
  /**
   * The context of the instance, `null` until it is rendered.
   */
  instance: _Context | null;
};
