import { COMPONENT } from '../../costants';
import { _bindEffect } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { TemplateExpression } from '../../types/template-expression.type';
import type { _Context } from '../../types/context.type';
import { propagate, update } from '../context/context.util';

/**
 * The bound of the slots of a `@let` packed with its identifier (see {@link encodeLet}): no scope has as many slots.
 */
const LET_SLOTS = 2 ** 16;

/**
 * Initializes a `@let` (a template variable), declared at the start of its scope (see `_declare`), with the
 * value of its expression, e.g. `@let total = price() * quantity();`: the expressions reading it read the value, as they
 * read any variable, never a signal.
 *
 * The expression is a binding (see `_bindEffect`): when it reads a signal it is computed again whenever the signal
 * changes, and when it reads a variable of the template (the item of a `@for`, another `@let`) whenever the scope
 * holding it is refreshed with it. A new value is written into its slot, and the scope is refreshed with the identifier
 * of the `@let` (see `propagate`), so that the bindings reading it run again. The expression is a function of the
 * module of the template, called with the component and the context, which the binding keeps (see `TemplateExpression`).
 *
 * @param context - The context of the scope declaring the `@let`.
 * @param slot - The slot of the `@let` in the context.
 * @param id - The identifier of the `@let`, unique in its template.
 * @param compute - The expression computing the value.
 * @param reads - The identifiers of the variables of the template the expression reads, omitted when it reads none.
 */
export function _let(context: _Context, slot: number, id: number, compute: TemplateExpression<unknown>, reads?: readonly number[]): void {
  _bindEffect(context, runLet, context, encodeLet(slot, id), compute, reads);
}

/**
 * Packs the slot and the identifier of a `@let` into the one argument of its binding left (see `_bindEffect`).
 *
 * N.B. Deliberate, to save memory: a binding holds three arguments, and a `@let` needs four values, so the slot and the
 * identifier, two small integers, travel as one integer instead of an array or an object per `@let`. Do not split them.
 *
 * @param slot - The slot of the `@let`.
 * @param id - The identifier of the `@let`.
 * @returns The two packed.
 */
function encodeLet(slot: number, id: number): number {
  return id * LET_SLOTS + slot;
}

/**
 * Computes the value of a `@let` and writes it into its context: the callback of the binding of {@link _let}, shared by
 * every `@let`. Only the expression is tracked: the first run initializes the `@let`, a later one changing its value
 * refreshes the scope with its name.
 *
 * @param context - The context of the scope declaring the `@let`.
 * @param packed - The slot and the identifier of the `@let` (see {@link encodeLet}).
 * @param compute - The expression computing the value.
 */
function runLet(context: _Context, packed: number, compute: TemplateExpression<unknown>): void {
  if (update(context, packed % LET_SLOTS, compute.call(context[COMPONENT], context))) {
    // The bindings run again by the refresh are not dependencies of the @let
    untracked(() => propagate(context, Math.floor(packed / LET_SLOTS)));
  }
}
