import { LEAVE_HANDLER } from '../../costants';
import type { _Context } from '../../types/context.type';
import type { LeaveHandler } from '../../types/leave-handler.type';
import { markLeavingScope } from '../context/context.util';

/**
 * The scope the directive starting now starts in (see {@link startDirective}), `null` while none starts: the scope of
 * the element a handler registered in its `onInit` belongs to.
 *
 * N.B. Deliberate, to save memory: starting a directive is synchronous, so its scope travels through a variable of the
 * module, read only by `onLeave`, instead of a member of every directive. Do not keep the scope on the directives.
 */
let startingScope: _Context | null = null;

/**
 * Tells which scope the directive starting now starts in, so that a handler it registers with `onLeave` marks the scope
 * of its element (see `markLeavingScope`).
 *
 * @param scope - The scope the directive starts in, `null` once it has started.
 * @returns The scope of the directive starting before, to put back once this one has started.
 */
export function startDirective(scope: _Context | null): _Context | null {
  const previous = startingScope;
  startingScope = scope;
  return previous;
}

/**
 * Registers on an element the function the runtime calls when it is about to remove it, in place of the one registered
 * before, and marks the scope of the element, so that clearing it reads the handler (see `onLeave`).
 *
 * @param element - The element.
 * @param handler - The function.
 */
export function registerLeave(element: Element, handler: LeaveHandler): void {
  (element as Element & Record<typeof LEAVE_HANDLER, LeaveHandler>)[LEAVE_HANDLER] = handler;
  markLeavingScope(startingScope);
}
