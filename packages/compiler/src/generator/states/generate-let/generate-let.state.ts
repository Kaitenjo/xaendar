import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import type { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { resolveExpression } from '../../utils/generator/generator.utils';

/**
 * Generates the code initializing a `@let`, declared at the start of its scope, once the render reaches it: with the
 * value of its expression, computed once, or, when the expression reads a signal, with a signal computing it, which the
 * expressions reading the `@let` call.
 *
 * @example
 * // @let total = price() * quantity();
 * context.set('total', _let(() => this.price() * this.quantity()));
 *
 * @param node - The `LetNode` to process.
 * @param _parentNode - Unused variable name of the parent DOM node.
 * @param _index - Unused index of the node among its siblings.
 * @param compilerContext - Current render scope context.
 * @param _anchor - Unused anchor variable name.
 * @returns The generated code.
 */
export async function generateLet(node: LetNode, _parentNode: string, _index: string, compilerContext: CompilerContext, _anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const { expression, reactive } = resolveExpression(node.value, compilerContext);
  return { code: [`context.set('${node.name}', ${reactive ? `_let(() => ${expression})` : expression});`] };
}
