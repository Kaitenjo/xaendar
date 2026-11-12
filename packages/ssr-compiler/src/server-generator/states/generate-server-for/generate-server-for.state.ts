import { declareExpression, GeneratorContext, getBlockIdentifier, getReadForVariables, resolveExpression, toStringLiteral, writeIterationVariables, type ForImplicitVariables, type ForNode } from '@xaendar/compiler';
import type { ServerFunctionToProcess } from '../../types/server-function-to-process.type';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SSR_MARKERS } from '../../../costants/ssr-markers.constants';
import { SERVER_RESOLVE_OPTIONS } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code of a `@for`: a loop rendering the body once per item, through the function rendering it, named
 * like the one of the client. A numeric iterable `n` is iterated as `0, 1, …, n - 1`. The body declares the item and the
 * implicit variables it reads as values, as the one of the client does, so that its expressions read them the same way:
 * the variables are a constant of the module, `for0Variables`, written before the function, which a body reading none
 * does without, declaring none.
 *
 * The items are written between the markers of the browser, `<!--xd-for-->` and `<!--/xd-for-->`, the place of the
 * anchor of the client, each one opened by a marker holding its key (see `_ssrItemMarker`): the value of the `track`
 * expression, written as the client writes it, a function whose parameters are the item and the implicit variables, as
 * values.
 *
 * @example
 * // @for (user of users(); track user.id) { … }
 * {
 *   const items = _ssrItems(this.users());
 *   const track = (user, $index, $first, $last, $even, $odd) => user.id;
 *   out.push('<!--xd-for-->');
 *   for (let index = 0; index < items.length; index++) {
 *     out.push(_ssrItemMarker(track(items[index], index, index === 0, index === items.length - 1, index % 2 === 0, index % 2 !== 0)));
 *     for0.call(this, out, context, items, index);
 *   }
 *   out.push('<!--/xd-for-->');
 * }
 *
 * @param node - The `@for` node.
 * @param parent - Where the body is rendered.
 * @param index - The position of the node among its siblings.
 * @param generatorContext - The generator context of the node.
 * @param _generateChildren - Unused: the content of the block is written by functions of its own.
 * @param last - Whether the block is the last node of its parent, written without the marker closing it, as the client
 *   renders it without anchor (see `isLastRenderedChild`).
 * @returns The code of the node, and the function rendering its body.
 */
export function generateServerFor(node: ForNode, parent: ServerParent, index: string, generatorContext: GeneratorContext, _generateChildren?: unknown, last = false): ServerTransitionResult {
  const { itemAlias } = node;
  const iterable = resolveExpression(node.iterableExpression, generatorContext, SERVER_RESOLVE_OPTIONS).expression;
  const implicitNames: Readonly<Record<ForImplicitVariables, string>> = {
    $index: resolveImplicit(node, '$index'),
    $first: resolveImplicit(node, '$first'),
    $last: resolveImplicit(node, '$last'),
    $even: resolveImplicit(node, '$even'),
    $odd: resolveImplicit(node, '$odd')
  };

  // Only the variables the body reads are created for each item, as the client does
  const context = new GeneratorContext(generatorContext);
  const read = getReadForVariables(node);
  const ids = new Array<number>(read.length);
  for (let i = 0; i < read.length; i++) {
    const variable = read[i];
    const name = variable === 'item' ? itemAlias! : implicitNames[variable];
    context.addIdentifier(name, 'variable');
    ids[i] = context.idOf(name)!;
  }

  const names = Object.values(implicitNames);
  const key = getBlockIdentifier('for', parent.id, index);
  const fn: ServerFunctionToProcess['fn'] = { node, context, parent: { id: key, tag: parent.tag } };
  // The variables, the same for every item, are a constant of the module, as the client declares them
  if (read.length) {
    const variables = generatorContext.declareConstant(`${key}Variables`, writeIterationVariables(read, ids));
    fn.precode = `_iterationVariables(context, items, index, ${variables});`;
  }

  const functionsToProcess = new Map<string, ServerFunctionToProcess>([[key, { fn, args: ['out', 'parentContext', 'items', 'index'] }]]);

  /*
    The track expression is written as the client writes it: a function of the module, outside of the context of the
    items, whose parameters are the context of the @for, then the item and the implicit variables, read as written
  */
  const trackContext = new GeneratorContext(generatorContext, undefined, 'declarations');
  if (itemAlias) {
    trackContext.addUnresolvableIdentifier(itemAlias);
  }
  for (let i = 0; i < names.length; i++) {
    trackContext.addUnresolvableIdentifier(names[i]);
  }
  const track = declareExpression(generatorContext, `${key}$track`, resolveExpression(node.trackExpression, trackContext, SERVER_RESOLVE_OPTIONS).expression, [itemAlias === 'context' || names.includes('context') ? '__context' : 'context', itemAlias ?? '_', ...names].join(', '));

  const lines = [
    '{',
    `  const items = _ssrItems(${iterable});`,
    `  out.push(${toStringLiteral(`<!--${SSR_MARKERS.for}-->`)});`,
    '  for (let index = 0; index < items.length; index++) {',
    `    out.push(_ssrItemMarker(${track}.call(this, context, items[index], index, index === 0, index === items.length - 1, index % 2 === 0, index % 2 !== 0)));`,
    `    ${key}.call(this, out, context, items, index);`,
    '  }'
  ];
  // The last node of its parent is closed by no marker, as the client renders it without anchor
  if (!last) {
    lines.push(`  out.push(${toStringLiteral(`<!--/${SSR_MARKERS.for}-->`)});`);
  }

  lines.push('}');
  return { pieces: [{ statement: lines.join('\n') }], functionsToProcess };
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
