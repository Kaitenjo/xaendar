import { ASTNodeType } from '../../../parser/types/node.enum';
import { InterpolationNode } from '../../../parser/types/nodes/interpolation-node.type';
import { TextNode } from '../../../parser/types/nodes/text-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { resolveExpression, toStringLiteral } from '../../utils/generator/generator.utils';

/**
 * Generates code for a text or interpolation node.
 *
 * Emits a `_renderLiteralText` call for plain text nodes and a
 * `_renderText` call for interpolation nodes, both appending a DOM text
 * node to the parent. A text the server separates from what precedes it with `<!---->` passes `true` as `separated`,
 * so that the hydration adopts the text after it, and an interpolation reading variables of the template passes their
 * names last, so that the text is written again when they change.
 *
 * @param node - A `TextNode` or `InterpolationNode` to process.
 * @param parentNode - Variable name of the parent DOM node to append to.
 * @param _index - Unused index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the text is rendered before, or `null` to append it.
 * @param separated - Whether the server separates the text from what precedes it.
 * @returns Array of generated code lines.
 */
export async function generateTextAndInterpolation(node: TextNode | InterpolationNode, parentNode: string, _index: string, generatorContext: GeneratorContext, anchor: string | null, separated: boolean): Promise<GeneratorTransitionFunctionReturnType> {
  const separator = separated ? ', true' : '';
  if (node.type === ASTNodeType.Text) {
    return { code: [`_renderLiteralText(${parentNode}, context, ${toStringLiteral(node.value)}, ${anchor}${separator});`] };
  }

  const { expression, variables } = resolveExpression(node.expression, generatorContext);
  const reads = generatorContext.getReads(variables);
  return { code: [`_renderText(${parentNode}, context, () => ${expression}, ${anchor}${reads ? `, ${separated}, ${reads}` : separator});`] };
}
