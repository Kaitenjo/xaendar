import type { _Context } from '@xaendar/core';
import type { ServerOutput } from '../../types/server-output.type';
import type { ServerTemplate } from '../../types/server-template.type';

/**
 * Creates the value of a template, which the scope declaring it holds under its name.
 *
 * @param context - The runtime context of the scope declaring the template.
 * @param render - The function writing an instance of the template.
 * @returns The template.
 */
export function _ssrTemplate(context: _Context, render: ServerTemplate['render']): ServerTemplate {
  return { context, render };
}

/**
 * Writes an instance of a template, e.g. for `@render row(item)`: the values of the arguments are its parameters, as on
 * the client, so that the content reads the parameters the same way.
 *
 * @param out - The output.
 * @param _context - Unused runtime context rendering the instance.
 * @param template - The template.
 * @param args - The values of the arguments, one for each parameter passed.
 */
export function _ssrRenderTemplate(out: ServerOutput, _context: _Context, template: ServerTemplate, args: unknown[]): void {
  template.render(out, template.context, args);
}
