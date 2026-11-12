import type { BindingSite } from './binding-site.type';
import type { TemplateExpression } from './template-expression.type';

/**
 * The binding of an interpolation (see `_renderText`): a constant of the module of the template, shared by every
 * instance of its scope.
 */
export type TextBinding = BindingSite & {
  /**
   * Computes the value of the text: a function of the module, called with the component and the context.
   */
  readonly value: TemplateExpression<unknown>;
};
