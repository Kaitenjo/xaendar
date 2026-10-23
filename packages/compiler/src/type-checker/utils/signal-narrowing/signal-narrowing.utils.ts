import { type Expression, forEachChild, type Node } from 'typescript';
import { getSignalCallee, resolveExpression, ROOT_NODE } from '../../../generator/utils/generator/generator.utils';
import type { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { Line } from '../../types/generated-line.type';
import { plain } from '../line-builder/line-builder.utils';

/**
 * Declares the constants holding the values of the signals the conditions of an `@if` chain call without arguments,
 * and registers them in the scope of the chain (see `addNarrowedSignal`): the conditions and the branches read each
 * signal through its constant, which TypeScript narrows, e.g. leaving out `null` and `undefined` in the branch of
 * `@if (user())`, while calling the signal again would read its whole type. A signal read without being called, e.g.
 * passed to a function, stays the signal.
 *
 * A signal an enclosing `@if` chain already narrows keeps its constant, so that the narrowings add up.
 *
 * @example
 * // @if (user()) { { user().name } }
 * const __if12_user = root.user();
 * if ((root.user(), __if12_user)) {
 *   (root.user(), __if12_user).name;
 * }
 *
 * @param conditions - The conditions of the chain, in order.
 * @param prefix - The prefix of the names of the constants, telling the chain apart from the other ones.
 * @param context - The scope enclosing the chain, which the constants are declared in.
 * @param chainContext - The scope of the chain, enclosing its conditions and its branches.
 * @returns The lines declaring the constants, to write before the chain.
 */
export function narrowSignals(conditions: readonly Expression[], prefix: string, context: TypeCheckContext, chainContext: TypeCheckContext): Line[] {
  const declarations = new Array<Line>();
  const visit = (node: Node): void => {
    const callee = getSignalCallee(node);
    if (callee && !chainContext.getNarrowedSignal(callee.text) && resolveExpression(callee, context, { resolver: ROOT_NODE }).reactive) {
      const value = `${prefix}_${callee.text}`;
      // Not mapped onto the template: the condition reports the errors of the call, which it keeps
      declarations.push(plain(`const ${value} = ${resolveExpression(node as Expression, context, { resolver: ROOT_NODE, preserveNonNull: true }).expression};`));
      chainContext.addNarrowedSignal(callee.text, value);
    }

    forEachChild(node, visit);
  };

  for (let i = 0; i < conditions.length; i++) {
    visit(conditions[i]);
  }

  return declarations;
}
