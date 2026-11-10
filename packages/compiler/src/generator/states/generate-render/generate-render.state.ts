import type { RenderNode } from '../../../parser/types/nodes/render-node.type';
import { assertRenderTarget } from '../../../utils/render-target/render-target.utils';
import { GeneratorContext } from '../../context/context';
import type { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { joinVariables, resolveExpression } from '../../utils/generator/generator.utils';

/**
 * Generates the code rendering an instance of a template, e.g. `@render row(item, $index)`: the template, read from
 * the scope declaring it, is called with a function for each argument, which the runtime computes again when a signal or
 * a variable of the template it reads changes, updating the parameters of the instance instead of rendering it again.
 * When the arguments read variables of the enclosing scopes, the runtime receives their names.
 *
 * @param node - The `RenderNode` to process.
 * @param parentNode - Variable name of the parent DOM node.
 * @param _index - Unused index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the instance is rendered before, or `null` to append it.
 * @param separated - Whether the server separates the instance from the text preceding it with `<!---->`, which the
 *   hydration passes over.
 * @returns The generated code.
 * @throws If the name doesn't refer to a template visible in the scope, or the template creates its content in another
 *   namespace.
 */
export async function generateRender(node: RenderNode, parentNode: string, _index: string, generatorContext: GeneratorContext, anchor: string | null, separated: boolean): Promise<GeneratorTransitionFunctionReturnType> {
  const { callee, calleeSpan } = node;
  assertRenderTarget(callee, calleeSpan, generatorContext.getTemplateNamespace(callee), generatorContext.namespace);

  const args = new Array<string>();
  let variables: readonly string[] | undefined;
  for (let i = 0; i < node.arguments.length; i++) {
    const argument = resolveExpression(node.arguments[i], generatorContext);
    args.push(`() => ${argument.expression}`);
    variables = joinVariables(variables, argument.variables);
  }

  const reads = generatorContext.getReads(variables);
  const trailing = reads ? `, ${separated}, ${reads}` : separated ? ', true' : '';
  return { code: [`_renderTemplate(${parentNode}, context, ${anchor}, context.get('${callee}'), [${args.join(', ')}]${trailing});`] };
}
