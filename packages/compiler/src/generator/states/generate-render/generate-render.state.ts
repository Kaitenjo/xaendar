import type { RenderNode } from '../../../parser/types/nodes/render-node.type';
import { assertRenderTarget } from '../../../utils/render-target/render-target.utils';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import type { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { resolveExpression } from '../../utils/generator/generator.utils';

/**
 * Generates the code rendering an instance of a template, e.g. `@render row(item(), $index())`: the template, read from
 * the scope declaring it, is called with a function for each argument, which the runtime turns into the signal of its
 * parameter, so that the instance updates the nodes reading a parameter instead of being rendered again.
 *
 * @param node - The `RenderNode` to process.
 * @param parentNode - Variable name of the parent DOM node.
 * @param _index - Unused index of the node among its siblings.
 * @param compilerContext - Current render scope context.
 * @param anchor - The name of the anchor variable the instance is rendered before, or `null` to append it.
 * @returns The generated code.
 * @throws If the name doesn't refer to a template visible in the scope, or the template creates its content in another
 *   namespace.
 */
export async function generateRender(node: RenderNode, parentNode: string, _index: string, compilerContext: CompilerContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const { callee, calleeSpan } = node;
  assertRenderTarget(callee, calleeSpan, compilerContext.getTemplateNamespace(callee), compilerContext.namespace);

  const args = node.arguments.map(argument => `() => ${resolveExpression(argument, compilerContext).expression}`);
  return { code: [`_renderTemplate(${parentNode}, context, ${anchor}, context.get('${callee}'), [${args.join(', ')}]);`] };
}
