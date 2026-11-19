import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import { getTemplateSpan } from '../../../parser/utils/expression-validator/expression-validator';
import type { TypeCheckContext } from '../../models/context/context';
import type { Line } from '../../types/line.type';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { line } from '../../utils/line-builder/line-builder.utils';
import { mappedExpression } from '../../utils/mapped-expression/mapped-expression.utils';
import { getLetValue } from '../../utils/template-types/template-types.utils';

/**
 * Type-checks the value of a `@let` in a constant, where the `@let` is written, so that it reads the names of its scope
 * as the render code does: the `@let` itself is declared at the start of its scope, typed with the type of the constant
 * (see `typeCheckScope`), the type of its value, which the expressions reading it read.
 *
 * @example
 * // @let total = price() * quantity();
 * const __let12 = root.price() * root.quantity();
 *
 * @param node - The `LetNode` to type-check.
 * @param _processNode - Unused callback emitting the lines of a node.
 * @param context - The enclosing type-check scope.
 * @returns The line of the constant.
 */
export function typeCheckLet(node: LetNode, _processNode: ProcessNode, context: TypeCheckContext): Line[] {
  return [line(`const ${getLetValue(node)} = `, mappedExpression(node.value, context, getTemplateSpan(node.value)!), ';')];
}
