import { GeneratorContext, getBlockIdentifier, type TryNode } from '@xaendar/compiler';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { toBlockFunction } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code rendering a `@try` block on the server: `_ssrTry` renders its content, or its `@catch` when the
 * content throws, between the markers the browser finds the block by. The functions follow the ones of the client: the
 * one of the `@catch` takes the error too, declared in its scope as a value under the name the `@catch` gives it.
 *
 * @param node - The try node.
 * @param parent - Where the block is rendered.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - The generator context of the node.
 * @returns The code of the block, and the functions rendering its content and its `@catch`.
 */
export function generateServerTry(node: TryNode, parent: ServerParent, index: string, generatorContext: GeneratorContext): ServerTransitionResult {
  const contentKey = getBlockIdentifier('try', parent.id, index);
  const catchKey = getBlockIdentifier('catch', parent.id, index);

  const { name } = node.catch;
  const catchContext = new GeneratorContext(generatorContext);
  if (name) {
    catchContext.addIdentifier(name, 'value');
  }

  return {
    pieces: [{ statement: `_ssrTry(out, output => ${contentKey}.call(this, output, context), (output, error) => ${catchKey}.call(this, output, context, error));` }],
    functionsToProcess: new Map([
      [contentKey, toBlockFunction(node, contentKey, parent, generatorContext)],
      [catchKey, {
        fn: { node: node.catch, context: catchContext, parent: { id: catchKey, tag: parent.tag }, precode: name ? `context.addIdentifier('${name}', error);` : undefined },
        args: ['out', 'parentContext', 'error']
      }]
    ])
  };
}
