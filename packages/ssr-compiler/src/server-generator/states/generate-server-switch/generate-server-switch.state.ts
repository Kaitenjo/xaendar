import { indent } from '@xaendar/common';
import { getBlockIdentifier, resolveExpression, toStringLiteral, type GeneratorContext, type SwitchNode } from '@xaendar/compiler';
import type { ServerFunctionToProcess } from '../../types/server-function-to-process.type';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SSR_MARKERS } from '../../../costants/ssr-markers.constants';
import { SERVER_RESOLVE_OPTIONS, toBlockFunction } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code of a `@switch`, selecting the block as the client does: the one of the first `@case` one of whose
 * values is strictly equal to the value of the expression, evaluated once, or else the one of the `@default`, wherever
 * it is declared. The values of a `@case`, literals written as declared, are a constant of the module (`case0_1$values`),
 * compared strictly with the value, as the client compares them, without allocating anything.
 *
 * The block is written between the markers of the browser: `<!--xd-switch:i-->`, `i` the position of the block among the
 * `@case`s and the `@default` as they are declared, the index the client gives it, or `<!--xd-switch-->` when no block
 * is selected, and `<!--/xd-switch-->`, the place of the anchor of the client.
 *
 * @example
 * // @switch (kind()) { @default { … } @case ('a', 'b') { … } }
 * {
 *   const __value = this.kind();
 *   if (case0_1$values.indexOf(__value) !== -1) {   // const case0_1$values = ['a', 'b'];
 *     out.push('<!--xd-switch:1-->');
 *     case0_1.call(this, out, context);
 *   } else {
 *     out.push('<!--xd-switch:0-->');
 *     default0.call(this, out, context);
 *   }
 * }
 * out.push('<!--/xd-switch-->');
 *
 * @param node - The `@switch` node.
 * @param parent - Where the blocks are rendered.
 * @param index - The position of the node among its siblings.
 * @param generatorContext - The generator context of the node.
 * @param _generateChildren - Unused: the content of the block is written by functions of its own.
 * @param last - Whether the block is the last node of its parent, written without the marker closing it, as the client
 *   renders it without anchor (see `isLastRenderedChild`).
 * @returns The code of the node, and the functions rendering its blocks.
 */
export function generateServerSwitch(node: SwitchNode, parent: ServerParent, index: string, generatorContext: GeneratorContext, _generateChildren?: unknown, last = false): ServerTransitionResult {
  const body = [`const __value = ${resolveExpression(node.expression, generatorContext, SERVER_RESOLVE_OPTIONS).expression};`];
  const functionsToProcess = new Map<string, ServerFunctionToProcess>();
  let selectDefault = [`out.push(${toStringLiteral(`<!--${SSR_MARKERS.switch}-->`)});`];
  let opening = 'if';

  for (let i = 0; i < node.children.length; i++) {
    const caseNode = node.children[i];
    const { condition } = caseNode;
    const key = condition ? getBlockIdentifier('case', parent.id, `${index}_${i}`) : getBlockIdentifier('default', parent.id, index);
    functionsToProcess.set(key, toBlockFunction(caseNode, key, parent, generatorContext, last));
    const render = [`out.push(${toStringLiteral(`<!--${SSR_MARKERS.switch}:${i}-->`)});`, `${key}.call(this, out, context);`];
    if (condition) {
      // The values, literals, are a constant of the module: indexOf compares them strictly, as the client does
      const values = generatorContext.declareConstant(`${key}$values`, `[${condition.join(', ')}]`);
      body.push(`${opening} (${values}.indexOf(__value) !== -1) {`, ...indent(render));
      opening = '} else if';
    } else {
      selectDefault = render;
    }
  }

  // The @default is selected last, wherever it is declared: alone, it is always selected
  if (opening !== 'if') {
    body.push('} else {', ...indent(selectDefault), '}');
  } else {
    body.push(...selectDefault);
  }

  const pieces: ServerTransitionResult['pieces'] = [{ statement: ['{', ...indent(body), '}'].join('\n') }];
  if (!last) {
    pieces.push({ html: `<!--/${SSR_MARKERS.switch}-->` });
  }

  return { pieces, functionsToProcess };
}
