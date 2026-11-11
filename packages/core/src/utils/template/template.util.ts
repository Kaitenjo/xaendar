import { _bindEffect } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { RenderRun } from '../../types/render-run.type';
import type { RenderTemplateConfig } from '../../types/render-template-config.type';
import type { TemplateExpression } from '../../types/template-expression.type';
import type { _Template } from '../../types/template.type';
import type { _Context } from '../context/context.util';
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
 * @param index - The position of the parameter.
 * @param name - The name of the parameter.
 * @param initializer - The expression computing the default value of the parameter, reading the parameters before it in
 *   the context of the instance: a function of the module of the template (see `TemplateExpression`).
 * @param reads - The names of the variables of the template the default value reads, omitted when it reads none.
 */
export function _parameter(context: _Context, params: readonly unknown[], index: number, name: string, initializer: TemplateExpression<unknown>, reads?: readonly string[]): void {
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
 * The template is the one the scope declaring it holds under its name, a constant of the module (see `_Template`), and
 * the context of the instance is a child of the context of that scope (see `_Context.ownerOf`), so its content reads the
 * names visible there, but it is owned by the context rendering it: it is destroyed with it, and its nodes move with it
 * (e.g. with the row of a `@for`). Its nodes are got with the strategy of the context rendering it: in the hydration of
 * a component, the ones the server rendered there are adopted.
 *
 * The arguments are a binding (see `_bindEffect`): they are computed again whenever a signal, or a variable of the
 * template, they read changes. The first run renders the instance, whose parameters are the values of the arguments; a
 * later one writes the values that changed into the context of the instance and refreshes it with their names (see
 * `_Context.refresh`): the instance is rendered once, and only the bindings reading a parameter run again.
 *
 * @param parentNode - The element the instance is rendered into.
 * @param parentContext - The context rendering the instance, which owns it and which the arguments read.
 * @param referenceNode - The node the instance is rendered before, `null` to append it to `parentNode`.
 * @param config - The `@render`, a constant of the module of the template.
 * @throws A `ReferenceError` when no scope of the chain declares the template.
 */
export function _renderTemplate(parentNode: Element, parentContext: _Context, referenceNode: Comment | null, config: RenderTemplateConfig): void {
  const owner = parentContext.ownerOf(config.template);
  const template = owner.get(config.template) as _Template;
  const run: RenderRun = { parentNode, parentContext, referenceNode, config, owner, template, instance: null };
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
  const values = args ? args.call(parentContext.component, parentContext) : NO_ARGUMENTS;

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
function renderInstance(run: RenderRun, values: readonly unknown[]): void {
  const { parentNode, parentContext, template } = run;
  const { nodeStrategy } = parentContext;
  nodeStrategy.separator(parentNode, !!run.config.separated);
  run.instance = template.render(parentNode, run.owner, run.referenceNode, values, nodeStrategy);
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
function updateInstance(instance: _Context, parameters: readonly string[], values: readonly unknown[]): void {
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
