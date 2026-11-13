import { _bindSite } from '../../signals/effect/effect';
import { untracked } from '../../signals/untracked';
import type { LetBinding } from '../../types/let-binding.type';
import type { RenderTemplateConfig } from '../../types/render-template-config.type';
import type { _Template } from '../../types/template.type';
import type { _BoundTemplate } from '../../types/bound-template.type';
import { BRANCH, COMPONENT, CONTENT, HEADER, PARENT, POSITION } from '../../costants';
import type { _Context } from '../../types/context.type';
import { _declare, blockAnchor, blockParent, clear, containerSlot, getNodeStrategy, refresh, update } from '../context/context.util';
import { _let } from '../let/let.util';

/**
 * The values of the arguments of a `@render` passing none, shared by every one of them: the function rendering the
 * instance only reads them.
 */
const NO_ARGUMENTS: readonly unknown[] = Object.freeze([]);

/**
 * The templates read as values from each scope declaring them (see {@link _templateRef}): one, or an array of them.
 */
const boundTemplates = new WeakMap<_Context, _BoundTemplate | _BoundTemplate[]>();

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
 * The template is a constant of the module (see `_Template`), or the value of an expression (see `_templateRef`), a
 * template another component declares passed as an input or as content, and the context of the instance is a child of
 * the context of the scope declaring it, `depth` scopes up the chain of the context rendering it or the one the value
 * holds, so its content reads the
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
 * {@link _renderTemplate}, shared by every `@render`, which the compiler names in the binding. Only the arguments, and
 * the expression giving the template of a `@render` calling one (`@render rowTemplate()(item)`), are tracked: when the
 * template it gives changes, the instance is replaced, and none is rendered while it gives `null` or `undefined`. The
 * instance, where it renders, and the template rendered for an expression (in place of the branch of an `@if`) live in
 * the container of the `@render` (see `CONTAINER_SLOTS`).
 *
 * @param context - The context rendering the instance.
 * @param _target - Unused: the `@render` keeps its state in its container.
 * @param config - The `@render`.
 */
export function _runRender(context: _Context, _target: unknown, config: RenderTemplateConfig): void {
  const { args, ref } = config;
  const component = context[COMPONENT];
  const container = containerSlot(context, config.container);
  // The template the @render calls by name, or the one its expression gives, found again at each run
  const bound = ref ? ref.call(component, context) ?? null : undefined;
  const values = args ? args.call(component, context) : NO_ARGUMENTS;

  // The signals read while rendering or refreshing the instance are not dependencies of the template, nor of the arguments
  untracked(() => {
    const instance = context[container + CONTENT] as _Context | null | undefined;
    // The first run passes over the `<!---->` the server wrote before the instance, if any, even when it renders none
    if (instance === undefined) {
      getNodeStrategy(context).separator(blockParent(context[container + POSITION] as Node) as Element, !!config.separated);
    }

    if (bound === undefined) {
      instance ? updateInstance(instance, config.template!.parameters, values) : renderInstance(context, container, config.template!, findDeclaringScope(context, config.depth), values);
    } else if (bound !== context[container + BRANCH]) {
      replaceInstance(context, container, bound, values, instance);
    } else if (instance) {
      // An instance is there only for a template
      updateInstance(instance, bound!.template.parameters, values);
    }
  });
}

/**
 * Creates the value of a template read by an expression of the template declaring it, e.g. `rowTemplate="{row}"`
 * (see `TemplateRef`): the template, and the scope declaring it, `depth` scopes up the chain of the context reading it.
 * Reading the template again in the same scope gives the same value, so that an input bound to it is not set again.
 *
 * N.B. Deliberate, to save memory: the values are created only when a template is read, and kept by a `WeakMap` of the
 * scopes, one value or an array of the exact number of templates read from the scope, instead of an object created with
 * each scope declaring a template, read or not, or a `Map` per scope. Do not keep them in the scopes.
 *
 * @param context - The context of the expression.
 * @param depth - How many scopes up the chain the scope declaring the template is, `0` for `context` itself.
 * @param template - What describes the template: its constant in the browser, the function writing it on the server.
 * @returns The template as a value.
 */
export function _templateRef<Template>(context: _Context, depth: number, template: Template): _BoundTemplate<Template> {
  const scope = findDeclaringScope(context, depth);
  const known = boundTemplates.get(scope) as _BoundTemplate<Template> | _BoundTemplate<Template>[] | undefined;
  const found = Array.isArray(known) ? known.find(bound => bound.template === template) : known?.template === template ? known : undefined;
  if (found) {
    return found;
  }

  const bound: _BoundTemplate<Template> = Object.freeze({ template, context: scope });
  boundTemplates.set(scope, known ? ([] as _BoundTemplate<Template>[]).concat(known, bound) : bound);
  return bound;
}

/**
 * Finds the scope declaring a template, `depth` scopes up the chain of a context.
 *
 * @param context - The context.
 * @param depth - How many scopes up the scope is, `0` or `undefined` for `context` itself.
 * @returns The scope.
 */
function findDeclaringScope(context: _Context, depth: number | undefined): _Context {
  let owner = context;
  for (let i = 0; i < (depth ?? 0); i++) {
    owner = owner[PARENT]!;
  }

  return owner;
}

/**
 * Replaces the instance of a `@render` calling an expression, when the template it gives changes: the instance of the
 * previous one, if any, is destroyed, and the new template, if any, is rendered, its content reading the scope
 * declaring it. The template rendered is kept in the container of the `@render`, in place of the branch of an `@if`.
 *
 * @param context - The context rendering the instance.
 * @param container - The first slot of the container of the `@render`.
 * @param bound - The template, `null` to render none.
 * @param values - The values of the arguments.
 * @param instance - The instance rendered, if any.
 */
function replaceInstance(context: _Context, container: number, bound: _BoundTemplate<_Template> | null, values: readonly unknown[], instance: _Context | null | undefined): void {
  if (instance) {
    clear(instance);
  }

  context[container + BRANCH] = bound;
  context[container + CONTENT] = null;
  if (bound) {
    renderInstance(context, container, bound.template, bound.context, values);
  }
}

/**
 * Renders the instance of a `@render`, getting its nodes with the strategy of the context rendering it. The parent of
 * its context is the scope declaring the template.
 *
 * @param context - The context rendering the instance.
 * @param container - The first slot of the container of the `@render`.
 * @param template - The template.
 * @param owner - The scope declaring the template.
 * @param values - The values of the arguments.
 */
function renderInstance(context: _Context, container: number, template: _Template, owner: _Context, values: readonly unknown[]): void {
  const position = context[container + POSITION] as Node;
  context[container + CONTENT] = template.render(blockParent(position) as Element, owner, blockAnchor(position), values, getNodeStrategy(context));
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
