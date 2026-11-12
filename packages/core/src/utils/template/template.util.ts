import { _bindEffect } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { RenderRun } from '../../types/render-run.type';
import type { RenderTemplateConfig } from '../../types/render-template-config.type';
import type { TemplateExpression } from '../../types/template-expression.type';
import type { _Template } from '../../types/template.type';
import { COMPONENT, HEADER, PARENT } from '../../costants';
import type { _Context } from '../../types/context.type';
import { _declare, addChild, getNodeStrategy, refresh, update } from '../context/context.util';
import { _let } from '../let/let.util';

/**
 * The values of the arguments of a `@render` passing none, shared by every one of them: the function rendering the
 * instance only reads them.
 */
const NO_ARGUMENTS: readonly unknown[] = Object.freeze([]);

/**
 * Declares a parameter with a default value in the context of an instance of a template: the value of its argument, or,
 * when the `@render` leaves the argument out, its default value, computed as the value of a `@let` (see `_let`), so that
 * it is computed again when a signal or another parameter it reads changes. An argument passed as `undefined` is not
 * left out: the parameter holds `undefined`.
 *
 * @param context - The context of the instance.
 * @param params - The values of the arguments the `@render` passes, in the order of the parameters.
 * @param index - The position of the parameter, whose slot follows the header of the context.
 * @param id - The identifier of the parameter, unique in its template.
 * @param initializer - The expression computing the default value of the parameter, reading the parameters before it in
 *   the context of the instance: a function of the module of the template (see `TemplateExpression`).
 * @param reads - The identifiers of the variables of the template the default value reads, omitted when it reads none.
 */
export function _parameter(context: _Context, params: readonly unknown[], index: number, id: number, initializer: TemplateExpression<unknown>, reads?: readonly number[]): void {
  const slot = HEADER + index;
  if (index < params.length) {
    context[slot] = params[index];
    return;
  }

  _declare(context, slot, 'let');
  _let(context, slot, id, initializer, reads);
}

/**
 * Renders an instance of a template, e.g. for `@render row(item, $index)`.
 *
 * The template is a constant of the module (see `_Template`), and the context of the instance is a child of the context
 * of the scope declaring it, `depth` scopes up the chain of the context rendering it, so its content reads the
 * variables visible there, but it is owned by the context rendering it: it is destroyed with it, and its nodes move with it
 * (e.g. with the row of a `@for`). Its nodes are got with the strategy of the context rendering it: in the hydration of
 * a component, the ones the server rendered there are adopted.
 *
 * The arguments are a binding (see `_bindEffect`): they are computed again whenever a signal, or a variable of the
 * template, they read changes. The first run renders the instance, whose parameters are the values of the arguments; a
 * later one writes the values that changed into the context of the instance and refreshes it with their identifiers (see
 * `refresh`): the instance is rendered once, and only the bindings reading a parameter run again.
 *
 * @param parentNode - The element the instance is rendered into.
 * @param parentContext - The context rendering the instance, which owns it and which the arguments read.
 * @param referenceNode - The node the instance is rendered before, `null` to append it to `parentNode`.
 * @param config - The `@render`, a constant of the module of the template.
 */
export function _renderTemplate(parentNode: Element, parentContext: _Context, referenceNode: Comment | null, config: RenderTemplateConfig): void {
  let owner = parentContext;
  for (let i = 0; i < (config.depth ?? 0); i++) {
    owner = owner[PARENT]!;
  }

  const run: RenderRun = { parentNode, parentContext, referenceNode, config, owner, instance: null };
  _bindEffect(parentContext, runRender, run, undefined, undefined, config.reads);
}

/**
 * Computes the arguments of a `@render`, then renders its instance, or updates it: the callback of the binding of
 * {@link _renderTemplate}, shared by every `@render`. Only the arguments are tracked.
 *
 * @param run - The `@render`.
 */
function runRender(run: RenderRun): void {
  const { args } = run.config;
  const { parentContext } = run;
  const values = args ? args.call(parentContext[COMPONENT], parentContext) : NO_ARGUMENTS;

  // The signals read while rendering or refreshing the instance are not dependencies of the arguments
  untracked(() => run.instance ? updateInstance(run.instance, run.config.template.parameters, values) : renderInstance(run, values));
}

/**
 * Renders the instance of a `@render`, getting its nodes with the strategy of the context rendering it, after the
 * `<!---->` the server wrote before it, if any.
 *
 * @param run - The `@render`.
 * @param values - The values of the arguments.
 */
function renderInstance(run: RenderRun, values: readonly unknown[]): void {
  const { parentNode, parentContext, config } = run;
  const nodeStrategy = getNodeStrategy(parentContext);
  nodeStrategy.separator(parentNode, !!config.separated);
  run.instance = config.template.render(parentNode, run.owner, run.referenceNode, values, nodeStrategy);
  addChild(parentContext, run.instance);
}

/**
 * Writes the new values of the arguments into the parameters of an instance, the slots following its header, then
 * refreshes it with the identifiers of the ones that changed, if any.
 *
 * @param instance - The context of the instance.
 * @param parameters - The identifiers of the parameters of the template.
 * @param values - The values of the arguments, one for each parameter passed.
 */
function updateInstance(instance: _Context, parameters: readonly number[], values: readonly unknown[]): void {
  let changed: number[] | null = null;
  for (let i = 0; i < values.length; i++) {
    const id = parameters[i];
    if (update(instance, HEADER + i, values[i])) {
      changed ? changed.push(id) : changed = [id];
    }
  }

  if (changed) {
    refresh(instance, changed);
  }
}
