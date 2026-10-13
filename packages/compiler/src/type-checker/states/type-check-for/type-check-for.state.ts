import { ForImplicitVariables } from '../../../parser/types/nodes/for-implicit-variables';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { Line } from '../../types/generated-line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import type { Span } from '../../../types/span.type';
import { indentLines, line, mapped, plain } from '../../utils/line-builder/line-builder.utils';
import { mappedExpression } from '../../utils/mapped-expression/mapped-expression.utils';

/**
 * Generic arrow function the iterable of every `@for` is passed to: it accepts only a
 * number or an array, the only iterables `_for` supports at runtime, so any other value
 * (e.g. a `Set`) is reported on the iterable itself, and it types a number `n` as the
 * `number[]` it is turned into at runtime (`0, 1, ..., n - 1`), leaving an array untouched. Being distributive, a `number | Item[]`
 * iterable gives items typed `number | Item`.
 */
const FOR_ITERABLE = '(<T extends number | readonly unknown[]>(iterable: T): T extends number ? number[] : T => iterable as never)';

/**
 * Name of the variable of the `for...of` loop holding each value of the iterable: the item alias is declared
 * in the body as a signal of its type, like the implicit variables. It starts with `$`, as the implicit
 * variables do, so that it cannot clash with an alias.
 */
const FOR_VALUE = '$$item';

/**
 * Type-checks an `@for` block using a real `for...of` loop.
 *
 * This replaces the previous "synthetic function with a `typeof array`
 * parameter" trick, which mistyped the loop variable as the *whole array*
 * rather than a single element. A real `for (const item of array)` lets
 * TypeScript infer `item`'s type correctly as the array's element type —
 * exactly like it would for a loop written by hand — with no synthetic
 * function boundary needed. The iterable goes through {@link FOR_ITERABLE}
 * so that a numeric iterable is accepted too. The item alias and the implicit
 * variables are declared in the body as signals, as they are at runtime: the
 * item is a signal of the type of the loop variable.
 *
 * @param node - The `ForNode` to type-check.
 * @param processNode - Callback emitting the lines of each child node.
 * @param context - The enclosing type-check scope.
 * @returns The lines of the `for...of` loop.
 */
export function typeCheckFor(node: ForNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const forContext = new TypeCheckContext(context);
  const indexName = resolveImplicit(node, '$index');
  const firstName = resolveImplicit(node, '$first');
  const lastName = resolveImplicit(node, '$last');
  const evenName = resolveImplicit(node, '$even');
  const oddName = resolveImplicit(node, '$odd');

  if (node.itemAlias) {
    forContext.addUnresolvableIdentifier(node.itemAlias, 'signal');
  }
  const identifiers = [indexName, firstName, lastName, evenName, oddName];
  for (let i = 0; i < identifiers.length; i++) {
    forContext.addUnresolvableIdentifier(identifiers[i], 'signal');
  }

  const lines = new Array<Line>();

  // The iterable, the track expression and the identifiers they read are mapped finely onto the template
  lines.push(line(`for (const ${FOR_VALUE} of ${FOR_ITERABLE}(`, mappedExpression(node.iterableExpression, context, node.span), ')) {'));

  lines.push(...indentLines([
    ...(node.itemAlias ? [declareVariable(node.itemAlias, node.itemAliasSpan, `Signal<typeof ${FOR_VALUE}>`)] : []),
    declareVariable(indexName, node.implicitAliasSpans.get('$index'), 'Signal<number>'),
    declareVariable(firstName, node.implicitAliasSpans.get('$first'), 'Signal<boolean>'),
    declareVariable(lastName, node.implicitAliasSpans.get('$last'), 'Signal<boolean>'),
    declareVariable(evenName, node.implicitAliasSpans.get('$even'), 'Signal<boolean>'),
    declareVariable(oddName, node.implicitAliasSpans.get('$odd'), 'Signal<boolean>'),
    line(mappedExpression(node.trackExpression, forContext, node.span, ';', {})),
    ...node.children.flatMap(child => processNode(child, forContext)),
  ]));

  lines.push(plain('}'));
  return lines;
}

/**
 * Declares a variable of the loop, mapping its name onto the span of the template declaring it, if any: the alias
 * of the item or of an implicit variable, so that the definition of a variable read in the loop leads to the template.
 *
 * @param name - The name of the variable.
 * @param span - The span of the template declaring the name, `undefined` for an implicit variable without alias.
 * @param type - The type of the variable.
 * @returns The line declaring the variable.
 */
function declareVariable(name: string, span: Span | undefined, type: string): Line {
  return span ? line('let ', mapped(name, span), `!: ${type};`) : plain(`let ${name}!: ${type};`);
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