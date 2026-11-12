import { _bindSite } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { LetBinding } from '../../types/let-binding.type';
import type { RenderTemplateConfig } from '../../types/render-template-config.type';
import type { _Template } from '../../types/template.type';
import { COMPONENT, CONTENT, HEADER, PARENT, POSITION } from '../../costants';
import type { _Context } from '../../types/context.type';
import { _declare, blockAnchor, blockParent, containerSlot, getNodeStrategy, refresh, update } from '../context/context.util';
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
 * @param binding - The binding of the default value: the expression computing it, reading the parameters before it in
 *   the context of the instance, the slot of the parameter, whose position it tells, since the parameters are the first
 *   variables of the context, and its identifier (see `LetBinding`).
 */
export function _parameter(context: _Context, params: readonly unknown[], binding: LetBinding): void {
  const slot = binding.variable;
  const index = slot - HEADER;
  if (index < params.length) {
    context[slot] = params[index];
    return;
  }

  _declare(context, slot, 'let');
  _let(context, binding);
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
 * The arguments are a binding (see `_bindSite`): they are computed again whenever a signal, or a variable of the
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
  // The instance renders before the node, or at the end of the element when there is none
  parentContext[containerSlot(parentContext, config.container) + POSITION] = referenceNode ?? parentNode;
  _bindSite(parentContext, config, undefined, _runRender);
}

/**
 * Computes the arguments of a `@render`, then renders its instance, or updates it: the callback of the binding of
 * {@link _renderTemplate}, shared by every `@render`, which the compiler names in the binding. Only the arguments are
 * tracked. The instance, and where it renders, live in the container of the `@render` (see `CONTAINER_SLOTS`).
 *
 * @param context - The context rendering the instance.
 * @param _target - Unused: the `@render` keeps its state in its container.
 * @param config - The `@render`.
 */
export function _runRender(context: _Context, _target: unknown, config: RenderTemplateConfig): void {
  const { args } = config;
  const values = args ? args.call(context[COMPONENT], context) : NO_ARGUMENTS;
  const container = containerSlot(context, config.container);

  // The signals read while rendering or refreshing the instance are not dependencies of the arguments
  const instance = context[container + CONTENT] as _Context | undefined;
  untracked(() => instance ? updateInstance(instance, config.template.parameters, values) : renderInstance(context, config, container, values));
}

/**
 * Renders the instance of a `@render`, getting its nodes with the strategy of the context rendering it, after the
 * `<!---->` the server wrote before it, if any. The parent of its context is the scope declaring the template, `depth`
 * scopes up the chain of the context rendering it.
 *
 * @param context - The context rendering the instance.
 * @param config - The `@render`.
 * @param container - The first slot of the container of the `@render`.
 * @param values - The values of the arguments.
 */
function renderInstance(context: _Context, config: RenderTemplateConfig, container: number, values: readonly unknown[]): void {
  let owner = context;
  for (let i = 0; i < (config.depth ?? 0); i++) {
    owner = owner[PARENT]!;
  }

  const position = context[container + POSITION] as Node;
  const parentNode = blockParent(position) as Element;
  const nodeStrategy = getNodeStrategy(context);
  nodeStrategy.separator(parentNode, !!config.separated);
  context[container + CONTENT] = config.template.render(parentNode, owner, blockAnchor(position), values, nodeStrategy);
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
