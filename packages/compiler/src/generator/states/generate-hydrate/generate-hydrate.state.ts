import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import { GeneratorContext } from '../../context/context';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { appendBlockPosition, getContentAnchor } from '../../utils/block-position/block-position.utils';
import { getBlockIdentifier } from '../../utils/generator/generator.utils';
import { toObjectLiteral } from '../../utils/module-code/module-code.utils';
import { getTriggerProperties } from '../../utils/trigger-properties/trigger-properties.utils';

/**
 * Generates the code of a `@hydrate` block: a `_hydrate(...)` call receiving a constant of the module
 * (`div0__hydrate0$hydrate`, see `HydrateBlock` of the runtime) holding its triggers, the function reading the
 * expression of its `when` trigger, the one loading the modules of the components only its content renders (see
 * `getTriggerProperties`), and the function rendering its content, a scope of its own, rendered before the anchor it
 * receives.
 *
 * @param node - The hydrate node.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the block is rendered before, or `null` to append it.
 * @param _separated - Unused: a block is never separated from a text.
 * @param last - Whether the block is the last node of its parent, which needs no anchor (see `isLastRenderedChild`).
 * @returns The generated code, and the function of the content.
 */
export async function generateHydrate(node: HydrateNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, _separated = false, last = false): Promise<GeneratorTransitionFunctionReturnType> {
  const key = getBlockIdentifier('hydrate', parentNode, index);
  const properties = getTriggerProperties(node, key, generatorContext);
  properties.push(`content: ${key}`);
  appendBlockPosition(properties, last);

  return {
    code: [
      `_hydrate(${parentNode}, context, ${anchor}, ${generatorContext.declareConstant(`${key}$hydrate`, toObjectLiteral(properties))});`
    ],
    functionsToProcess: new Map([[key, {
      fn: { node, parentNode: key, context: new GeneratorContext(generatorContext), anchor: getContentAnchor(last) },
      args: [key, 'parentContext', 'anchor', 'nodeStrategy']
    }]])
  };
}
