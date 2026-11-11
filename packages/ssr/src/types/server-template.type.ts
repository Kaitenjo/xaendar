import type { _Context } from '@xaendar/core';
import type { ServerOutput } from './server-output.type';

/**
 * A template the code rendering on the server declares, the value its scope holds under its name: the function of the
 * module writing an instance, called with the component as `this`, the context of the scope declaring the template,
 * which `_ssrRenderTemplate` finds by its name, and the values of the arguments.
 */
export type ServerTemplate = (this: unknown, out: ServerOutput, declarationContext: _Context, params: readonly unknown[]) => void;
