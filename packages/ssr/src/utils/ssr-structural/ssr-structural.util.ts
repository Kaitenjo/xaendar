import { _Context, _getComponentRuntime, _resolveDirective, _selectBranch, _SSR_MARKERS, StructuralDirective, type RenderElementStructuralDirective, type RenderElementStructuralDirectiveConditionalBinding } from '@xaendar/core';
import type { ServerOutput } from '../../types/server-output.type';
import type { ServerStructuralConfig } from '../../types/server-structural-config.type';
import { _runOnServer } from '../server-runtime/server-runtime.util';

/**
 * The marker opening an element structural directives allow.
 */
const RENDERED = `<!--${_SSR_MARKERS.structural}:1-->`;

/**
 * The marker opening the place of an element structural directives do not allow.
 */
const NOT_RENDERED = `<!--${_SSR_MARKERS.structural}:0-->`;

/**
 * The marker closing the place of an element structural directives are applied to, where the browser places its anchor.
 */
const CLOSE = `<!--/${_SSR_MARKERS.structural}-->`;

/**
 * Writes an element only when every structural directive applied to it allows it, as the client renders it: the ones
 * applied directly, then the ones of the branches the conditional bindings select. Each one is created, its properties
 * set, and `shouldRender` evaluated once.
 *
 * The element is written at once when every outcome is synchronous. When some is a promise, the place of the element in
 * the output is held by the promise of its own output, written once every promise settles, with the runtime of the page:
 * a rejected one renders nothing, like a `false`. A synchronous `false` renders nothing without waiting.
 *
 * The element is written between the markers of the browser, `<!--xd-s:1-->` and `<!--/xd-s-->`, the place of the anchor
 * of the element; when it is not rendered, the markers are `<!--xd-s:0--><!--/xd-s-->`.
 *
 * @param out - The output.
 * @param context - The runtime context the structural directives are applied in.
 * @param config - The element, a constant of the module of the template: the structural directives applied directly,
 *   the conditional bindings applying structural directives, and the function of the module writing the element in the
 *   given output, in the given runtime context, a child of `context`, called with the component as `this`.
 * @throws When no structural directive is registered for a selector.
 */
export function _ssrStructural(out: ServerOutput, context: _Context, config: ServerStructuralConfig): void {
  const { render } = config;
  const outcomes = new Array<boolean | Promise<boolean>>();
  collectOutcomes(context, config.structuralDirectives, config.structuralConditionalBindings, outcomes);

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
    out.push(NOT_RENDERED, CLOSE);
    return;
  }

  const elementContext = new _Context(context);
  if (!pending.length) {
    out.push(RENDERED);
    render.call(context.component, out, elementContext);
    out.push(CLOSE);
    return;
  }

  // The element is rendered once the promises settle, out of the synchronous segment running with the runtime of the page
  const runtime = _getComponentRuntime();
  out.push(Promise.all(pending).then(values => {
    if (!values.every(value => value)) {
      return [NOT_RENDERED];
    }

    const output: ServerOutput = [RENDERED];
    _runOnServer(runtime, () => render.call(context.component, output, elementContext));
    return output;
  }), CLOSE);
}

/**
 * Creates the structural directives, sets their properties and evaluates them.
 *
 * @param context - The runtime context the structural directives are applied in, which their properties read.
 * @param structuralDirectives - The structural directives applied directly, if any.
 * @param conditionalBindings - The conditional bindings applying structural directives, if any.
 * @param outcomes - Collects the outcome of each one of them, in order.
 * @throws When no structural directive is registered for a selector.
 */
function collectOutcomes(context: _Context, structuralDirectives: readonly RenderElementStructuralDirective[] | undefined, conditionalBindings: readonly RenderElementStructuralDirectiveConditionalBinding[] | undefined, outcomes: Array<boolean | Promise<boolean>>): void {
  if (structuralDirectives?.length) {
    for (let i = 0; i < structuralDirectives.length; i++) {
      const { selector, attributes } = structuralDirectives[i];
      const Directive = _resolveDirective(selector, StructuralDirective);
      const directive = new Directive();
      if (attributes?.length) {
        for (let j = 0; j < attributes.length; j++) {
          const attribute = attributes[j];
          attribute.setter(context, directive, attribute);
        }
      }

      outcomes.push(directive.shouldRender());
    }
  }

  if (conditionalBindings?.length) {
    for (let i = 0; i < conditionalBindings.length; i++) {
      const branch = _selectBranch(conditionalBindings[i], context);
      if (branch) {
        collectOutcomes(context, branch.structuralDirectives, branch.conditionalBindings, outcomes);
      }
    }
  }
}
