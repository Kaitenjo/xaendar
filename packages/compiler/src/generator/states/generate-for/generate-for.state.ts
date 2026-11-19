import { ForImplicitVariables } from '../../../parser/types/nodes/for-implicit-variables.type';
import { FOR_IMPLICIT_VARIABLES } from '../../../parser/utils/for-variables/for-variables.utils';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import type { GeneratorFunctionToProcess } from '../../types/generator-function-to-process.type';
import { getReadForVariables, writeIterationVariables } from '../../utils/for-reads/for-reads.utils';
import { getBlockIdentifier, getTextIdentifier, joinVariables, resolveExpression } from '../../utils/generator/generator.utils';
import { allocateBlockSlot, appendBlockPosition, appendContainer, getContentAnchor } from '../../utils/block-position/block-position.utils';
import { declareExpression } from '../../utils/module-code/module-code.utils';

/**
 * Generates code for a `@for` iteration node.
 *
 * Emits a call of `_for` receiving a constant of the module (`for0$for`, see `ForConfig` of the runtime): the functions
 * of the module computing the items and the key of an item, which the runtime calls with the component and the context,
 * and the function rendering the body of an item, which declares the item and the implicit variables the body reads (see
 * {@link getReadForVariables}) as values, by `_iterationVariables`, and returns the context of the item. The variables
 * are the same for every item: they are declared once, as a constant of the module (see
 * {@link writeIterationVariables}), which the constant of the `@for` and the function read. The body reads them from the
 * first slots of its scope, without calling them:
 *
 * ```javascript
 * // @for (row of rows(); track row.id; i = $index) { <td>{ i } { row.name }</td> }
 * const for0Variables = { used: ['item', '$index'], ids: [0, 1] };
 * const for0$for = { items: for0$items, track: for0$track, block: for0, variables: for0Variables, update: _runFor, effect: 0 };
 *
 * _for(parent, context, null, for0$for);
 *
 * function for0$items(context) { return this.rows(); }
 * function for0$track(context, row, i, $first, $last, $even, $odd) { return row.id; }
 *
 * function for0(for0, parentContext, items0, i0, anchor, nodeStrategy) {
 *   const context = _scope(parentContext, _layout0, nodeStrategy);
 *   _iterationVariables(context, items0, i0, for0Variables);
 *   // ... child nodes, reading _read(context, 0, 6) and _read(context, 0, 5)
 *   return context;
 * }
 * ```
 *
 * A body reading no variable has no constant of its variables: `_iterationVariables` is not called, and the constant of
 * the `@for` lists none.
 *
 * The iterable expression is resolved through the active {@link GeneratorContext}
 * like any other template expression. A numeric iterable `n` is turned into
 * `0, 1, ..., n - 1` at runtime by `_for`. When the `item of` part is omitted
 * no item alias is declared, and the item parameter of the track function is `_`.
 * The track function takes the context of the `@for`, then the item and every implicit variable, as values, whether the
 * body reads them or not; its context is `__context` when the item or an alias is named `context`. When the iterable or the track expression read variables of the enclosing scopes, the constant
 * of the `@for` lists their identifiers, so that it runs again when they change.
 *
 * @param node - The `ForNode` to process.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - Base variable name prefix used for child nodes and
 *   to produce a unique loop counter identifier.
 * @param generatorContext - The enclosing scope context.
 * @param anchor - The node the items are inserted before, `null` to append them.
 * @param _separated - Unused: a block is never separated from a text.
 * @param last - Whether the block is the last node of its parent, which needs no anchor (see `isLastRenderedChild`). The body of an item keeps
 *   its anchor whatever its position: the items move, the last one becoming another.
 * @returns The `_for` call, and the function rendering the body of an item to generate.
 */
