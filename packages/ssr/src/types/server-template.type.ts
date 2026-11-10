import type { _Context } from '@xaendar/core';
import type { Function } from '@xaendar/types';
import type { ServerOutput } from './server-output.type';

/**
 * A template declared in a template, as the scope declaring it holds it on the server.
 */
export type ServerTemplate = {
  /**
   * The runtime context of the scope declaring the template: the content of the template reads the names visible there.
   */
  readonly context: _Context;
  /**
   * Writes an instance of the template, given the output, the runtime context of the scope declaring it and the values
   * of the arguments, in the order of the parameters.
   */
  readonly render: Function<[out: ServerOutput, declarationContext: _Context, params: unknown[]], void>;
};
