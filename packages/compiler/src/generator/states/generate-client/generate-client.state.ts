import type { ClientNode } from '../../../parser/types/nodes/client-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getContentAnchor } from '../../utils/block-position/block-position.utils';
import { getBlockIdentifier } from '../../utils/generator/generator.utils';

/**
 * Generates the code of a `@client` block: a `_client(...)` call receiving the function rendering its content, a function
 * of the module the runtime calls as it is, a scope of its own, rendered before the anchor it receives, and `true` for
 * the last node of its parent, rendered without anchor. The `@placeholder` has no code: only the server renders it.
 *
 * @param node - The client node.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the block is rendered before, or `null` to append it.
 * @param _separated - Unused: a block is never separated from a text.
 * @param last - Whether the block is the last node of its parent, which needs no anchor (see `isLastRenderedChild`).
 * @returns The generated code, and the function of the content.
 */
export async function generateClient(node: ClientNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, _separated = false, last = false): Promise<GeneratorTransitionFunctionReturnType> {
  const key = getBlockIdentifier('client', parentNode, index);

  return {
    code: [`_client(${parentNode}, context, ${anchor}, ${key}${last ? ', true' : ''});`],
    functionsToProcess: new Map([[key, {
      fn: { node, parentNode: key, context: new GeneratorContext(generatorContext), anchor: getContentAnchor(last) },
      args: [key, 'parentContext', 'anchor', 'nodeStrategy']
    }]])
  };
}
