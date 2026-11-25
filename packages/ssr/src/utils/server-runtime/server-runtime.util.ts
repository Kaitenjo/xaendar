import { _getComponentRuntime, _setComponentRuntime, type _ComponentRuntime } from '@xaendar/core';
import type { NoArgsFunction } from '@xaendar/types';
import type { RenderOptions } from '../../types/render-options.type';
import type { ServerRuntime } from '../../types/server-runtime.type';
import type { ServerStyles } from '../../types/server-styles.type';

/**
 * Does nothing: the disposer of an effect that never ran, the `destroy` of a component never rendered, and `onLeave`,
 * since the server removes no element.
 */
function noop(): void {
  // Nothing to dispose on the server
}

/**
 * Creates the runtime the components and the custom directives use while a page is rendered on the server: an effect
 * does not run, a component created by `createComponent` is constructed without being rendered, since the server writes
 * HTML once and has no document to append it to, `onLeave` registers nothing, and `getTransferState` reads the transfer state of that page. The
 * events the components listen to are collected in it, for the event contract of the page, and the inline styles of the
 * elements written around the root of the page, for the `<style>` before it.
 *
 * @param state - The transfer state of the page, if any.
 * @param nonce - The nonce of the `Content-Security-Policy` of the response, if any.
 * @returns The runtime.
 */
export function _createServerRuntime(state: RenderOptions['state'], nonce?: string): ServerRuntime {
  return {
    events: new Set(),
    nonce,
    styles: { blocks: null },
    effect: () => noop,
    createComponent: (_owner, component) => ({ element: new component(), destroy: noop }),
    getTransferState: key => state && Object.hasOwn(state, key) ? state[key] : undefined,
    onLeave: noop
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

/**
 * Renders the elements of a tree with its inline styles (see `ServerStyles`), putting the ones of the tree around back
 * afterwards: a declarative shadow root, or a part of one rendered later, once the structural directives deciding whether
 * it renders settle. Rendered outside of a page, by code calling the helpers by itself, there are no styles to move: the
 * elements keep their `style` attribute.
 *
 * @param styles - The inline styles of the tree, `undefined` outside of a page.
 * @param fn - The rendering.
 * @returns What the rendering returns.
 */
export function _renderInTree<Result>(styles: ServerStyles | undefined, fn: NoArgsFunction<Result>): Result {
  if (!styles) {
    return fn();
  }

  const runtime = _getComponentRuntime() as ServerRuntime;
  const previous = runtime.styles;
  runtime.styles = styles;
  try {
    return fn();
  } finally {
    runtime.styles = previous;
  }
}
