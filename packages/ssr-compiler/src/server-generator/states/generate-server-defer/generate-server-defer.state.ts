import { getBlockIdentifier, type GeneratorContext, type DeferNode } from '@xaendar/compiler';
import { SSR_MARKERS } from '../../../costants/ssr-markers.constants';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { toBlockFunction } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code rendering a `@defer` block on the server: the markers the browser finds the block by and, between
 * them, its `@placeholder`, if any, which the browser adopts. The content, the `@loading` and the `@error` are not
 * generated: the browser creates them once a trigger fires.
 *
 * @param node - The defer node.
 * @param parent - Where the block is rendered.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - The generator context of the node.
 * @returns The code of the block, and the function rendering its placeholder.
 */
export function generateServerDefer({ placeholder }: DeferNode, parent: ServerParent, index: string, generatorContext: GeneratorContext): ServerTransitionResult {
  const open = { html: `<!--${SSR_MARKERS.defer}-->` };
  const close = { html: `<!--/${SSR_MARKERS.defer}-->` };
  if (!placeholder) {
    return { pieces: [open, close] };
  }

  const key = getBlockIdentifier('placeholder', parent.id, index);
  return {
    pieces: [open, { statement: `${key}.call(this, out, context);` }, close],
    functionsToProcess: new Map([[key, toBlockFunction(placeholder, key, parent, generatorContext)]])
  };
}
