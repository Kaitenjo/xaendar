import type { _Context } from '@xaendar/core';
import type { ServerOutput } from '../../types/server-output.type';
import type { ServerTemplate } from '../../types/server-template.type';

/**
 * Writes an instance of a template (`@render row(item)`): the template is the function the scope declaring it holds under
 * its name, found from the scope rendering it (see `_Context.ownerOf`), called with the component as `this`, the context
 * of that scope, whose names the content reads, and the values of the arguments, read once, as the server reads every
 * value.
 *
 * @param out - The output.
 * @param context - The runtime context of the scope rendering the instance.
 * @param name - The name of the template.
 * @param args - The values of the arguments, in the order of the parameters.
 * @throws A `ReferenceError` when no scope of the chain declares the template.
 */
export function _ssrRenderTemplate(out: ServerOutput, context: _Context, name: string, args: readonly unknown[]): void {
  const owner = context.ownerOf(name);
  (owner.get(name) as ServerTemplate).call(context.component, out, owner, args);
}
