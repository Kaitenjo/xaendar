import { ASTNode } from "../parser/models/ast.type.js";
import { ASTNodeType } from "../parser/models/node.enum.js";
import { Context } from "./models/render-context.model.js";
import { processConstDeclaration } from "./states/process-const-declaration.state.js";
import { processElement } from "./states/process-element.state.js";
import { processFor } from "./states/process-for.state.js";
import { processIf } from "./states/process-if.state.js";
import { processSwitch } from "./states/process-switch.state.js";
import { processTextAndInterpolation } from "./states/process-text-and-interpolation.state.js";

/**
 * Generates the TypeScript body of a render function from an AST.
 *
 * @param ast       Top-level AST nodes produced by the Parser
 * @returns         String containing the render function body
 */
export function generateRenderFunction(ast: ASTNode[]): string {
  const context = new Context;

  return [`
const shadow = this.shadowRoot!;
`,
    ...ast.map((node, i) => processNode(node, `node${i}`, 'shadow', context)).flat()
  ].join("\n");
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
      return processTextAndInterpolation(node, nodeName, parentNode, context);

    case ASTNodeType.Element:
      return processElement(node, nodeName, parentNode, context);

    case ASTNodeType.If:
      return processIf(node, nodeName, parentNode, context);

    case ASTNodeType.For:
      return processFor(node, nodeName, parentNode, context);

    case ASTNodeType.Switch:
      return processSwitch(node, nodeName, parentNode, context);

    case ASTNodeType.ConstDeclaration:
      return processConstDeclaration(node, nodeName, parentNode, context);

    default:
      return [];
  }
}
