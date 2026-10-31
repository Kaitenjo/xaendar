import { indent } from '@xaendar/common';
import { ASTNodeType, getBlockIdentifier, resolveExpression, type CompilerContext, type IfNode } from '@xaendar/compiler';
import type { ServerFunctionToProcess } from '../../types/server-function-to-process.type';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS, toBlockFunction } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code of an `@if` chain: an `if` / `else if` / `else` statement rendering the block of the first branch
 * whose condition holds, through the function rendering it, named like the one of the client.
 *
 * @example
 * // @if (open()) { … } @else { … }
 * if (this.open()) {
 *   if0.call(this, out, context);
 * } else {
 *   else0.call(this, out, context);
 * }
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
  const addBranch = (opening: string, key: string, block: ServerFunctionToProcess['fn']['node']): void => {
    lines.push(`${opening} {`, indent(`${key}.call(this, out, context);`));
    functionsToProcess.set(key, toBlockFunction(block, key, parent, compilerContext));
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
  }

  lines.push('}');
  return { pieces: [{ statement: lines.join('\n') }], functionsToProcess };
}
