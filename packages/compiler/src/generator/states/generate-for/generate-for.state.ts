import { ForImplicitVariables } from '../../../parser/types/nodes/for-implicit-variables';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getBlockIdentifier, getTextIdentifier, resolveExpression } from '../../utils/generator/generator.utils';

/**
 * Generates code for a `@for` iteration node.
 *
 * Emits a classic index-based `for` loop with all implicit variables
 * declared at the top of the loop body:
 *
 * ```javascript
 * for (let $i = 0; $i < ctx_items.length; $i++) {
 *   const item = items[$i];
 *   const $index = $i;
 *   const $first = $i === 0;
 *   const $last  = $i === items.length - 1;
 *   const $even  = $i % 2 === 0;
 *   const $odd   = $i % 2 !== 0;
 *   // ... child nodes
 * }
 * ```
 *
 * The iterable expression is resolved through the active {@link CompilerContext}
 * like any other template expression. A numeric iterable `n` is turned into
 * `0, 1, ..., n - 1` at runtime by `_for`. When the `item of` part is omitted
 * no item alias is declared, and the item parameter of the track function is `_`.
 *
 * The internal loop counter is always named `$i_<nodeName>` to avoid
 * collisions when `@for` blocks are nested.
 *
 * @param node - The `ForNode` to process.
 * @param index - Base variable name prefix used for child nodes and
 *   to produce a unique loop counter identifier.
 * @param parentNode - Variable name of the parent DOM node.
 * @param compilerContext - The enclosing scope context.
 * @returns Array of generated code lines.
 */
export async function generateFor(node: ForNode, parentNode: string, index: string, compilerContext: CompilerContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  }

  const iterableExpr = resolveExpression(node.iterableExpression, compilerContext).expression;
  const itemName = node.itemAlias ?? '_';

  const itemsName = getTextIdentifier('items', parentNode, index);
  const counterName = getTextIdentifier('i', parentNode, index);

  const indexName = resolveImplicit(node, '$index');
  const firstName = resolveImplicit(node, '$first');
  const lastName = resolveImplicit(node, '$last');
  const evenName = resolveImplicit(node, '$even');
  const oddName = resolveImplicit(node, '$odd');
  const forContext = new CompilerContext(compilerContext);

  // The item is a signal, like the implicit variables: it is updated when the row is reused for a new item with the same key
  if (node.itemAlias) {
    forContext.addIdentifier(node.itemAlias, 'signal');
  }
  const identifiers = [indexName, firstName, lastName, evenName, oddName];
  for (let i = 0; i < identifiers.length; i++) {
    forContext.addIdentifier(identifiers[i], 'signal');
  }

  const forKey = getBlockIdentifier('for', parentNode, index);
  retVal.functionsToProcess!.set(forKey, {
    fn: {
      precode:
`const { vars, update } = _iterationVariables(context, ${itemsName}, ${counterName}, ${node.itemAlias ? `'${node.itemAlias}'` : undefined}, {
    $index: '${indexName}', 
    $first: '${firstName}', 
    $last: '${lastName}', 
    $even: '${evenName}', 
    $odd: '${oddName}' 
  });
  const { ${[node.itemAlias, ...identifiers].filter(Boolean).join(', ')} } = vars;`,
      node,
      parentNode: forKey,
      context: forContext,
      anchor: 'anchor',
      isForBody: true
    },
    args: [forKey, 'parentContext', itemsName, counterName, 'anchor']
  });

  /*
    The track expression is a function written where the @for is, outside of the context of its rows: the item and
    the implicit variables are its parameters, read as written, while the members of the component, the imports and
    the variables of the enclosing scopes are resolved like in any other expression of the scope of the @for
  */
  const trackContext = new CompilerContext(compilerContext);
  if (node.itemAlias) {
    trackContext.addUnresolvableIdentifier(node.itemAlias, 'signal');
  }
  for (let i = 0; i < identifiers.length; i++) {
    trackContext.addUnresolvableIdentifier(identifiers[i], 'signal');
  }

  const trackParameters = [itemName, ...identifiers].join(', ');
  retVal.code.push(`_for(${parentNode}, context, ${anchor}, () => ${iterableExpr}, (${trackParameters}) => ${resolveExpression(node.trackExpression, trackContext).expression}, ${forKey}.bind(this));`);

  return retVal
}

/**
 * Resolves the name that should be used in generated code for a given
 * implicit variable.
 *
 * If the template declared an explicit alias for the variable
 * (e.g. `; $index = i`) that alias is returned. Otherwise the default
 * implicit variable name (e.g. `$index`) is used.
 *
 * @param node - The `ForNode` whose implicit alias map is consulted.
 * @param implicit - The implicit variable to look up (e.g. `'$index'`).
 * @returns The alias string if one was declared, otherwise `implicit` itself.
 */
function resolveImplicit(node: ForNode, implicit: ForImplicitVariables): string {
  return node.implicitAliases.get(implicit) ?? implicit;
}