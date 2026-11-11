import { _bindEffect } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { TemplateExpression } from '../../types/template-expression.type';
import type { _Context } from '../context/context.util';

/**
 * Initializes a `@let` (a template variable), declared at the start of its scope (see `_Context.declare`), with the
 * value of its expression, e.g. `@let total = price() * quantity();`: the expressions reading it read the value, as they
 * read any variable, never a signal.
 *
 * The expression is a binding (see `_bindEffect`): when it reads a signal it is computed again whenever the signal
 * changes, and when it reads a variable of the template (the item of a `@for`, another `@let`) whenever the scope
 * holding it is refreshed with it. A new value is written into the context, and the scope is refreshed with the name of
 * the `@let` (see `_Context.propagate`), so that the bindings reading it run again. The expression is a function of the
 * module of the template, called with the component and the context, which the binding keeps (see `TemplateExpression`).
 *
 * @param context - The context of the scope declaring the `@let`.
 * @param name - The name of the `@let`.
 * @param compute - The expression computing the value.
 * @param reads - The names of the variables of the template the expression reads, omitted when it reads none.
 */
export function _let(context: _Context, name: string, compute: TemplateExpression<unknown>, reads?: readonly string[]): void {
  _bindEffect(context, runLet, context, name, compute, reads);
}

/**
 * Computes the value of a `@let` and writes it into its context: the callback of the binding of {@link _let}, shared by
 * every `@let`. Only the expression is tracked: the first run initializes the `@let`, a later one changing its value
 * refreshes the scope with its name.
 *
 * @param context - The context of the scope declaring the `@let`.
 * @param name - The name of the `@let`.
 * @param compute - The expression computing the value.
 */
function runLet(context: _Context, name: string, compute: TemplateExpression<unknown>): void {
  if (context.update(name, compute.call(context.component, context))) {
    // The bindings run again by the refresh are not dependencies of the @let
    untracked(() => context.propagate(name));
  }
}
