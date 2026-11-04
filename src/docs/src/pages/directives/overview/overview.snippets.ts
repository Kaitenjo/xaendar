import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `directive-registration.ts`, shown by the page directives/overview and the API reference of core.
 */
export const DIRECTIVE_REGISTRATION: SourceFile = {
  name: 'directive-registration.ts',
  lang: 'ts',
  code: `// tint.directive.ts
/**
 * Registered under its selector by the decorator, when the module is evaluated.
 */
@Directive({ selector: 'exTint' })
export class TintDirective extends CustomDirective<HTMLElement> {}

// The template imports the class: the compiler checks the directive and its inputs, and the module of the template
// loads it before the template is rendered:
//   @import { TintDirective } from './tint.directive.ts'`
};
