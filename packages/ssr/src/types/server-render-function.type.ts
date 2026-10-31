import type { CustomElement } from '@xaendar/core';
import type { ServerOutput } from './server-output.type';

/**
 * The compiled function rendering the template of a component on the server, invoked with the component bound as `this`:
 * it writes the HTML of the shadow root into the output.
 */
export type ServerRenderFunction = (this: CustomElement, out: ServerOutput) => void;
