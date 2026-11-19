import { getRenderedTemplate, resolveExpression, type GeneratorContext, type RenderNode } from '@xaendar/compiler';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code rendering an instance of a template, e.g. `@render row(item, $index)`: the template, read from the
 * scope declaring it, is called with the values of the arguments, read once, which the instance declares as its
 * parameters, as the client does. A `@render` calling an expression (`@render rowTemplate()(item)`) renders the
 * template it gives, a template read as a value, through `_ssrRenderTemplateRef`, nothing for `null` and `undefined`.
 *
 * @param node - The `@render` node.
 * @param _parent - Unused place of the node.
 * @param _index - Unused position of the node.
 * @param generatorContext - The generator context of the node.
 * @returns The code of the node.
 * @throws If the template the name refers to creates its content in another namespace.
 */
export function generateServerRender(node: RenderNode, _parent: ServerParent, _index: string, generatorContext: GeneratorContext): ServerTransitionResult {
  const template = getRenderedTemplate(node, name => generatorContext.getTemplateNamespace(name), generatorContext.namespace);
  const args = `[${node.arguments.map(argument => resolve(argument, generatorContext)).join(', ')}]`;
  return {
    pieces: [{
      statement: template
        ? `_ssrRenderTemplate(out, context, ${generatorContext.readIdentifier(template)}, ${generatorContext.depthOf(template)}, ${args});`
        : `_ssrRenderTemplateRef(out, ${resolve(node.calleeExpression, generatorContext)}, ${args});`
    }]
  };
}

/**
 * Resolves an expression of a `@render` as the code rendering on the server reads it.
 *
 * @param expression - The expression.
 * @param generatorContext - The generator context of the `@render`.
 * @returns The resolved expression.
 */
function resolve(expression: RenderNode['calleeExpression'], generatorContext: GeneratorContext): string {
  return resolveExpression(expression, generatorContext, SERVER_RESOLVE_OPTIONS).expression;
}
