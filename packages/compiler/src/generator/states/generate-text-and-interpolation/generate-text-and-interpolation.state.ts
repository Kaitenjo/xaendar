import { ASTNodeType } from '../../../parser/types/node.enum';
import { InterpolationNode } from '../../../parser/types/nodes/interpolation-node.type';
import { TextNode } from '../../../parser/types/nodes/text-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { resolveExpression, toStringLiteral } from '../../utils/generator/generator.utils';

/**
 * Generates code for a text or interpolation node.
 *
 * Emits a `_renderLiteralText` call for plain text nodes and a
 * `_renderText` call for interpolation nodes, both appending a DOM text
 * node to the parent. A text the server separates from what precedes it with `<!---->` passes `true` last, so that
 * the hydration adopts the text after it.
 *
 * @param node - A `TextNode` or `InterpolationNode` to process.
 * @param parentNode - Variable name of the parent DOM node to append to.
 * @param _index - Unused index of the node among its siblings.
 * @param compilerContext - Current render scope context.
 * @param anchor - The name of the anchor variable the text is rendered before, or `null` to append it.
 * @param separated - Whether the server separates the text from what precedes it.
 * @returns Array of generated code lines.
 */
export async function generateTextAndInterpolation(node: TextNode | InterpolationNode, parentNode: string, _index: string, compilerContext: CompilerContext, anchor: string | null, separated: boolean): Promise<GeneratorTransitionFunctionReturnType> {
  const separator = separated ? ', true' : '';
  return {
    code: [`${node.type === ASTNodeType.Text
      ? `_renderLiteralText(${parentNode}, context, ${toStringLiteral(node.value)}, ${anchor}${separator});`
      : `_renderText(${parentNode}, context, () => ${resolveExpression(node.expression, compilerContext).expression}, ${anchor}${separator});`
      }`,
    ]
  };
}
