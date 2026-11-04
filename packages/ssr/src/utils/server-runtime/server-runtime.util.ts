import { _setComponentRuntime, type _ComponentRuntime } from '@xaendar/core';
import type { NoArgsFunction } from '@xaendar/types';
import type { RenderOptions } from '../../types/render-options.type';
import type { ServerRuntime } from '../../types/server-runtime.type';

/**
 * Does nothing: the disposer of an effect that never ran, and the `destroy` of a component never rendered.
 */
function noop(): void {
  // Nothing to dispose on the server
}

/**
 * Creates the runtime the components and the custom directives use while a page is rendered on the server: an effect
 * does not run, a component created by `createComponent` is constructed without being rendered, since the server writes
 * HTML once and has no document to append it to, and `getTransferState` reads the transfer state of that page. The
 * events the components listen to are collected in it, for the event contract of the page.
 *
 * @param state - The transfer state of the page, if any.
 * @returns The runtime.
 */
export function _createServerRuntime(state: RenderOptions['state']): ServerRuntime {
  return {
    events: new Set(),
    effect: () => noop,
    createComponent: (_owner, component) => ({ element: new component(), destroy: noop }),
    getTransferState: key => state && Object.hasOwn(state, key) ? state[key] : undefined
  };
}

/**
 * Runs code of the components with the runtime of a page rendered on the server (see {@link _createServerRuntime}),
 * putting the previous one back afterwards: the rendering on the server runs the code of the components in synchronous
 * segments, so that the pages rendered at the same time never share a runtime, and a browser runtime in the same
 * process, such as the one of the tests, is never affected.
 *
 * @param runtime - The runtime of the page.
 * @param fn - The code.
 * @returns What the code returns.
 */
export function _runOnServer<Result>(runtime: _ComponentRuntime, fn: NoArgsFunction<Result>): Result {
  const previous = _setComponentRuntime(runtime);
  try {
    return fn();
  } finally {
    _setComponentRuntime(previous);
  }
}
