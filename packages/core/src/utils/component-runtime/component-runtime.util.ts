import { effect } from '../../signals/effect/effect';
import { _createComponent } from '../create-component/create-component.util';
import type { _ComponentRuntime } from '../../types/component-runtime.type';

/**
 * The runtime in use, created on the first read: the modules of the components import this one before
 * the module of `_createComponent` has run.
 */
let runtime: _ComponentRuntime | undefined;

/**
 * Returns the runtime the components and the custom directives create their effects and their components with.
 *
 * @returns The runtime in use: the one of the browser, unless another one replaced it.
 */
export function _getComponentRuntime(): _ComponentRuntime {
  return runtime ??= { 
    effect, 
    createComponent: _createComponent 
  };
}

/**
 * Replaces the runtime the components and the custom directives create their effects and their components with.
 *
 * @param next - The runtime to use from now on.
 * @returns The runtime it replaces, to put back once done.
 */
export function _setComponentRuntime(next: _ComponentRuntime): _ComponentRuntime {
  const previous = _getComponentRuntime();
  runtime = next;
  return previous;
}
