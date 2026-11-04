import type { NoArgsFunction } from '@xaendar/types'

/**
 * Describes a conditional binding: a list of mutually exclusive branches, each one holding
 * the bindings applied only while it is the selected one.
 *
 * The selected branch is the first one, in declaration order, whose condition holds. The branches of an
 * `@if` chain are selected through their own condition, the ones of a `@switch` through the value of its expression.
 *
 * @template Bindings - The bindings held by each branch.
 */
export type RenderConditionalBinding<Bindings extends { conditionalBindings: RenderConditionalBinding<Bindings>[] }> = {
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
