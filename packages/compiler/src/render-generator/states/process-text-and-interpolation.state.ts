import { ASTNodeType } from '../../parser/models/node.enum.js';
import { InterpolationNode } from '../../parser/models/nodes/interpolation-node.type.js';
import { TextNode } from '../../parser/models/nodes/text-node.type.js';
import { Context } from '../models/render-context.model.js';
import { resolveExpression } from '../utils/render-generator.utils.js';

/**
 * Generates code for a text or interpolation node.
 * Creates a DOM text node with either a JSON-stringified literal or a resolved expression,
 * then appends it to the parent DOM node.
 *
 * @param node A `TextNode` or `InterpolationNode` to process.
 * @param nodeName Variable name for the created text node.
 * @param parentNode Variable name of the parent DOM node.
 * @param _context Unused render context.
 * @returns Array of two generated code lines: the text node creation and the appendChild call.
 */
export function processTextAndInterpolation(node: TextNode | InterpolationNode, nodeName: string, parentNode: string, context: Context): string[] {
  const textValue = node.type === ASTNodeType.Text ? JSON.stringify(node.value) : resolveExpression(node.expression, context);
  return [
    `const ${nodeName} = document.createTextNode(${textValue});`,
    `${parentNode}.appendChild(${nodeName});`
  ];
}
