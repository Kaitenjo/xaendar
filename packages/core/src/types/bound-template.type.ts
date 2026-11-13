import type { _Context } from './context.type';

/**
 * A template read as a value (see `TemplateRef`), as it is at runtime: the template, the constant of the module
 * describing it (`_Template`) in the browser or the function writing it on the server, and the scope declaring it,
 * whose variables, and component, its content reads wherever it is rendered. `_templateRef` creates it once per
 * template and scope, so that reading the template again gives the same value.
 *
 * @template Template - What describes the template: `_Template` in the browser, the function writing it on the server.
 */
export type _BoundTemplate<Template = unknown> = {
  /**
   * The template.
   */
  readonly template: Template;
  /**
   * The scope declaring the template.
   */
  readonly context: _Context;
};
