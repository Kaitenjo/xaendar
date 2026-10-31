import { _Context, _resolveDirective, _selectBranch, StructuralDirective, type RenderElementStructuralDirective, type RenderElementStructuralDirectiveConditionalBinding } from '@xaendar/core';
import type { VoidFunction } from '@xaendar/types';
import type { ServerOutput } from '../../types/server-output.type';
import { _runOnServer } from '../server-runtime/server-runtime.util';

/**
 * Writes an element only when every structural directive applied to it allows it, as the client renders it: the ones
 * applied directly, then the ones of the branches the conditional bindings select. Each one is created, its properties
 * set, and `shouldRender` evaluated once.
 *
 * The element is written at once when every outcome is synchronous. When some is a promise, the place of the element in
 * the output is held by the promise of its own output, written once every promise settles: a rejected one renders
 * nothing, like a `false`. A synchronous `false` renders nothing without waiting.
 *
 * @param out - The output.
 * @param context - The runtime context the structural directives are applied in.
 * @param structuralDirectives - The structural directives applied directly.
 * @param structuralConditionalBindings - The conditional bindings applying structural directives.
 * @param render - Writes the element in the given output, in the given runtime context, a child of `context`.
 * @throws When no structural directive is registered for a selector.
 */
export function _ssrStructural(
  out: ServerOutput,
  context: _Context,
  structuralDirectives: RenderElementStructuralDirective[],
  structuralConditionalBindings: RenderElementStructuralDirectiveConditionalBinding[],
  render: VoidFunction<[out: ServerOutput, context: _Context]>
): void {
  const outcomes = new Array<boolean | Promise<boolean>>();
  collectOutcomes(context, structuralDirectives, structuralConditionalBindings, outcomes);

  let rendered = true;
  const pending = new Array<Promise<boolean>>();
  for (let i = 0; i < outcomes.length; i++) {
    const outcome = outcomes[i];
    if (typeof outcome === 'boolean') {
      rendered &&= outcome;
    } else {
      // Every promise gets its handler, also when a synchronous false renders nothing: a rejection is never left unhandled
      pending.push(outcome.then(value => value, () => false));
    }
  }

  if (!rendered) {
    return;
  }

  const elementContext = new _Context(context);
  if (!pending.length) {
    render(out, elementContext);
    return;
  }

  out.push(Promise.all(pending).then(values => {
    const output: ServerOutput = [];
    if (values.every(value => value)) {
      _runOnServer(() => render(output, elementContext));
    }

    return output;
  }));
}

/**
 * Creates the structural directives, sets their properties and evaluates them.
 *
 * @param context - The runtime context the structural directives are applied in.
 * @param structuralDirectives - The structural directives applied directly.
 * @param conditionalBindings - The conditional bindings applying structural directives.
 * @param outcomes - Collects the outcome of each one of them, in order.
 * @throws When no structural directive is registered for a selector.
 */
function collectOutcomes(context: _Context, structuralDirectives: RenderElementStructuralDirective[], conditionalBindings: RenderElementStructuralDirectiveConditionalBinding[], outcomes: Array<boolean | Promise<boolean>>): void {
  for (let i = 0; i < structuralDirectives.length; i++) {
    const { selector, attributes } = structuralDirectives[i];
    const Directive = _resolveDirective(selector, StructuralDirective);
    const directive = new Directive();
    for (let j = 0; j < attributes.length; j++) {
      const { name, value, setter } = attributes[j];
      setter(context, directive, name, value);
    }

    outcomes.push(directive.shouldRender());
  }

  for (let i = 0; i < conditionalBindings.length; i++) {
    const branch = _selectBranch(conditionalBindings[i]);
    if (branch) {
      collectOutcomes(context, branch.structuralDirectives, branch.conditionalBindings, outcomes);
    }
  }
}
