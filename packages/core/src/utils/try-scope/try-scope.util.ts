import type { NoArgsVoidFunction } from '@xaendar/types';
import type { ChildConnection } from '../../types/child-connection.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { TryScope } from '../../types/try-scope.type';
import type { _Context } from '../../types/context.type';

/**
 * The innermost `@try` whose content the code running now renders for the first time, `undefined` outside of them. The
 * code of the components the content creates runs in it too, as a function runs in the `try` calling it in JavaScript.
 */
let current: TryScope | undefined;

/**
 * The connection of the element a template is mounting inside a `@try`, until the component it is takes it (see
 * {@link runConnection}).
 */
let pending: ChildConnection | undefined;

/**
 * Starts the first render of the content of a `@try`: until {@link closeTryScope}, the contexts created are collected,
 * by it and by the `@try`s holding it, and the components the template creates throw their errors where they are
 * created.
 *
 * @returns The scope of the `@try`.
 */
export function openTryScope(): TryScope {
  current = { contexts: [], outer: current };
  return current;
}

/**
 * Ends the first render of the content of a `@try`, started by {@link openTryScope}: what runs next, its `@catch`
 * included, is in the `@try` holding it, if any.
 *
 * @param scope - The scope of the `@try`.
 */
export function closeTryScope(scope: TryScope): void {
  current = scope.outer;
}

/**
 * Tells whether the code running now is in the first render of the content of a `@try`.
 *
 * @returns `true` inside one.
 */
export function isInTryScope(): boolean {
  return !!current;
}

/**
 * Collects a context created in the first render of the content of a `@try`, and of the ones holding it.
 *
 * @param context - The context.
 */
export function captureContext(context: _Context): void {
  for (let scope = current; scope; scope = scope.outer) {
    scope.contexts.push(context);
  }
}

/**
 * Mounts the element of a template with the strategy getting its nodes. Inside a `@try`, the error of the component
 * the element is, connected by the insertion, is thrown here once the element is inserted: the browser reports it
 * instead of throwing it, since it is the one calling the component.
 *
 * N.B. Deliberate, to save memory: it receives what mounting needs, instead of an arrow mounting the element, which every
 * element of a template would create. Do not pass a closure.
 *
 * @param nodeStrategy - The strategy the element was got with, which mounts it.
 * @param element - The element.
 * @param parentNode - The node the element is inserted into.
 * @param anchor - The node the element is inserted before, `null` to append it.
 * @throws The error of the connection of the component, inside a `@try`.
 */
export function connectChild(nodeStrategy: NodeStrategy, element: Element, parentNode: Element, anchor: Comment | null): void {
  if (!current) {
    nodeStrategy.mount(element, parentNode, anchor);
    return;
  }

  const outer = pending;
  const connection: ChildConnection = { failure: undefined };
  pending = connection;
  try {
    nodeStrategy.mount(element, parentNode, anchor);
  } finally {
    pending = outer;
  }

  if (connection.failure) {
    throw connection.failure.error;
  }
}

/**
 * Runs the connection of a component. Mounted by a template inside a `@try` (see {@link connectChild}), its error is
 * handed to the template, which throws it. Inserted by any other code, it is out of the `@try` running that code, as in
 * the browser, which reports its error: its error is thrown, and its own templates render outside of any `@try`.
 *
 * @param connect - Connects the component.
 * @throws The error of the connection of a component no template mounts inside a `@try`.
 */
export function runConnection(connect: NoArgsVoidFunction): void {
  const connection = pending;
  const scope = current;
  pending = undefined;
  current = connection && scope;
  try {
    connect();
  } catch (error) {
    if (!connection) {
      throw error;
    }

    connection.failure = { error };
  } finally {
    current = scope;
  }
}
