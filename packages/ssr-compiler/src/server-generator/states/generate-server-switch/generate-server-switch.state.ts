import { indent } from '@xaendar/common';
import { getBlockIdentifier, resolveExpression, type CompilerContext, type SwitchNode } from '@xaendar/compiler';
import type { ServerFunctionToProcess } from '../../types/server-function-to-process.type';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS, toBlockFunction } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code of a `@switch`, selecting the block as the client does: the one of the first `@case` one of whose
 * values is strictly equal to the value of the expression, evaluated once, or else the one of the `@default`, wherever
 * it is declared. The values of a `@case` are written as declared, in an array literal, as the client writes them.
 *
 * @example
 * // @switch (kind()) { @default { … } @case ('a', 'b') { … } }
 * {
 *   const __value = this.kind();
 *   if (['a', 'b'].some(candidate => candidate === __value)) {
 *     case0_1.call(this, out, context);
 *   } else {
 *     default0.call(this, out, context);
 *   }
 * }
 *
 * @param node - The `@switch` node.
 * @param parent - Where the blocks are rendered.
 * @param index - The position of the node among its siblings.
 * @param compilerContext - The compiler context of the node.
 * @returns The code of the node, and the functions rendering its blocks.
 */
export function generateServerSwitch(node: SwitchNode, parent: ServerParent, index: string, compilerContext: CompilerContext): ServerTransitionResult {
  const body = [`const __value = ${resolveExpression(node.expression, compilerContext, SERVER_RESOLVE_OPTIONS).expression};`];
  const functionsToProcess = new Map<string, ServerFunctionToProcess>();
  let defaultKey: string | undefined;
  let opening = 'if';

  for (let i = 0; i < node.children.length; i++) {
    const caseNode = node.children[i];
    const { condition } = caseNode;
    const key = condition ? getBlockIdentifier('case', parent.id, `${index}_${i}`) : getBlockIdentifier('default', parent.id, index);
    functionsToProcess.set(key, toBlockFunction(caseNode, key, parent, compilerContext));
    if (condition) {
      body.push(`${opening} ([${condition.join(', ')}].some(candidate => candidate === __value)) {`, indent(`${key}.call(this, out, context);`));
      opening = '} else if';
    } else {
      defaultKey = key;
    }
  }

  // The @default is selected last, wherever it is declared: alone, it is always selected
  const hasCases = opening !== 'if';
  if (defaultKey) {
    const call = `${defaultKey}.call(this, out, context);`;
    hasCases ? body.push('} else {', indent(call), '}') : body.push(call);
  } else if (hasCases) {
    body.push('}');
  }

  return { pieces: [{ statement: ['{', ...indent(body), '}'].join('\n') }], functionsToProcess };
}
