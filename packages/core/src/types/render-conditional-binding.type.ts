import type { NoArgsFunction } from '@xaendar/types'
import type { RenderElementAttribute } from './render-element-attribute.type'
import type { RenderElementDirective } from './render-element-directive.type'
import type { RenderElementEvent } from './render-element-event.type'
import type { RenderElementStructuralDirective } from './render-element-structural-directive.type'

/**
 * Describes a conditional binding: a list of mutually exclusive branches, each one holding
 * the bindings applied only while it is the selected one.
 *
 * The selected branch is the first one, in declaration order, whose condition holds. The branches of an
 * `@if` chain are selected through their own condition, the ones of a `@switch` through the value of its expression.
 *
 * @template Bindings - The bindings held by each branch.
 */
export type RenderConditionalBinding<Bindings> = {
  /**
   * The `@if`, `@else if` and `@else` branches of the chain.
   */
  branches: (Bindings & {
    /**
     * The condition the branch is selected with. An `@else` branch has none, so it is selected whenever it is reached.
     */
    condition?: NoArgsFunction<boolean>
  })[],
  /**
   * Only a `@switch` declares an expression.
   */
  expression?: never
} | {
  /**
   * The `@case` and `@default` branches of the `@switch`.
   */
  branches: (Bindings & {
    /**
     * The values the branch is selected with, one per `@case` sharing it: the branch is selected when one of them
     * is strictly equal to the value of the expression. A `@default` branch has none, so it is selected whenever it is reached.
     */
    condition: unknown[] | null
  })[],
  /**
   * The expression whose value selects the branch.
   */
  expression: NoArgsFunction<unknown>
}

/**
 * Describes a single conditional binding to be attached to a rendered element.
 */
export type RenderElementConditionalBinding = RenderConditionalBinding<{
  /**
   * The list of attributes to be applied to the element while the branch is selected.
   */
  attributes: RenderElementAttribute[],
  /**
   * The list of event listeners to be attached to the element while the branch is selected.
   */
  events: RenderElementEvent[],
  /**
   * The list of nested conditional bindings to be attached to the element while the branch is selected.
   */
  conditionalBindings: RenderElementConditionalBinding[],
  /**
   * The list of directives to be applied to the element while the branch is selected.
   */
  directives: RenderElementDirective[]
}>

/**
 * Describes a single conditional binding applying structural directives to a rendered element only while one of its branches is selected.
 *
 * Unlike the other bindings of the element, it lives as long as the place the element is rendered in, not as long as the element:
 * the element is created and destroyed according to the structural directives it applies.
 */
export type RenderElementStructuralConditionalBinding = RenderConditionalBinding<{
  /**
   * The list of structural directives deciding whether the element is rendered while the branch is selected.
   */
  structuralDirectives: RenderElementStructuralDirective[],
  /**
   * The list of nested conditional bindings applying structural directives while the branch is selected.
   */
  conditionalBindings: RenderElementStructuralConditionalBinding[]
}>
