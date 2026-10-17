import type { RenderNode } from '../../../parser/types/nodes/render-node.type';
import { getTemplateSpan } from '../../../parser/utils/expression-validator/expression-validator';
import { assertRenderTarget } from '../../../utils/render-target/render-target.utils';
import type { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { Line } from '../../types/generated-line.type';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { line, type LinePart, mapped } from '../../utils/line-builder/line-builder.utils';
import { mappedExpression } from '../../utils/mapped-expression/mapped-expression.utils';
import { RENDER } from '../../utils/template-types/template-types.utils';

/**
 * Type-checks a `@render` like a function call: the template must be visible in the scope and create its content in
 * the namespace of the `@render`, then the number and the types of the arguments are checked against its parameters.
 * The number of the arguments is passed too, so that each argument passed is checked against the type of its parameter
 * as declared, even when the parameter is optional: an argument passed as `undefined` is not left out.
 *
 * @example
 * // @render row(item(), $index())
 * __render(row, 2)(item(), $index());
 *
 * @param node - The `RenderNode` to type-check.
 * @param _processNode - Unused callback emitting the lines of a node.
 * @param context - The enclosing type-check scope.
 * @returns The line of the call.
 * @throws If the name doesn't refer to a template visible in the scope, or the template creates its content in another
 *   namespace.
 */
export function typeCheckRender(node: RenderNode, _processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const { callee, calleeSpan } = node;
  assertRenderTarget(callee, calleeSpan, context.getTemplateNamespace(callee), context.namespace);

  const args = new Array<LinePart>();
  for (let i = 0; i < node.arguments.length; i++) {
    const argument = node.arguments[i];
    args.push(i ? ', ' : '', mappedExpression(argument, context, getTemplateSpan(argument)!));
  }

  // A missing argument is reported on the call of the template, mapped onto the whole @render
  return [line(mapped(RENDER, node.span), '(', mapped(callee, calleeSpan), `, ${node.arguments.length})(`, ...args, ');')];
}
