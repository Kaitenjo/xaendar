import { ForImplicitVariables } from '../../../parser/types/nodes/for-implicit-variables.type';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getReadForVariables } from '../../utils/for-reads/for-reads.utils';
import { getBlockIdentifier, getTextIdentifier, resolveExpression } from '../../utils/generator/generator.utils';

/**
 * Generates code for a `@for` iteration node.
 *
 * Emits a call of `_for`, and the function rendering the body of an item, which declares the item and the implicit
 * variables the body reads (see {@link getReadForVariables}) as signals, created by `_iterationVariables`:
 *
 * ```javascript
 * // @for (row of rows(); track row().id) { <td>{ row().name }</td> }
 * function for0(for0, parentContext, items0, i0, anchor, nodeStrategy) {
 *   const context = new _Context(parentContext, nodeStrategy);
 *   const { vars, update } = _iterationVariables(context, items0, i0, 'row', {
 *     $index: '$index', $first: '$first', $last: '$last', $even: '$even', $odd: '$odd'
 *   }, ['item']);
 *   const { row } = vars;
 *   // ... child nodes
 *   return { context, update };
 * }
 * ```
 *
 * The iterable expression is resolved through the active {@link GeneratorContext}
 * like any other template expression. A numeric iterable `n` is turned into
 * `0, 1, ..., n - 1` at runtime by `_for`. When the `item of` part is omitted
 * no item alias is declared, and the item parameter of the track function is `_`.
 * The track function takes the item and every implicit variable, whether the body reads them or not.
 *
 * @param node - The `ForNode` to process.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - Base variable name prefix used for child nodes and
 *   to produce a unique loop counter identifier.
 * @param generatorContext - The enclosing scope context.
 * @param anchor - The node the items are inserted before, `null` to append them.
 * @returns The `_for` call, and the function rendering the body of an item to generate.
 */
export async function generateFor(node: ForNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  }

  const iterableExpr = resolveExpression(node.iterableExpression, generatorContext).expression;
  const itemName = node.itemAlias ?? '_';

  const itemsName = getTextIdentifier('items', parentNode, index);
  const counterName = getTextIdentifier('i', parentNode, index);

  const indexName = resolveImplicit(node, '$index');
  const firstName = resolveImplicit(node, '$first');
  const lastName = resolveImplicit(node, '$last');
  const evenName = resolveImplicit(node, '$even');
  const oddName = resolveImplicit(node, '$odd');
  const forContext = new GeneratorContext(generatorContext);
  const identifiers = [indexName, firstName, lastName, evenName, oddName];

  /*
    Only the variables the body reads are created for each item, a signal each: the item is a signal, like the implicit
    variables, updated when the row is reused for a new item with the same key
  */
  const read = getReadForVariables(node);
  const readNames = read.map(variable => variable === 'item' ? node.itemAlias! : resolveImplicit(node, variable));
  for (let i = 0; i < readNames.length; i++) {
    forContext.addIdentifier(readNames[i], 'signal');
  }

  const precode = [
    `const { ${readNames.length ? 'vars, ' : ''}update } = _iterationVariables(context, ${itemsName}, ${counterName}, ${node.itemAlias ? `'${node.itemAlias}'` : undefined}, {`,
    `    $index: '${indexName}', $first: '${firstName}', $last: '${lastName}', $even: '${evenName}', $odd: '${oddName}'`,
    `  }, [${read.map(variable => `'${variable}'`).join(', ')}]);`
  ];
  if (readNames.length) {
    precode.push(`  const { ${readNames.join(', ')} } = vars;`);
  }

  const forKey = getBlockIdentifier('for', parentNode, index);
  retVal.functionsToProcess!.set(forKey, {
    fn: {
      precode: precode.join('\n'),
      node,
      parentNode: forKey,
      context: forContext,
      anchor: 'anchor',
      isForBody: true
    },
    args: [forKey, 'parentContext', itemsName, counterName, 'anchor', 'nodeStrategy']
  });

  /*
    The track expression is a function written where the @for is, outside of the context of its rows: the item and
    the implicit variables are its parameters, read as written, while the members of the component, the imports and
    the variables of the enclosing scopes are resolved like in any other expression of the scope of the @for
  */
  const trackContext = new GeneratorContext(generatorContext);
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