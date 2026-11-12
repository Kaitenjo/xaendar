import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import { GeneratorContext } from '../../context/context';
import type { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { isConstantExpression, resolveExpression } from '../../utils/generator/generator.utils';
import { declareLetBinding, toRoleName } from '../../utils/module-code/module-code.utils';

/**
 * Generates the code initializing a `@let`, declared at the start of its scope, once the render reaches it: a literal is
 * written once, any other value by `_let`, which computes it again when a signal or a variable of the template it reads
 * changes, receiving its binding (see `declareLetBinding`): the expression, a function of the module named after the
 * parent node and the `@let` (`div0$let_total`), which the runtime calls with the component and the context, the slot and
 * the identifier of the `@let`, and the identifiers of the variables it reads. The expressions reading the `@let` read
 * its value, as any variable.
 *
 * @example
 * // @let total = price() * quantity();
 * const div0$let_total$binding = { value: div0$let_total, variable: 6, id: 0, update: _runLet, effect: 0 };
 * _let(context, div0$let_total$binding); // function div0$let_total(context) { return this.price() * this.quantity(); }
 * // @let name = row.name;
 * const div0$let_name$binding = { value: div0$let_name, variable: 7, id: 1, reads: _reads0, update: _runLet, effect: 1 };
 * _let(context, div0$let_name$binding); // function div0$let_name(context) { return _read(context, 1, 6).name; }
 * // @let size = 10;
 * context[8] = 10;
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
  // The @let is declared by the scope rendering it: the children of an element are rendered in the scope of the element
  const { slot, id } = generatorContext.addressOf(node.name)!;
  if (isConstantExpression(node.value)) {
    return { code: [`context[${slot}] = ${expression};`] };
  }

  const name = `${parentNode}$let_${toRoleName(node.name)}`;
  return { code: [`_let(context, ${declareLetBinding(generatorContext, name, expression, slot, id, variables)});`] };
}
