import type { RenderNode } from '../../../parser/types/nodes/render-node.type';
import { appendContainer } from '../../utils/block-position/block-position.utils';
import { assertRenderTarget } from '../../../utils/render-target/render-target.utils';
import { GeneratorContext } from '../../context/context';
import type { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getBlockIdentifier, joinVariables, resolveExpression } from '../../utils/generator/generator.utils';
import { declareExpression, toObjectLiteral } from '../../utils/module-code/module-code.utils';

/**
 * Generates the code rendering an instance of a template, e.g. `@render row(item, $index)`: a `_renderTemplate(...)`
 * call receiving a constant of the module (`div0__render1$render`, see `RenderTemplateConfig` of the runtime) holding
 * the constant of the template, how many scopes up the scope declaring it is, whose variables the content of the
 * instance reads, and the function of the module computing the values of the arguments, which the runtime calls with
 * the component and the context, again when a signal or a variable of the template it reads changes, updating the
 * parameters of the instance instead of rendering it again. When the arguments read variables of the enclosing scopes,
 * the constant lists their identifiers.
 *
 * @example
 * // @render row(item, $index)
 * const div0__render1$render = { template: template_row_12$template, depth: 1, args: div0__render1$args, reads: _reads0 };
 * _renderTemplate(div0, context, null, div0__render1$render);
 *
 * function div0__render1$args(context) { return [_read(context, 0, 8), _read(context, 0, 9)]; }
 *
 * @param node - The `RenderNode` to process.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings, which names its constant.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the instance is rendered before, or `null` to append it.
 * @param separated - Whether the server separates the instance from the text preceding it with `<!---->`, which the
 *   hydration passes over.
 * @returns The generated code.
 * @throws If the name doesn't refer to a template visible in the scope, or the template creates its content in another
 *   namespace.
 */
export async function generateRender(node: RenderNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, separated: boolean): Promise<GeneratorTransitionFunctionReturnType> {
  const { callee, calleeSpan } = node;
  assertRenderTarget(callee, calleeSpan, generatorContext.getTemplateNamespace(callee), generatorContext.namespace);

  const renderKey = getBlockIdentifier('render', parentNode, index);
  const args = new Array<string>();
  let variables: readonly number[] | undefined;
  for (let i = 0; i < node.arguments.length; i++) {
    const argument = resolveExpression(node.arguments[i], generatorContext);
    args.push(argument.expression);
    variables = joinVariables(variables, argument.variables);
  }

  const members = [`template: ${generatorContext.readIdentifier(callee)}`];
  const depth = generatorContext.depthOf(callee)!;
  if (depth) {
    members.push(`depth: ${depth}`);
  }

  if (args.length) {
    members.push(`args: ${declareExpression(generatorContext, `${renderKey}$args`, `[${args.join(', ')}]`)}`);
  }

  if (separated) {
    members.push('separated: true');
  }

  const reads = generatorContext.getReads(variables);
  if (reads) {
    members.push(`reads: ${reads}`);
  }

  appendContainer(members, generatorContext);
  const config = generatorContext.declareConstant(`${renderKey}$render`, toObjectLiteral(members));
  return { code: [`_renderTemplate(${parentNode}, context, ${anchor}, ${config});`] };
}
