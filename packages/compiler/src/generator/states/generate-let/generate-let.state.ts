import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import { GeneratorContext } from '../../context/context';
import type { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { isConstantExpression, resolveExpression } from '../../utils/generator/generator.utils';
import { declareExpression, toRoleName } from '../../utils/module-code/module-code.utils';

/**
 * Generates the code initializing a `@let`, declared at the start of its scope, once the render reaches it: a literal is
 * written once, any other value by `_let`, which computes it again when a signal or a variable of the template it reads
 * changes, receiving the names of the variables. The expressions reading the `@let` read its value, as any variable. The
 * expression is a function of the module named after the parent node and the `@let` (`div0$let_total`), which the
 * runtime calls with the component and the context.
 *
 * @example
 * // @let total = price() * quantity();
 * _let(context, 'total', div0$let_total);    // function div0$let_total(context) { return this.price() * this.quantity(); }
 * // @let name = row.name;
 * _let(context, 'name', div0$let_name, _reads0); // function div0$let_name(context) { return context.get('row').name; }
 * // @let size = 10;
 * context.set('size', 10);
 *
 * @param node - The `LetNode` to process.
 * @param parentNode - The variable name of the parent DOM node, which names the function of the expression.
 * @param _index - Unused index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param _anchor - Unused anchor variable name.
 * @returns The generated code.
 */
export async function generateLet(node: LetNode, parentNode: string, _index: string, generatorContext: GeneratorContext, _anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const { expression, variables } = resolveExpression(node.value, generatorContext);
  if (isConstantExpression(node.value)) {
    return { code: [`context.set('${node.name}', ${expression});`] };
  }

  const reads = generatorContext.getReads(variables);
  const compute = declareExpression(generatorContext, `${parentNode}$let_${toRoleName(node.name)}`, expression);
  return { code: [`_let(context, '${node.name}', ${compute}${reads ? `, ${reads}` : ''});`] };
}