export async function generateFor(node: ForNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, _separated = false, last = false): Promise<GeneratorTransitionFunctionReturnType> {
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  }

  const iterable = resolveExpression(node.iterableExpression, generatorContext);
  const itemName = node.itemAlias ?? '_';

  const itemsName = getTextIdentifier('items', parentNode, index);
  const counterName = getTextIdentifier('i', parentNode, index);

  const forContext = new GeneratorContext(generatorContext);
  // In the order of the parameters of the track expression after the item (see `TrackExpression` of the runtime)
  const identifiers = FOR_IMPLICIT_VARIABLES.map(variable => resolveImplicit(node, variable));

  /*
    Only the variables the body reads are declared for each item, as values: the item and the implicit variables,
    updated when the row is reused for a new item with the same key or at another index
  */
  const read = getReadForVariables(node);
  const readNames = read.map(variable => variable === 'item' ? node.itemAlias! : resolveImplicit(node, variable));
  for (let i = 0; i < readNames.length; i++) {
    forContext.addIdentifier(readNames[i], 'variable');
  }

  // The variables, the same for every item, are a constant of the module, read by the @for and by _iterationVariables
  const forKey = getBlockIdentifier('for', parentNode, index);
  const fn: GeneratorFunctionToProcess['fn'] = {
    node,
    parentNode: forKey,
    context: forContext,
    anchor: 'anchor'
  };
  const members = new Array<string>();
  if (read.length) {
    const variables = generatorContext.declareConstant(`${forKey}Variables`, writeIterationVariables(read, readNames.map(name => forContext.idOf(name)!)));
    fn.precode = `_iterationVariables(context, ${itemsName}, ${counterName}, ${variables});`;
    members.push(`variables: ${variables}`);
  }

  retVal.functionsToProcess!.set(forKey, { fn, args: [forKey, 'parentContext', itemsName, counterName, 'anchor', 'nodeStrategy'] });

  /*
    The track expression is a function written where the @for is, outside of the context of its rows: the item and
    the implicit variables are its parameters, read as written, while the members of the component, the imports and
    the variables of the enclosing scopes are resolved like in any other expression of the scope of the @for
  */
  // Called with the scope of the @for, it stands for no scope of the runtime
  const trackContext = new GeneratorContext(generatorContext, undefined, 'declarations');
  if (node.itemAlias) {
    trackContext.addUnresolvableIdentifier(node.itemAlias);
  }
  for (let i = 0; i < identifiers.length; i++) {
    trackContext.addUnresolvableIdentifier(identifiers[i]);
  }

  const track = resolveExpression(node.trackExpression, trackContext);
  const reads = generatorContext.getReads(joinVariables(iterable.variables, track.variables));
  // An item or an alias named `context` takes the name of the parameter of the context, as it did when the track was a
  // closure in the function of the block: a duplicate parameter would not parse in a module
  const contextParameter = itemName === 'context' || identifiers.includes('context') ? '__context' : 'context';
  const trackParameters = [contextParameter, itemName, ...identifiers].join(', ');
  members.unshift(
    `items: ${declareExpression(generatorContext, `${forKey}$items`, iterable.expression)}`,
    `track: ${declareExpression(generatorContext, `${forKey}$track`, track.expression, trackParameters)}`,
    `block: ${forKey}`
  );
  // The content of the @empty is a scope of its own in the one of the @for, reading none of its variables, which does not move
  if (node.empty) {
    const emptyKey = getBlockIdentifier('empty', parentNode, index);
    members.push(`empty: ${emptyKey}`);
    retVal.functionsToProcess!.set(emptyKey, {
      fn: { node: node.empty, parentNode: emptyKey, context: new GeneratorContext(generatorContext), anchor: getContentAnchor(last) },
      args: [emptyKey, 'parentContext', 'anchor', 'nodeStrategy']
    });
  }

  if (reads) {
    members.push(`reads: ${reads}`);
  }

  appendBlockPosition(members, last, allocateBlockSlot(generatorContext, last));
  appendContainer(members, generatorContext);
  const config = generatorContext.declareBinding(`${forKey}$for`, members, '_runFor', false)!;
  retVal.code.push(`_for(${parentNode}, context, ${anchor}, ${config});`);

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
