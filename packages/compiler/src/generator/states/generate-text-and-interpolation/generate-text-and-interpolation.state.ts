import { ASTNodeType } from '../../../parser/types/node.enum';
import { InterpolationNode } from '../../../parser/types/nodes/interpolation-node.type';
import { TextNode } from '../../../parser/types/nodes/text-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { resolveExpression, toStringLiteral } from '../../utils/generator/generator.utils';
import { declareExpression, toObjectLiteral } from '../../utils/module-code/module-code.utils';

/**
 * Generates code for a text or interpolation node.
 *
 * Emits a `_renderLiteralText` call for plain text nodes and a
 * `_renderText` call for interpolation nodes, both appending a DOM text
 * node to the parent. A text the server separates from what precedes it with `<!---->` passes `true` as `separated`,
 * so that the hydration adopts the text after it. An interpolation is a binding, a constant of the module
 * (`span0$text1$binding`, see `declareBinding`) holding its callback, its expression, a function of the module named
 * after the parent node and the position of the text (`span0$text1`), which the runtime calls with the component and
 * the context, the identifiers of the variables of the template it reads, so that the text is written again when they
 * change, and its slots.
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
    return { code: [`_renderLiteralText(${appendOptionalArguments([parentNode, 'context', toStringLiteral(node.value), `${anchor}`], separated, slot).join(', ')});`] };
  }

  const { expression, variables } = resolveExpression(node.expression, generatorContext);
  const reads = generatorContext.getReads(variables);
  const name = `${parentNode}$text${index}`;
  const members = [`value: ${declareExpression(generatorContext, name, expression)}`];
  if (reads) {
    members.push(`reads: ${reads}`);
  }

  // A text rendered in a scope the runtime creates gets no slot: its binding is a constant all the same
  const binding = generatorContext.declareBinding(`${name}$binding`, members, '_updateText', !!reads) ?? generatorContext.declareConstant(`${name}$binding`, toObjectLiteral(members));
  return { code: [`_renderText(${appendOptionalArguments([parentNode, 'context', binding, `${anchor}`], separated, slot).join(', ')});`] };
}

/**
 * Appends to the arguments of a call rendering a text the optional ones, `separated` and the slot of the node, leaving
 * out the ones at the end holding their default value (`false`, `undefined`).
 *
 * @param args - The arguments written before them.
 * @param separated - Whether the server separates the text from what precedes it.
 * @param slot - The slot of the node, `undefined` for a node no scope tracks.
 * @returns The arguments to write.
 */
function appendOptionalArguments(args: string[], separated: boolean, slot: number | undefined): string[] {
  if (slot !== undefined) {
    args.push(`${separated}`, `${slot}`);
  } else if (separated) {
    args.push('true');
  }

  return args;
}
