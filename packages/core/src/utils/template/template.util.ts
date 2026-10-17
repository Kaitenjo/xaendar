import type { Function, NoArgsFunction } from '@xaendar/types';
import { computed } from '../../signals/computed/computed';
import type { Computed } from '../../signals/types/computed.type';
import { untracked } from '../../signals/untracked';
import type { _Context } from '../context/context.util';

/**
 * Renders an instance of a template, as the compiler-generated render code does: it receives the element the instance
 * is rendered into, the context of the scope declaring the template, the node the instance is rendered before and the
 * signals of the parameters, and returns the context it creates for the instance.
 */
type RenderTemplate = Function<[parentNode: Element, declarationContext: _Context, referenceNode: Comment | null, params: Computed<unknown>[]], _Context>;

/**
 * A template declared in a template, e.g. `<template #row(item: Item)>`, as the scope declaring it holds it.
 */
export type _Template = {
  /**
   * The context of the scope declaring the template: the content of the template reads the names visible there.
   */
  readonly context: _Context;
  /**
   * Renders an instance of the template.
   */
  readonly render: RenderTemplate;
};

/**
 * Creates the value of a template, which the scope declaring it holds under its name.
 *
 * @param context - The context of the scope declaring the template.
 * @param render - The function rendering an instance of the template.
 * @returns The template.
 */
export function _template(context: _Context, render: RenderTemplate): _Template {
  return { context, render };
}

/**
 * Returns the signal of a parameter of an instance of a template: the one of its argument, or, when the `@render` leaves
 * the argument out, the one of its default value, `undefined` for an optional parameter. An argument passed as
 * `undefined` is not left out: the parameter holds `undefined`.
 *
 * @param params - The signals of the arguments the `@render` passes, in the order of the parameters.
 * @param index - The position of the parameter.
 * @param initializer - Computes the default value of the parameter, reading the parameters before it in the context of
 *   the instance; omitted for an optional parameter.
 * @returns The signal of the parameter.
 */
export function _parameter(params: Computed<unknown>[], index: number, initializer?: NoArgsFunction<unknown>): Computed<unknown> {
  return index < params.length ? params[index] : computed(initializer ?? (() => undefined));
}

/**
 * Renders an instance of a template, e.g. for `@render row(item())`.
 *
 * Each argument becomes the signal of its parameter: the instance is rendered once, and only the nodes reading a
 * parameter are updated when its argument changes. The context of the instance is a child of the context of the scope
 * declaring the template, so its content reads the names visible there, but it is owned by the context rendering it:
 * it is destroyed with it, and its nodes move with it (e.g. with the row of a `@for`).
 *
 * @param parentNode - The element the instance is rendered into.
 * @param parentContext - The context rendering the instance, which owns it.
 * @param referenceNode - The node the instance is rendered before, `null` to append it to `parentNode`.
 * @param template - The template.
 * @param args - The functions computing the arguments, one for each parameter.
 */
export function _renderTemplate(parentNode: Element, parentContext: _Context, referenceNode: Comment | null, template: _Template, args: NoArgsFunction<unknown>[]): void {
  const params = args.map(arg => computed(arg));
  // The signals read while rendering the instance are not dependencies of the code rendering it
  const context = untracked(() => template.render(parentNode, template.context, referenceNode, params));
  parentContext.addChild(context);
}
