import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import type { Line } from '../../types/generated-line.type';
import { plain } from '../line-builder/line-builder.utils';

/**
 * The type of a template: it carries the parameters of the function its content is type-checked in, as a labeled
 * tuple. A template is not callable: only a `@render` renders it.
 */
export const TEMPLATE = '__Template';

/**
 * The type of a parameter of a template in its content: the signal of its value.
 */
export const PARAMETER = '__Parameter';

/**
 * The function each `@render` is checked through: called with the template and the number of arguments the `@render`
 * passes, it returns a function taking them, so that their number and their types are checked like the ones of a
 * function call. A parameter whose argument is passed takes its type as declared: `undefined` is not an argument left
 * out.
 */
export const RENDER = '__render';

/**
 * The function the default value of a parameter is passed to, typing the parameter with the signal of its value.
 */
export const DEFAULT = '__default';

/**
 * The function an optional parameter is initialized with, typing it with the signal of its value or `undefined`.
 */
export const OPTIONAL = '__optional';

/**
 * Returns the declarations of the types and of the functions the type-check code of templates is written with, at the
 * top level of the type-check code.
 *
 * @returns The lines declaring {@link TEMPLATE}, {@link PARAMETER}, {@link RENDER}, {@link DEFAULT} and {@link OPTIONAL},
 *   with the types turning the parameters of a template into the arguments of a `@render`.
 */
export function getTemplateHelpers(): Line[] {
  return [
    plain(`type ${TEMPLATE}<Params extends unknown[]> = { readonly __params: Params };`),
    plain(`type ${PARAMETER}<Value> = import('@xaendar/core/signals').Computed<Value>;`),
    plain(`type __Values<Params extends unknown[]> = { [Key in keyof Params]: Exclude<Params[Key], undefined> extends ${PARAMETER}<infer Value> ? Value : never };`),
    plain('type __Arguments<Params extends unknown[], Count extends number> = Params[\'length\'] extends Count ? Params : Params extends [...infer Head, unknown] ? __Arguments<Head, Count> : Params;'),
    plain(`declare function ${RENDER}<Params extends unknown[], Count extends number>(template: ${TEMPLATE}<Params>, count: Count): (...args: Count extends Params['length'] ? __Arguments<__Values<Required<Params>>, Count> : __Values<Params>) => void;`),
    plain(`declare function ${DEFAULT}<Value>(value: Value): ${PARAMETER}<Value>;`),
    plain(`declare function ${OPTIONAL}<Value>(): ${PARAMETER}<Value | undefined>;`)
  ];
}

/**
 * Returns the name of the type of the parameters of a template, the labeled tuple of the parameters of the function its
 * content is type-checked in: the declaration of the template reads it, so that the types of the parameters typed by
 * their default value are the ones TypeScript infers.
 *
 * @param template - The template.
 * @returns The name of the type, told apart from the ones of the other templates by the position of the template.
 */
export function getParametersType(template: Pick<TemplateNode, 'span'>): string {
  return `__Params${template.span.start}`;
}

/**
 * Returns the name of the function the content of a template is type-checked in, whose parameters are the ones of the
 * template.
 *
 * @param template - The template.
 * @returns The name of the function, told apart from the ones of the other templates by the position of the template.
 */
export function getContentFunction(template: Pick<TemplateNode, 'span'>): string {
  return `__template${template.span.start}`;
}
