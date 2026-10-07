import { resolveExpression } from '../../../generator/utils/generator/generator.utils';
import { ForImplicitVariables } from '../../../parser/types/nodes/for-implicit-variables';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { Line } from '../../types/generated-line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, line, mapped, plain } from '../../utils/line-builder/line-builder.utils';

/**
 * Generic arrow function the iterable of every `@for` is passed to: it accepts only a
 * number or an array, the only iterables `_for` supports at runtime, so any other value
 * (e.g. a `Set`) is reported on the iterable itself, and it types a number `n` as the
 * `number[]` it is turned into at runtime (`0, 1, ..., n - 1`), leaving an array untouched. Being distributive, a `number | Item[]`
 * iterable gives items typed `number | Item`.
 */
const FOR_ITERABLE = '(<T extends number | readonly unknown[]>(iterable: T): T extends number ? number[] : T => iterable as never)';

/**
 * Type-checks an `@for` block using a real `for...of` loop.
 *
 * This replaces the previous "synthetic function with a `typeof array`
 * parameter" trick, which mistyped the loop variable as the *whole array*
 * rather than a single element. A real `for (const item of array)` lets
 * TypeScript infer `item`'s type correctly as the array's element type —
 * exactly like it would for a loop written by hand — with no synthetic
 * function boundary needed. The iterable goes through {@link FOR_ITERABLE}
 * so that a numeric iterable is accepted too; without an `item of` part
 * the loop variable is `_`.
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
    forContext.addUnresolvableIdentifier(node.itemAlias);
  }
  const identifiers = [indexName, firstName, lastName, evenName, oddName];
  for (let i = 0; i < identifiers.length; i++) {
    forContext.addUnresolvableIdentifier(identifiers[i], 'signal');
  }

  const lines = new Array<Line>();

  // NOTA: presuppone che ForNode esponga uno span dedicato per la sola
  // sorgente iterabile (`node.iterableSourceSpan`), distinto da `node.span`
  // (l'intero blocco @for). Se al momento il parser non lo produce, questo
  // è un buon segnale per aggiungerlo: senza, l'errore su "root.foo non
  // esiste" punterebbe sempre all'intero blocco invece che al solo nome.
  const iterable = resolveExpression(node.iterableExpression, context, { resolver: 'root' }).expression;
  lines.push(line(`for (const ${node.itemAlias ?? '_'} of ${FOR_ITERABLE}(`, mapped(iterable, node.span), ')) {'));

  lines.push(...indentLines([
    plain(`let ${indexName}!: Signal<number>;`),
    plain(`let ${firstName}!: Signal<boolean>;`),
    plain(`let ${lastName}!: Signal<boolean>;`),
    plain(`let ${evenName}!: Signal<boolean>;`),
    plain(`let ${oddName}!: Signal<boolean>;`),
    line(mapped(`${resolveExpression(node.trackExpression, forContext).expression};`, node.span)),
    ...node.children.flatMap(child => processNode(child, forContext)),
  ]));

  lines.push(plain('}'));
  return lines;
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