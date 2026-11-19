import type { _RenderStyling } from './render-styling.type';

/**
 * The binding of the template writing the `class` or the `style` of an element, kept by the element while no state
 * merges the attribute (see `StylingSlot`), so that a host attribute writing a key it has an opinion on finds it: the
 * constant of the binding and the values its expressions computed last.
 */
export type TemplateStyling = {
  /**
   * The binding, a constant of the module of the template.
   */
  readonly site: _RenderStyling;
  /**
   * The values its expressions computed last (see `_setExpressionStyling`): the same value the binding keeps in its slot.
   */
  values: unknown;
};
