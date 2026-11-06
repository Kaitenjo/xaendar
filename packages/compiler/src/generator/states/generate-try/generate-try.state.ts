import type { TryNode } from '../../../parser/types/nodes/try-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getBlockIdentifier } from '../../utils/generator/generator.utils';

/**
 * Generates the code of a `@try` block: a `_try(...)` call receiving the function rendering its content and the one
 * rendering its `@catch`, each one a scope of its own rendered before the anchor it receives. The function of the
 * `@catch` takes the error too, declared in its scope as a value under the name the `@catch` gives it, if any.
 *
 * @param node - The try node.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the block is rendered before, or `null` to append it.
 * @returns The generated code, and the functions of the content and of the `@catch`.
 */
export async function generateTry(node: TryNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const contentKey = getBlockIdentifier('try', parentNode, index);
  const catchKey = getBlockIdentifier('catch', parentNode, index);

  const { name } = node.catch;
  const catchContext = new GeneratorContext(generatorContext);
  if (name) {
    catchContext.addIdentifier(name, 'value');
  }

  return {
    code: [`_try(${parentNode}, context, ${anchor}, { content: ${contentKey}.bind(this), catch: ${catchKey}.bind(this) });`],
    functionsToProcess: new Map([
      [contentKey, {
        fn: { node, parentNode: contentKey, context: new GeneratorContext(generatorContext), anchor: 'anchor' },
        args: [contentKey, 'parentContext', 'anchor', 'nodeStrategy']
      }],
      [catchKey, {
        fn: { node: node.catch, parentNode: catchKey, context: catchContext, precode: name ? `context.addIdentifier('${name}', error);` : undefined, anchor: 'anchor' },
        args: [catchKey, 'parentContext', 'anchor', 'nodeStrategy', 'error']
      }]
    ])
  };
}
