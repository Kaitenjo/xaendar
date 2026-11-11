import type { TemplateExpression } from './template-expression.type';

/**
 * A `@render` (`@render row(item, $index)`), as `_renderTemplate` renders it: a constant of the module of the template,
 * shared by every instance of the scope holding it.
 */
export type RenderTemplateConfig = {
  /**
   * The name of the template, which the scope declaring it holds.
   */
  readonly template: string;
  /**
   * Computes the values of the arguments, one per parameter passed, in order: a function of the module of the template,
   * called with the component and the context. Left out when the `@render` passes none.
   */
  readonly args?: TemplateExpression<unknown[]>;
  /**
   * Whether the server wrote `<!---->` before the instance, as it does after a text.
   */
  readonly separated?: boolean;
  /**
   * The names of the variables of the template the arguments read, left out when they read none.
   */
  readonly reads?: readonly string[];
};
