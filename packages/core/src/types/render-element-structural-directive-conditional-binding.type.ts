import type { RenderElementStructuralDirective } from './render-element-structural-directive.type';
import type { RenderConditionalBinding } from './render-conditional-binding.type';

/**
 * Describes a single conditional binding applying structural directives to a rendered element only while one of its branches is selected.
 *
 * Unlike the other bindings of the element, it lives as long as the place the element is rendered in, not as long as the element:
 * the element is created and destroyed according to the structural directives it applies.
 */
export type RenderElementStructuralDirectiveConditionalBinding = RenderConditionalBinding<{
  /**
   * The list of structural directives deciding whether the element is rendered while the branch is selected.
   */
  structuralDirectives: RenderElementStructuralDirective[],
  /**
   * The list of nested conditional bindings applying structural directives while the branch is selected.
   */
  conditionalBindings: RenderElementStructuralDirectiveConditionalBinding[]
}>
