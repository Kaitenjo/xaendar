import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import type { Line } from '../../types/generated-line.type';
import { plain } from '../line-builder/line-builder.utils';

/**
 * The type of a template: it carries the types of its parameters, as a labeled tuple. A template is not callable: only
 * a `@render` renders it.
 */
export const TEMPLATE = '__Template';

/**
 * The type of the parameters of a template in its content: the signal of each of them.
 */
export const PARAMETERS = '__Parameters';

/**
 * The function each `@render` is checked through: called with the template, it returns a function taking the arguments
 * of its parameters, so that their number and their types are checked like the ones of a function call.
 */
export const RENDER = '__render';

/**
 * Returns the declarations of the types and of the function the type-check code of templates is written with, at the
 * top level of the type-check code.
 *
 * @returns The lines declaring {@link TEMPLATE}, {@link PARAMETERS} and {@link RENDER}.
 */
export function getTemplateHelpers(): Line[] {
  return [
    plain(`type ${TEMPLATE}<Params extends unknown[]> = { readonly __params: Params };`),
    plain(`type ${PARAMETERS}<Values extends unknown[]> = { [Key in keyof Values]: import('@xaendar/core/signals').Computed<Values[Key]> };`),
    plain(`declare function ${RENDER}<Params extends unknown[]>(template: ${TEMPLATE}<Params>): (...args: Params) => void;`)
  ];
}

/**
 * Returns the name of the type of the parameters of a template, the labeled tuple of their types: the declaration of
 * the template and its content read it, so that the types are written once, and a parameter named like the template
 * doesn't hide it.
 *
 * @param template - The template.
 * @returns The name of the type, told apart from the ones of the other templates by the position of the template.
 */
export function getParametersType(template: Pick<TemplateNode, 'span'>): string {
  return `__Params${template.span.start}`;
}
