import { _COMPONENT, _PARENT, type _BoundTemplate, type _Context } from '@xaendar/core';
import type { ServerOutput } from '../../types/server-output.type';
import type { ServerTemplate } from '../../types/server-template.type';

/**
 * Writes an instance of a template (`@render row(item)`): the template is the function of the module rendering its
 * content, called with the component as `this`, the scope declaring it, `depth` scopes up the chain of the scope
 * rendering it, whose variables the content reads, and the values of the arguments, read once, as the server reads
 * every value.
 *
 * @param out - The output.
 * @param context - The runtime scope rendering the instance.
 * @param template - The function rendering the content of the template.
 * @param depth - How many scopes up the chain the scope declaring the template is, `0` for `context` itself.
 * @param args - The values of the arguments, in the order of the parameters.
 */
export function _ssrRenderTemplate(out: ServerOutput, context: _Context, template: ServerTemplate, depth: number, args: readonly unknown[]): void {
  let owner = context;
  for (let i = 0; i < depth; i++) {
    owner = owner[_PARENT]!;
  }

  template.call(owner[_COMPONENT], out, owner, args);
}

/**
 * Writes an instance of the template an expression gives (`@render rowTemplate()(item)`), a template read as a value
 * (see `_templateRef` of core), declared by the template of this component or of another one: its content is called
 * with the component declaring it as `this` and the scope declaring it, whose variables it reads, and the values of the
 * arguments. Nothing is written for `null` and `undefined`, as the client renders nothing.
 *
 * @param out - The output.
 * @param bound - The template and the scope declaring it, `null` or `undefined` for none.
 * @param args - The values of the arguments, in the order of the parameters.
 */
export function _ssrRenderTemplateRef(out: ServerOutput, bound: _BoundTemplate<ServerTemplate> | null | undefined, args: readonly unknown[]): void {
  if (bound) {
    const { template, context } = bound;
    template.call(context[_COMPONENT], out, context, args);
  }
}
