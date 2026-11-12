import type { BindingSite } from './binding-site.type';
import type { TemplateExpression } from './template-expression.type';

/**
 * The binding of a `@let`, or of the default value of a parameter of a template (see `_let`, `_parameter`): a constant
 * of the module of the template, shared by every instance of its scope.
 */
export type LetBinding = BindingSite & {
  /**
   * Computes the value of the variable: a function of the module, called with the component and the context.
   */
  readonly value: TemplateExpression<unknown>;
  /**
   * The slot of the variable in the scope declaring it.
   */
  readonly variable: number;
  /**
   * The identifier of the variable, unique in its template, which the scope is refreshed with when its value changes.
   */
  readonly id: number;
};
