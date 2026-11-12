import { _COMPONENT, _PARENT, type _Context } from '@xaendar/core';
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

  template.call(context[_COMPONENT], out, owner, args);
}
