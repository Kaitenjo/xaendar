import type { RenderNode } from '../../../parser/types/nodes/render-node.type';
import { getTemplateSpan } from '../../../parser/utils/expression-validator/expression-validator';
import { getRenderedTemplate } from '../../../utils/render-target/render-target.utils';
import type { TypeCheckContext } from '../../models/context/context';
import type { Line } from '../../types/line.type';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { line, mapped } from '../../utils/line-builder/line-builder.utils';
import type { LinePart } from '../../types/line-part.type';
import { mappedExpression } from '../../utils/mapped-expression/mapped-expression.utils';
import { RENDER } from '../../utils/template-types/template-types.utils';

/**
 * Type-checks a `@render` like a function call: a template called by name must create its content in the namespace of
 * the `@render`, then the number and the types of the arguments are checked against its parameters. The number of the
 * arguments is passed too, so that each argument passed is checked against the type of its parameter as declared, even
 * when the parameter is optional: an argument passed as `undefined` is not left out. A `@render` calling an expression
 * (`@render rowTemplate()(item)`) is checked the same way against the template it gives, a `TemplateRef`, `null` or
 * `undefined`.
 *
 * @example
 * // @render row(item, $index)
 * __render(row, 2)(item, $index);
 * // @render rowTemplate()(item)
 * __render(root.rowTemplate(), 1)(item);
 *
 * @param node - The `RenderNode` to type-check.
 * @param _processNode - Unused callback emitting the lines of a node.
 * @param context - The enclosing type-check scope.
 * @returns The line of the call.
 * @throws If the template the name refers to creates its content in another namespace.
 */
export function typeCheckRender(node: RenderNode, _processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const { callee, calleeSpan } = node;
  const template = getRenderedTemplate(node, name => context.getTemplateNamespace(name), context.namespace);
  // The template a name refers to records the helpers where it is declared: an expression may give one of another template
  context.recordTemplateHelpers();

  const args = new Array<LinePart>();
  for (let i = 0; i < node.arguments.length; i++) {
    const argument = node.arguments[i];
    args.push(i ? ', ' : '', mappedExpression(argument, context, getTemplateSpan(argument)!));
  }

  // A missing argument is reported on the call of the template, mapped onto the whole @render
  const rendered = template ? mapped(callee, calleeSpan) : mappedExpression(node.calleeExpression, context, calleeSpan);
  return [line(mapped(RENDER, node.span), '(', rendered, `, ${node.arguments.length})(`, ...args, ');')];
}
