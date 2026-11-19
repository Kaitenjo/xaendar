import type { BindingSite } from './binding-site.type';
import type { _BoundTemplate } from './bound-template.type';
import type { TemplateExpression } from './template-expression.type';
import type { _Template } from './template.type';

/**
 * A `@render` (`@render row(item, $index)`), as `_renderTemplate` renders it: a constant of the module of the template,
 * shared by every instance of the scope holding it. It renders a template the scope declares (`template`, found `depth`
 * scopes up), or the template an expression gives (`ref`, `@render rowTemplate()(item)`), the value of an input or of
 * a query holding one passed by another component.
 */
export type RenderTemplateConfig = BindingSite & {
  /**
   * The template, the constant of the module describing it, when the `@render` calls a template its scope declares by
   * name: left out when it calls an expression ({@link ref}).
   */
  readonly template?: _Template;
  /**
   * How many scopes up the chain of the context rendering the instance the scope declaring the template is, which the
   * content of the instance reads the variables of: left out when it is the context itself, or when the `@render` calls
   * an expression.
   */
  readonly depth?: number;
  /**
   * Computes the template the `@render` calls, when it calls an expression: a function of the module of the template,
   * called with the component and the context, returning the template as a value (see `_BoundTemplate`), or `null` or
   * `undefined` to render nothing. A change of the template replaces the instance.
   */
  readonly ref?: TemplateExpression<_BoundTemplate<_Template> | null | undefined>;
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
