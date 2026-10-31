import type { ForImplicitVariables } from '../../types/nodes/for-implicit-variables.type';
import type { ForNode } from '../../types/nodes/for-node.type';

/**
 * The implicit variables declared by every `@for` block.
 */
const FOR_IMPLICIT_VARIABLES: readonly ForImplicitVariables[] = ['$index', '$first', '$last', '$even', '$odd'];

/**
 * Returns the names of the variables a `@for` block declares: the item alias and the implicit variables, by their alias if any.
 *
 * @param node - The `@for` block, or the item alias and the aliases of the implicit variables it declares.
 * @returns The names of the variables.
 */
export function getForVariables(node: Pick<ForNode, 'itemAlias' | 'implicitAliases'>): string[] {
  const variables = new Array<string>();
  if (node.itemAlias) {
    variables.push(node.itemAlias);
  }

  for (let i = 0; i < FOR_IMPLICIT_VARIABLES.length; i++) {
    const implicit = FOR_IMPLICIT_VARIABLES[i];
    variables.push(node.implicitAliases.get(implicit) ?? implicit);
  }

  return variables;
}
