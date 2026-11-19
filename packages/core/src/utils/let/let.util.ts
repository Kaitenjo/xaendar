import { COMPONENT } from '../../costants';
import { _bindSite } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { LetBinding } from '../../types/let-binding.type';
import type { _Context } from '../../types/context.type';
import { propagate, update } from '../context/context.util';

/**
 * Initializes a `@let` (a template variable), declared at the start of its scope (see `_declare`), with the
 * value of its expression, e.g. `@let total = price() * quantity();`: the expressions reading it read the value, as they
 * read any variable, never a signal.
 *
 * The expression is a binding (see `_bindSite`): when it reads a signal it is computed again whenever the signal
 * changes, and when it reads a variable of the template (the item of a `@for`, another `@let`) whenever the scope
 * holding it is refreshed with it. A new value is written into its slot, and the scope is refreshed with the identifier
 * of the `@let` (see `propagate`), so that the bindings reading it run again. The binding is a constant of the module
 * of the template (see `LetBinding`), holding the expression, the slot and the identifier of the `@let`.
 *
 * @param context - The context of the scope declaring the `@let`.
 * @param binding - The binding of the `@let`.
 */
export function _let(context: _Context, binding: LetBinding): void {
  _bindSite(context, binding, undefined, _runLet);
}

/**
 * Computes the value of a `@let` and writes it into its context: the callback of the binding of {@link _let}, shared by
 * every `@let`, which the compiler names in the binding. Only the expression is tracked: the first run initializes the
 * `@let`, a later one changing its value refreshes the scope with its identifier.
 *
 * @param context - The context of the scope declaring the `@let`.
 * @param _target - Unused: a `@let` writes its scope.
 * @param binding - The binding of the `@let`.
 */
export function _runLet(context: _Context, _target: unknown, binding: LetBinding): void {
  if (update(context, binding.variable, binding.value.call(context[COMPONENT], context))) {
    // The bindings run again by the refresh are not dependencies of the @let
    untracked(() => propagate(context, binding.id));
  }
}
