import { _setComponentRuntime, type _ComponentRuntime } from '@xaendar/core';
import type { NoArgsFunction } from '@xaendar/types';

/**
 * Does nothing: the disposer of an effect that never ran, and the `destroy` of a component never rendered.
 */
function noop(): void {
  // Nothing to dispose on the server
}

/**
 * The runtime the components and the custom directives use on the server: an effect does not run, and a component
 * created by `createComponent` is constructed without being rendered, since the server writes HTML once and has no
 * document to append it to.
 */
const SERVER_RUNTIME: _ComponentRuntime = {
  effect: () => noop,
  createComponent: (_owner, component) => ({ element: new component(), destroy: noop })
};

/**
 * Runs code of the components with the runtime of the server (see {@link SERVER_RUNTIME}), putting the previous one back
 * afterwards: the rendering on the server runs the code of the components in synchronous segments, so that a browser
 * runtime in the same process, such as the one of the tests, is never affected.
 *
 * @param fn - The code.
 * @returns What the code returns.
 */
export function _runOnServer<Result>(fn: NoArgsFunction<Result>): Result {
  const previous = _setComponentRuntime(SERVER_RUNTIME);
  try {
    return fn();
  } finally {
    _setComponentRuntime(previous);
  }
}
