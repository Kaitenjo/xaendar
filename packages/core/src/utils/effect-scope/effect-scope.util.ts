import type { NoArgsVoidFunction } from '@xaendar/types';

/**
 * The collection of disposers the effects created right now are registered into,
 * or `null` when no scope is active.
 */
let currentScope: Array<NoArgsVoidFunction> | null = null;

/**
 * Runs `fn` and collects the disposers of all the effects created synchronously while it runs.
 *
 * Scopes can be nested: the previous one is restored once `fn` returns or throws.
 * If `fn` throws, the effects created so far are disposed before the error is rethrown.
 *
 * @param fn The function to run inside the scope.
 * @returns The value returned by `fn` and the disposers of the effects it created.
 * @throws Whatever `fn` throws.
 */
export function _collectEffects<T>(fn: () => T): { result: T; disposers: Array<NoArgsVoidFunction> } {
  const previousScope = currentScope;
  const disposers = new Array<NoArgsVoidFunction>();
  currentScope = disposers;

  try {
    return { result: fn(), disposers };
  } catch (error) {
    for (let i = 0; i < disposers.length; i++) {
      disposers[i]();
    }

    throw error;
  } finally {
    currentScope = previousScope;
  }
}

/**
 * Runs `fn` with no active scope, so the effects it creates are not collected.
 *
 * @param fn The function to run outside of any scope.
 * @returns The value returned by `fn`.
 * @throws Whatever `fn` throws.
 */
export function _runOutsideEffectScope<T>(fn: () => T): T {
  const previousScope = currentScope;
  currentScope = null;

  try {
    return fn();
  } finally {
    currentScope = previousScope;
  }
}

/**
 * Registers the disposer of a newly created effect into the active scope, if any.
 *
 * Inside a scope the disposer is replaced by one that can be safely called more than once,
 * so that the user can still dispose the effect manually without the scope failing later on.
 *
 * @param disposer The disposer of the effect.
 * @returns The disposer to hand to the user: `disposer` itself when no scope is active.
 */
export function _registerEffect(disposer: NoArgsVoidFunction): NoArgsVoidFunction {
  if (!currentScope) {
    return disposer;
  }

  let disposed = false;
  const safeDisposer = () => {
    if (!disposed) {
      disposed = true;
      disposer();
    }
  };

  currentScope.push(safeDisposer);
  return safeDisposer;
}
