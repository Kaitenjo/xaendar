import { getBlockIdentifier, type CompilerContext, type HydrateNode } from '@xaendar/compiler';
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
 * @param compilerContext - The compiler context of the node.
 * @returns The code of the block, and the function rendering its content.
 */
export function generateServerHydrate(node: HydrateNode, parent: ServerParent, index: string, compilerContext: CompilerContext): ServerTransitionResult {
  const key = getBlockIdentifier('hydrate', parent.id, index);
  return {
    pieces: [
      { html: `<!--${SSR_MARKERS.hydrate}-->` },
      { statement: `${key}.call(this, out, context);` },
      { html: `<!--/${SSR_MARKERS.hydrate}-->` }
    ],
    functionsToProcess: new Map([[key, toBlockFunction(node, key, parent, compilerContext)]])
  };
}
