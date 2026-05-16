import { ASTNode } from '../../parser/models/ast.type.js';
import { SwitchNode } from '../../parser/models/nodes/switch-node.type.js';
import { Context } from '../models/render-context.model.js';
import { resolveExpression, indent } from '../utils/render-generator.utils.js';

/**
 * Function type for recursively processing an AST node into render code strings.
 */
type ProcessNodeFn = (node: ASTNode, nodeName: string, parentNode: string, context: Context) => string[];

/**
 * Generates code for a `@switch` node.
 * Emits a `switch (expression) { case ...: { ... break; } ... }` block.
 *
 * @param node The `SwitchNode` to process.
 * @param nodeName Base variable name prefix for child nodes.
 * @param parentNode Variable name of the parent DOM node.
 * @param context Current render scope context.
 * @param processNode Recursive node processor function.
 * @returns Array of generated code lines.
 */
export function processSwitch(node: SwitchNode, nodeName: string, parentNode: string, context: Context, processNode: ProcessNodeFn): string[] {
  return [
    `switch (${resolveExpression(node.expression)}) {`,
    ...node.cases.map(caseNode => ([
      ...indent(
        `${!caseNode.condition ? 'default' : `case ${caseNode.condition}`}: {`,
        ...caseNode.children.map((child, i) => indent(...processNode(child, `${nodeName}_s${i}_${i}`, parentNode, context))).flat(),
        `${indent('break;')}`,
        `}`
      )
    ])).flat(),
    '}'
  ];
}
