import type { _Context } from './context.type';
import type { RenderElementDirective } from './render-element-directive.type';

/**
 * An element whose conditional bindings are being applied (see `_renderElement`), the target of their branches: a
 * branch selected before the element is mounted applies its attributes and its listeners at once, and its directives
 * once the element is mounted, as the directives of the element are.
 *
 * N.B. Deliberate, to save memory: created only for an element declaring conditional bindings, it holds what an arrow
 * created per element would capture. Do not replace it with a closure.
 */
export type ElementBinding = {
  /**
   * The element.
   */
  readonly element: Element;
  /**
   * Whether the element is mounted: from then on, a branch applies its directives at once.
   */
  mounted: boolean;
  /**
   * The directives of the branches selected before the element is mounted, each with the context of its branch, applied
   * once it is: `null` while there are none.
   */
  pending: Array<readonly [context: _Context, directives: readonly RenderElementDirective[]]> | null;
};
