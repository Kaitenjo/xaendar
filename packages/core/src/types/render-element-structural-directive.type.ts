import type { RenderElementDirective } from './render-element-directive.type';

/**
 * Describes a single structural directive to be applied to a rendered element, deciding whether the element is rendered at all,
 * e.g. `<div @@selector(name="value") />`.
 *
 * A structural directive only binds its properties: it listens to no event, since it holds no element to dispatch them on,
 * and it declares no conditional binding of its own.
 */
export type RenderElementStructuralDirective = Pick<RenderElementDirective, 'selector' | 'attributes'>;
