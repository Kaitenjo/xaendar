import type { TryNode } from '../../../parser/types/nodes/try-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { allocateBlockSlot, appendBlockPosition, getContentAnchor } from '../../utils/block-position/block-position.utils';
import { getBlockIdentifier } from '../../utils/generator/generator.utils';
import { toObjectLiteral } from '../../utils/module-code/module-code.utils';

/**
 * Generates the code of a `@try` block: a `_try(...)` call receiving a constant of the module (`div0__try0$try`) naming
 * the function rendering its content and the one rendering its `@catch`, functions of the module the runtime calls as
 * they are, each one a scope of its own rendered before the anchor it receives. The function of the
 * `@catch` takes the error too, declared in its scope as a value under the name the `@catch` gives it, if any.
 *
 * @param node - The try node.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the block is rendered before, or `null` to append it.
 * @param _separated - Unused: a block is never separated from a text.
 * @param last - Whether the block is the last node of its parent, which needs no anchor (see `isLastRenderedChild`).
 * @returns The generated code, and the functions of the content and of the `@catch`.
 */
export async function generateTry(node: TryNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, _separated = false, last = false): Promise<GeneratorTransitionFunctionReturnType> {
  const contentAnchor = getContentAnchor(last);
  const contentKey = getBlockIdentifier('try', parentNode, index);
  const catchKey = getBlockIdentifier('catch', parentNode, index);

  const { name } = node.catch;
  const catchContext = new GeneratorContext(generatorContext);
  if (name) {
    catchContext.addIdentifier(name, 'value');
  }

  const members = [`content: ${contentKey}`, `catch: ${catchKey}`];
  appendBlockPosition(members, last, allocateBlockSlot(generatorContext, last));
  return {
    code: [`_try(${parentNode}, context, ${anchor}, ${generatorContext.declareConstant(`${contentKey}$try`, toObjectLiteral(members))});`],
    functionsToProcess: new Map([
      [contentKey, {
        fn: { node, parentNode: contentKey, context: new GeneratorContext(generatorContext), anchor: contentAnchor },
        args: [contentKey, 'parentContext', 'anchor', 'nodeStrategy']
      }],
      [catchKey, {
        fn: { node: node.catch, parentNode: catchKey, context: catchContext, precode: name ? `context[${catchContext.addressOf(name)!.slot}] = error;` : undefined, anchor: contentAnchor },
        args: [catchKey, 'parentContext', 'anchor', 'nodeStrategy', 'error']
      }]
    ])
  };
}
