import type { BindingSite } from './binding-site.type';
import type { TemplateExpression } from './template-expression.type';

/**
 * Describes a conditional binding: a list of mutually exclusive branches, each one holding
 * the bindings applied only while it is the selected one. A constant of the module of the template, which the runtime
 * only reads: the branch selected is kept by the binding (see `ConditionalBindingRun`). Its selection is a binding (see
 * `BindingSite`), the slots of the scope holding it keeping its effect and its run.
 *
 * The selected branch is the first one, in declaration order, whose condition holds. The branches of an
 * `@if` chain are selected through their own condition, the ones of a `@switch` through the value of its expression.
 *
 * @template Bindings - The bindings held by each branch.
 */
export type RenderConditionalBinding<Bindings> = BindingSite & ({
  /**
   * The `@if`, `@else if` and `@else` branches of the chain.
   */
  readonly branches: ReadonlyArray<Bindings & {
    /**
     * The condition the branch is selected with. An `@else` branch has none, so it is selected whenever it is reached.
     */
    readonly condition?: TemplateExpression<unknown>;
  }>;
  /**
   * Only a `@switch` declares an expression.
   */
  readonly expression?: never;
} | {
  /**
   * The `@case` and `@default` branches of the `@switch`.
   */
  readonly branches: ReadonlyArray<Bindings & {
    /**
     * The values the branch is selected with, one per `@case` sharing it: the branch is selected when one of them
     * is strictly equal to the value of the expression. A `@default` branch has none, so it is selected whenever it is reached.
     */
    readonly condition: readonly unknown[] | null;
  }>;
  /**
   * The expression whose value selects the branch.
   */
  readonly expression: TemplateExpression<unknown>;
});
