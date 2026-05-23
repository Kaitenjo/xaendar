import { NoArgsFunction } from "@xaendar/types";
import { ASTNode } from "../parser/types/ast.type.js";
import { ASTNodeType } from "../parser/types/node.enum.js";
import { Context } from "./models/render-context.model.js";
import { processConstDeclaration } from "./states/process-const-declaration.state.js";
import { processElement } from "./states/process-element.state.js";
import { processFor } from "./states/process-for.state.js";
import { processIf } from "./states/process-if.state.js";
import { processSwitch } from "./states/process-switch.state.js";
import { processTextAndInterpolation } from "./states/process-text-and-interpolation.state.js";
import { getElementIdentifier, getTextIdentifier, indent, ROOT_NODE } from "./utils/render-generator.utils.js";

let nodeToProcess = new Map<string, NoArgsFunction<string[]>>;

/**
 * Generates the TypeScript body of a render function from an AST.
 *
 * @param ast Top-level AST nodes produced by the Parser
 * @returns String containing the render function body
 */
export function generateRenderFunction(ast: ASTNode[]): string {
  nodeToProcess.clear();
  const context = new Context;

  const renderFunctions = [
    '_render() {',
    ...indent(
      ...ast.map((node, i) => [...processNode(node, i.toString(), ROOT_NODE, context), '']).flat()
    ),
    '}',
  ]

  while (nodeToProcess.size > 0) {
    const [key, fn] = nodeToProcess.entries().next().value!;
    renderFunctions.push(
      '',
      `${key} {`,
      ...indent(...fn()),
      '}',
    );
    nodeToProcess.delete(key);
  }

  return renderFunctions.join("\n");
}

/**
 * Generates code that appends `nodeName` to `parentNode`.
 * For flow control nodes no single var is produced; instead multiple children
 * are appended directly inside the control flow block.
 */
export function processNode(node: ASTNode, nodeName: string, parentNode: string, context: Context): string[] {
  switch (node.type) {
    case ASTNodeType.Text:
    case ASTNodeType.Interpolation:
      return processTextAndInterpolation(node, getTextIdentifier(parentNode, nodeName), parentNode, context);

    case ASTNodeType.Element:
      return processElement(node, getElementIdentifier(node, parentNode, nodeName), parentNode, context);

    case ASTNodeType.If:
      const keyIf = `control_flow_if_${nodeName}()`
      nodeToProcess.set(keyIf, () => processIf(node, nodeName, parentNode, context));
      return [`this.${keyIf};`];

    case ASTNodeType.For:
      const keyFor = `control_flow_for_${nodeName}()`
      nodeToProcess.set(keyFor, () => processFor(node, nodeName, parentNode, context));
      return [`this.${keyFor};`];

    case ASTNodeType.Switch:
      const keySwitch = `control_flow_switch_${nodeName}()`
      nodeToProcess.set(keySwitch, () => processSwitch(node, nodeName, parentNode, context));
      return [`this.${keySwitch};`];

    case ASTNodeType.ConstDeclaration:
      return processConstDeclaration(node, nodeName, parentNode, context);

    default:
      return [];
  }
}
