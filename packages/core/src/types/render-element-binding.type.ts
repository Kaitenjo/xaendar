import type { RenderElementAttribute } from './render-element-attribute.type';
import type { _RenderStyling } from './styling/render-styling.type';

/**
 * A binding of an element a template renders, or of a branch of one of its conditional bindings: an attribute or an
 * input (see `RenderElementAttribute`), or its `class` or its `style` (see `_RenderStyling`), each applied by its setter.
 */
export type _RenderElementBinding = RenderElementAttribute | _RenderStyling;
