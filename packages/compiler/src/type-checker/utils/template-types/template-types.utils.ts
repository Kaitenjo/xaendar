import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import type { Line } from '../../types/line.type';
import { plain } from '../line-builder/line-builder.utils';

/**
 * The type of a template: it carries the parameters of the function its content is type-checked in, as a labeled
 * tuple. A template is not callable: only a `@render` renders it. It has the shape of `TemplateRef` of
 * `@xaendar/core`, so that a template read as a value is accepted where a `TemplateRef` taking the same arguments is,
 * e.g. by an input: a function taking the parameters, so that a template accepting more than the arguments passed is
 * accepted too.
 */
export const TEMPLATE = '__Template';

/**
 * The function each `@render` is checked through: called with the template and the number of arguments the `@render`
 * passes, it returns a function taking them, so that their number and their types are checked like the ones of a
 * function call. A parameter whose argument is passed takes its type as declared: `undefined` is not an argument left
 * out. The template may be `null` or `undefined`, the value of an expression giving none, for which nothing renders.
 */
export const RENDER = '__render';

/**
 * Returns the declarations of the types and of the functions the type-check code of templates is written with, at the
 * top level of the type-check code.
 *
 * @returns The lines declaring {@link TEMPLATE} and {@link RENDER}, with the type turning the parameters of a template
 *   into the arguments of a `@render`.
 */
export function getTemplateHelpers(): Line[] {
  return [
    plain(`type ${TEMPLATE}<Params extends unknown[]> = { readonly __template: (...params: Params) => void };`),
    plain('type __Arguments<Params extends unknown[], Count extends number> = Params[\'length\'] extends Count ? Params : Params extends [...infer Head, unknown] ? __Arguments<Head, Count> : Params;'),
    plain(`declare function ${RENDER}<Params extends unknown[], Count extends number>(template: ${TEMPLATE}<Params> | null | undefined, count: Count): (...args: Count extends Params['length'] ? __Arguments<Required<Params>, Count> : Params) => void;`)
  ];
}

/**
 * Returns the name of the constant the value of a `@let` is type-checked in, where the `@let` is written: the `@let`
 * itself is declared at the start of its scope, typed with the type of the constant.
 *
 * @param node - The `@let`.
 * @returns The name of the constant, told apart from the ones of the other `@let` by the position of the `@let`.
 */
export function getLetValue(node: Pick<LetNode, 'span'>): string {
  return `__let${node.span.start}`;
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
