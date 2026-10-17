// tint.directive.ts
/**
 * Registered under its selector by the decorator, when the module is evaluated.
 */
@Directive({ selector: 'exTint' })
export class TintDirective extends CustomDirective<HTMLElement> {}

// The template imports the class: the compiler checks the directive and its inputs, and the module of the template
// loads it before the template is rendered:
//   @import { TintDirective } from './tint.directive.ts'
