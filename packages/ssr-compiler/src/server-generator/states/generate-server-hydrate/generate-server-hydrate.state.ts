import { getBlockIdentifier, type GeneratorContext, type HydrateNode } from '@xaendar/compiler';
import { SSR_MARKERS } from '../../../costants/ssr-markers.constants';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { toBlockFunction } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code rendering a `@hydrate` block on the server: its content, between the markers the browser finds it
 * by, whatever its triggers. The browser leaves it as it is until a trigger fires, then adopts its nodes.
 *
 * @param node - The hydrate node.
 * @param parent - Where the block is rendered.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - The generator context of the node.
 * @param _generateChildren - Unused: the content of the block is written by functions of its own.
 * @param last - Whether the block is the last node of its parent, written without the marker closing it, as the client
 *   renders it without anchor (see `isLastRenderedChild`).
 * @returns The code of the block, and the function rendering its content.
 */
export function generateServerHydrate(node: HydrateNode, parent: ServerParent, index: string, generatorContext: GeneratorContext, _generateChildren?: unknown, last = false): ServerTransitionResult {
  const key = getBlockIdentifier('hydrate', parent.id, index);
  const pieces: ServerTransitionResult['pieces'] = [{ html: `<!--${SSR_MARKERS.hydrate}-->` }, { statement: `${key}.call(this, out, context);` }];
  if (!last) {
    pieces.push({ html: `<!--/${SSR_MARKERS.hydrate}-->` });
  }

  return { pieces, functionsToProcess: new Map([[key, toBlockFunction(node, key, parent, generatorContext, last)]]) };
}
