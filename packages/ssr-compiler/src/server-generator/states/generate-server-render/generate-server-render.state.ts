import { assertRenderTarget, resolveExpression, type CompilerContext, type RenderNode } from '@xaendar/compiler';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code rendering an instance of a template, e.g. `@render row(item(), $index())`: the template, read from
 * the scope declaring it, is called with a function for each argument, which the runtime turns into the signal of its
 * parameter, as the client does.
 *
 * @param node - The `@render` node.
 * @param _parent - Unused place of the node.
 * @param _index - Unused position of the node.
 * @param compilerContext - The compiler context of the node.
 * @returns The code of the node.
 * @throws If the name doesn't refer to a template visible in the scope, or the template creates its content in another
 *   namespace.
 */
export function generateServerRender(node: RenderNode, _parent: ServerParent, _index: string, compilerContext: CompilerContext): ServerTransitionResult {
  const { callee, calleeSpan } = node;
  assertRenderTarget(callee, calleeSpan, compilerContext.getTemplateNamespace(callee), compilerContext.namespace);

  const args = node.arguments.map(argument => `() => ${resolveExpression(argument, compilerContext, SERVER_RESOLVE_OPTIONS).expression}`);
  return { pieces: [{ statement: `_ssrRenderTemplate(out, context, context.get('${callee}'), [${args.join(', ')}]);` }] };
}
