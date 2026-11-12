import { ASTNodeType } from '../../../parser/types/node.enum';
import { InterpolationNode } from '../../../parser/types/nodes/interpolation-node.type';
import { TextNode } from '../../../parser/types/nodes/text-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { resolveExpression, toStringLiteral } from '../../utils/generator/generator.utils';
import { declareExpression } from '../../utils/module-code/module-code.utils';

/**
 * Generates code for a text or interpolation node.
 *
 * Emits a `_renderLiteralText` call for plain text nodes and a
 * `_renderText` call for interpolation nodes, both appending a DOM text
 * node to the parent. A text the server separates from what precedes it with `<!---->` passes `true` as `separated`,
 * so that the hydration adopts the text after it, and an interpolation reading variables of the template passes their
 * names last, so that the text is written again when they change. The expression is a function of the module named after
 * the parent node and the position of the text (`span0$text1`), which the runtime calls with the component and the
 * context.
 *
 * @param node - A `TextNode` or `InterpolationNode` to process.
 * @param parentNode - Variable name of the parent DOM node to append to.
 * @param index - The index of the node among its siblings, which names the function of its expression.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the text is rendered before, or `null` to append it.
 * @param separated - Whether the server separates the text from what precedes it.
 * @returns Array of generated code lines.
 */
export async function generateTextAndInterpolation(node: TextNode | InterpolationNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, separated: boolean): Promise<GeneratorTransitionFunctionReturnType> {
  const slot = generatorContext.allocateNodeSlot();
  if (node.type === ASTNodeType.Text) {
    return { code: [`_renderLiteralText(${[parentNode, 'context', toStringLiteral(node.value), `${anchor}`].concat(optionalArguments([`${separated}`, slot?.toString()])).join(', ')});`] };
  }

  const { expression, variables } = resolveExpression(node.expression, generatorContext);
  const reads = generatorContext.getReads(variables);
  const text = declareExpression(generatorContext, `${parentNode}$text${index}`, expression);
  return { code: [`_renderText(${[parentNode, 'context', text, `${anchor}`].concat(optionalArguments([`${separated}`, reads, slot?.toString()])).join(', ')});`] };
}

/**
 * Writes the optional arguments of a call, leaving out the ones at the end holding their default value (`undefined`,
 * or `false` for `separated`), and writing `undefined` for the ones left out before an argument written.
 *
 * @param values - The code of the arguments, `undefined` for an argument left out.
 * @returns The arguments to write.
 */
function optionalArguments(values: ReadonlyArray<string | undefined>): string[] {
  let end = values.length;
  while (end && (values[end - 1] === undefined || values[end - 1] === 'false')) {
    end--;
  }

  return values.slice(0, end).map(value => value ?? 'undefined');
}
