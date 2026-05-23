import { SwitchNode } from '../../parser/types/nodes/switch-node.type.js';
import { Context } from '../models/render-context.model.js';
import { processNode } from '../render-generator.js';
import { indent, resolveExpression } from '../utils/render-generator.utils.js';

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
export function processSwitch(node: SwitchNode, nodeName: string, parentNode: string, context: Context): string[] {
  return [
    `switch (${resolveExpression(node.expression, context)}) {`,
    ...node.cases.map(caseNode => ([
      ...indent(
        ...(!caseNode.condition ? ['default: {'] : caseNode.condition.map((cond, i, arr) => `case ${cond}:${i === arr.length - 1 ? ' {' : ''}`)),
        ...caseNode.children.map((child, i) => indent(...processNode(child, `${nodeName}_${i}_${i}`, parentNode, new Context([], context)))).flat(),
        `${indent('break;')}`,
        `}`
      )
    ])).flat(),
    '}'
  ];
}
