import { RenderElementDirective } from './render-element-directive.type';

/**
 * Describes a single directive to be applied to a rendered element, e.g. `<div @@selector(name="value" (event)="handler()") />`.
 */
export type RenderElementStructuralDirective = Omit<RenderElementDirective, 'conditionalBindings'>
