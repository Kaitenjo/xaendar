import type { NoArgsFunction } from '@xaendar/types';
import { _bindEffect } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { _Context } from '../context/context.util';
import { _let } from '../let/let.util';
import type { RenderRun } from '../../types/render-run.type';
import type { RenderTemplate } from '../../types/render-template.type';
import type { _Template } from '../../types/template.type';

/**
 * Creates the value of a template, which the scope declaring it holds under its name.
 *
 * @param context - The context of the scope declaring the template.
 * @param render - The function rendering an instance of the template.
 * @param parameters - The names of the parameters of the template, in order: a constant of the module.
 * @returns The template.
 */
export function _template(context: _Context, render: RenderTemplate, parameters: readonly string[]): _Template {
  return { context, render, parameters };
}

/**
 * Declares a parameter with a default value in the context of an instance of a template: the value of its argument, or,
 * when the `@render` leaves the argument out, its default value, computed as the value of a `@let` (see `_let`), so that
 * it is computed again when a signal or another parameter it reads changes. An argument passed as `undefined` is not
 * left out: the parameter holds `undefined`.
 *
 * @param context - The context of the instance.
 * @param params - The values of the arguments the `@render` passes, in the order of the parameters.
 * @param index - The position of the parameter.
 * @param name - The name of the parameter.
 * @param initializer - Computes the default value of the parameter, reading the parameters before it in the context of
 *   the instance.
 * @param reads - The names of the variables of the template the default value reads, omitted when it reads none.
 */
export function _parameter(context: _Context, params: unknown[], index: number, name: string, initializer: NoArgsFunction<unknown>, reads?: readonly string[]): void {
  if (index < params.length) {
    context.addIdentifier(name, params[index]);
    return;
  }

  context.declare(name, 'let');
  _let(context, name, initializer, reads);
}

/**
 * Renders an instance of a template, e.g. for `@render row(item, $index)`.
 *
 * The arguments are a binding (see `_bindEffect`): they are computed again whenever a signal, or a variable of the
 * template, they read changes. The first run renders the instance, whose parameters are the values of the arguments; a
 * later one writes the values that changed into the context of the instance and refreshes it with their names (see
 * `_Context.refresh`): the instance is rendered once, and only the bindings reading a parameter run again. The context of
 * the instance is a child of the context of the scope declaring the template, so its content reads the names visible
 * there, but it is owned by the context rendering it: it is destroyed with it, and its nodes move with it (e.g. with the
 * row of a `@for`). Its nodes are got with the strategy of the context rendering it: in the hydration of a component,
 * the ones the server rendered there are adopted.
 *
 * @param parentNode - The element the instance is rendered into.
 * @param parentContext - The context rendering the instance, which owns it.
 * @param referenceNode - The node the instance is rendered before, `null` to append it to `parentNode`.
 * @param template - The template.
 * @param args - The functions computing the arguments, one for each parameter passed.
 * @param separated - Whether the server wrote `<!---->` before the instance, as it does after a text.
 * @param reads - The names of the variables of the template the arguments read, omitted when they read none.
 */
export function _renderTemplate(parentNode: Element, parentContext: _Context, referenceNode: Comment | null, template: _Template, args: NoArgsFunction<unknown>[], separated = false, reads?: readonly string[]): void {
  const run: RenderRun = { parentNode, parentContext, referenceNode, template, args, separated, instance: null };
  _bindEffect(parentContext, runRender, run, undefined, undefined, reads);
}

/**
 * Computes the arguments of a `@render`, then renders its instance, or updates it: the callback of the binding of
 * {@link _renderTemplate}, shared by every `@render`. Only the arguments are tracked.
 *
 * @param run - The `@render`.
 */
function runRender(run: RenderRun): void {
  const { args } = run;
  const values = new Array<unknown>(args.length);
  for (let i = 0; i < args.length; i++) {
    values[i] = args[i]();
  }

  // The signals read while rendering or refreshing the instance are not dependencies of the arguments
  untracked(() => run.instance ? updateInstance(run.instance, run.template.parameters, values) : renderInstance(run, values));
}

/**
 * Renders the instance of a `@render`, getting its nodes with the strategy of the context rendering it, after the
 * `<!---->` the server wrote before it, if any.
 *
 * @param run - The `@render`.
 * @param values - The values of the arguments.
 */
function renderInstance(run: RenderRun, values: unknown[]): void {
  const { parentNode, parentContext, template } = run;
  const { nodeStrategy } = parentContext;
  nodeStrategy.separator(parentNode, run.separated);
  run.instance = template.render(parentNode, template.context, run.referenceNode, values, nodeStrategy);
  parentContext.addChild(run.instance);
}

/**
 * Writes the new values of the arguments into the parameters of an instance, then refreshes it with the names of the
 * ones that changed, if any.
 *
 * @param instance - The context of the instance.
 * @param parameters - The names of the parameters of the template.
 * @param values - The values of the arguments, one for each parameter passed.
 */
function updateInstance(instance: _Context, parameters: readonly string[], values: unknown[]): void {
  let changed: string[] | null = null;
  for (let i = 0; i < values.length; i++) {
    const name = parameters[i];
    if (instance.update(name, values[i])) {
      changed ? changed.push(name) : changed = [name];
    }
  }

  if (changed) {
    instance.refresh(changed);
  }
}
