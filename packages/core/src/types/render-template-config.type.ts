import type { BindingSite } from './binding-site.type';
import type { TemplateExpression } from './template-expression.type';
import type { _Template } from './template.type';

/**
 * A `@render` (`@render row(item, $index)`), as `_renderTemplate` renders it: a constant of the module of the template,
 * shared by every instance of the scope holding it.
 */
export type RenderTemplateConfig = BindingSite & {
  /**
   * The template, the constant of the module describing it.
   */
  readonly template: _Template;
  /**
   * How many scopes up the chain of the context rendering the instance the scope declaring the template is, which the
   * content of the instance reads the variables of: left out when it is the context itself.
   */
  readonly depth?: number;
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
   * The index of the container of the `@render` among the containers of the context rendering it (see `_ScopeLayout`),
   * which holds the context of the instance: left out for the first one.
   */
  readonly container?: number;
};
