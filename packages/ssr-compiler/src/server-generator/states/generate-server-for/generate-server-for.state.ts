import { CompilerContext, getBlockIdentifier, resolveExpression, type ForImplicitVariables, type ForNode } from '@xaendar/compiler';
import type { ServerFunctionToProcess } from '../../types/server-function-to-process.type';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code of a `@for`: a loop rendering the body once per item, through the function rendering it, named
 * like the one of the client. A numeric iterable `n` is iterated as `0, 1, …, n - 1`. The body declares the item and the
 * implicit variables as signals, as the one of the client does, so that its expressions read them the same way.
 *
 * @example
 * // @for (user of users(); track user().id) { … }
 * {
 *   const items = _ssrItems(this.users());
 *   for (let index = 0; index < items.length; index++) {
 *     for0.call(this, out, context, items, index);
 *   }
 * }
 *
 * @param node - The `@for` node.
 * @param parent - Where the body is rendered.
 * @param index - The position of the node among its siblings.
 * @param compilerContext - The compiler context of the node.
 * @returns The code of the node, and the function rendering its body.
 */
export function generateServerFor(node: ForNode, parent: ServerParent, index: string, compilerContext: CompilerContext): ServerTransitionResult {
  const { itemAlias } = node;
  const iterable = resolveExpression(node.iterableExpression, compilerContext, SERVER_RESOLVE_OPTIONS).expression;
  const implicitNames: Readonly<Record<ForImplicitVariables, string>> = {
    $index: resolveImplicit(node, '$index'),
    $first: resolveImplicit(node, '$first'),
    $last: resolveImplicit(node, '$last'),
    $even: resolveImplicit(node, '$even'),
    $odd: resolveImplicit(node, '$odd')
  };

  const context = new CompilerContext(compilerContext);
  if (itemAlias) {
    context.addIdentifier(itemAlias, 'signal');
  }
  const names = Object.values(implicitNames);
  for (let i = 0; i < names.length; i++) {
    context.addIdentifier(names[i], 'signal');
  }

  const aliases = Object.entries(implicitNames).map(([implicit, name]) => `${implicit}: '${name}'`).join(', ');
  const key = getBlockIdentifier('for', parent.id, index);
  const functionsToProcess = new Map<string, ServerFunctionToProcess>([[key, {
    fn: {
      node,
      context,
      parent: { id: key, tag: parent.tag },
      precode: `_iterationVariables(context, items, index, ${itemAlias ? `'${itemAlias}'` : 'undefined'}, { ${aliases} });`
    },
    args: ['out', 'parentContext', 'items', 'index']
  }]]);

  const statement = [
    '{',
    `  const items = _ssrItems(${iterable});`,
    '  for (let index = 0; index < items.length; index++) {',
    `    ${key}.call(this, out, context, items, index);`,
    '  }',
    '}'
  ].join('\n');

  return { pieces: [{ statement }], functionsToProcess };
}

/**
 * Resolves the name of an implicit variable of a `@for`: the alias the template declares for it (`; $index = i`), or
 * its own name.
 *
 * @param node - The `@for` node.
 * @param implicit - The implicit variable.
 * @returns The name of the variable.
 */
function resolveImplicit(node: ForNode, implicit: ForImplicitVariables): string {
  return node.implicitAliases.get(implicit) ?? implicit;
}
