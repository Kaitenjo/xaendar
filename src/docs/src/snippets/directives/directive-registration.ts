// tint.directive.ts
/**
 * Registered under its selector by the decorator, when the module is evaluated.
 */
@Directive({ selector: 'exTint' })
export class TintDirective extends CustomDirective<HTMLElement> {}

// The template imports the class, so that the compiler can check the directive and its inputs:
//   @import { TintDirective } from './tint.directive.ts'

// main.ts — the module must also be loaded at runtime, before the first template using it is rendered
import.meta.glob(['./**/*.xd.component.ts', './**/*.directive.ts'], { eager: true });
