import { indent } from '@xaendar/common';
import { ASTNodeType, getBlockIdentifier, resolveExpression, toStringLiteral, type GeneratorContext, type IfNode } from '@xaendar/compiler';
import type { ServerFunctionToProcess } from '../../types/server-function-to-process.type';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SSR_MARKERS } from '../../../costants/ssr-markers.constants';
import { SERVER_RESOLVE_OPTIONS, toBlockFunction } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code of an `@if` chain: an `if` / `else if` / `else` statement rendering the block of the first branch
 * whose condition holds, through the function rendering it, named like the one of the client.
 *
 * The blocks are written between the markers of the browser: `<!--xd-if:i-->`, `i` the index of the branch rendered as
 * the client counts it (the `@if` first, then each `@else if`, then the `@else`), or `<!--xd-if-->` when none is, and
 * `<!--/xd-if-->`, the place of the anchor of the client.
 *
 * @example
 * // @if (open()) { … }
 * if (this.open()) {
 *   out.push('<!--xd-if:0-->');
 *   if0.call(this, out, context);
 * } else {
 *   out.push('<!--xd-if-->');
 * }
 * out.push('<!--/xd-if-->');
 *
 * @param node - The `@if` node.
 * @param parent - Where the blocks are rendered.
 * @param index - The position of the node among its siblings.
 * @param generatorContext - The generator context of the node.
 * @returns The code of the node, and the functions rendering its blocks.
 */
export function generateServerIf(node: IfNode, parent: ServerParent, index: string, generatorContext: GeneratorContext): ServerTransitionResult {
  // The opening of each branch, the name of the function rendering it and its node
  const branches: Array<[string, string, ServerFunctionToProcess['fn']['node']]> = [
    [`if (${resolveCondition(node.conditionNode, generatorContext)})`, getBlockIdentifier('if', parent.id, index), node]
  ];

  let alternate = node.alternate;
  let i = 0;
  while (alternate?.type === ASTNodeType.ElseIf) {
    branches.push([`} else if (${resolveCondition(alternate.conditionNode, generatorContext)})`, getBlockIdentifier('elseIf', parent.id, `${index}_${i}`), alternate]);
    alternate = alternate.alternate;
    i++;
  }

  if (alternate) {
    branches.push(['} else', getBlockIdentifier('else', parent.id, index), alternate]);
  }

  const lines = new Array<string>();
  const functionsToProcess = new Map<string, ServerFunctionToProcess>();
  for (let branch = 0; branch < branches.length; branch++) {
    const [opening, key, block] = branches[branch];
    lines.push(`${opening} {`, indent(`out.push(${toStringLiteral(`<!--${SSR_MARKERS.if}:${branch}-->`)});`), indent(`${key}.call(this, out, context);`));
    functionsToProcess.set(key, toBlockFunction(block, key, parent, generatorContext));
  }

  if (!alternate) {
    lines.push('} else {', indent(`out.push(${toStringLiteral(`<!--${SSR_MARKERS.if}-->`)});`));
  }

  lines.push('}');
  return { pieces: [{ statement: lines.join('\n') }, { html: `<!--/${SSR_MARKERS.if}-->` }], functionsToProcess };
}

/**
 * Resolves the condition of a branch of an `@if` into the expression rendering it on the server.
 *
 * @param condition - The condition.
 * @param generatorContext - The generator context of the node.
 * @returns The expression.
 */
function resolveCondition(condition: IfNode['conditionNode'], generatorContext: GeneratorContext): string {
  return resolveExpression(condition, generatorContext, SERVER_RESOLVE_OPTIONS).expression;
}
