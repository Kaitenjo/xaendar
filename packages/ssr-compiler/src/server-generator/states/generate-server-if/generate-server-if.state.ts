import { indent } from '@xaendar/common';
import { ASTNodeType, getBlockIdentifier, resolveExpression, toStringLiteral, type CompilerContext, type IfNode } from '@xaendar/compiler';
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
 * @param compilerContext - The compiler context of the node.
 * @returns The code of the node, and the functions rendering its blocks.
 */
export function generateServerIf(node: IfNode, parent: ServerParent, index: string, compilerContext: CompilerContext): ServerTransitionResult {
  const lines = new Array<string>();
  const functionsToProcess = new Map<string, ServerFunctionToProcess>();
  let branch = 0;
  const addBranch = (opening: string, key: string, block: ServerFunctionToProcess['fn']['node']): void => {
    lines.push(`${opening} {`, indent(`out.push(${toStringLiteral(`<!--${SSR_MARKERS.if}:${branch}-->`)});`), indent(`${key}.call(this, out, context);`));
    functionsToProcess.set(key, toBlockFunction(block, key, parent, compilerContext));
    branch++;
  };
  const resolve = (condition: IfNode['conditionNode']): string => resolveExpression(condition, compilerContext, SERVER_RESOLVE_OPTIONS).expression;

  addBranch(`if (${resolve(node.conditionNode)})`, getBlockIdentifier('if', parent.id, index), node);

  let alternate = node.alternate;
  let i = 0;
  while (alternate?.type === ASTNodeType.ElseIf) {
    addBranch(`} else if (${resolve(alternate.conditionNode)})`, getBlockIdentifier('elseIf', parent.id, `${index}_${i}`), alternate);
    alternate = alternate.alternate;
    i++;
  }

  if (alternate) {
    addBranch('} else', getBlockIdentifier('else', parent.id, index), alternate);
  } else {
    lines.push('} else {', indent(`out.push(${toStringLiteral(`<!--${SSR_MARKERS.if}-->`)});`));
  }

  lines.push('}');
  return { pieces: [{ statement: lines.join('\n') }, { html: `<!--/${SSR_MARKERS.if}-->` }], functionsToProcess };
}
