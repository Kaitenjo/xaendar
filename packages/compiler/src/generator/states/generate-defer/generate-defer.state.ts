import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import { GeneratorContext } from '../../context/context';
import type { GeneratorFunctionToProcess } from '../../types/generator-function-to-process.type';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { appendBlockPosition, getContentAnchor } from '../../utils/block-position/block-position.utils';
import { getBlockIdentifier } from '../../utils/generator/generator.utils';
import { toObjectLiteral } from '../../utils/module-code/module-code.utils';
import { getTriggerProperties } from '../../utils/trigger-properties/trigger-properties.utils';

/**
 * Generates the code of a `@defer` block: a `_defer(...)` call receiving a constant of the module (`div0__defer0$defer`,
 * see `DeferBlock` of the runtime) holding its triggers, the function reading the
 * expression of its `when` trigger, the one loading the modules of the components only its content renders (see
 * `getTriggerProperties`), the functions rendering its content and the blocks following it, each one a scope of its
 * own rendered before the anchor it receives, and the times the `@placeholder` and the `@loading` declare, in
 * milliseconds. The function of the `@error` takes the error too, declared in its scope as a value under the name the
 * `@error` gives it, if any.
 *
 * @param node - The defer node.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param generatorContext - Current render scope context.
 * @param anchor - The name of the anchor variable the block is rendered before, or `null` to append it.
 * @param _separated - Unused: a block is never separated from a text.
 * @param last - Whether the block is the last node of its parent, which needs no anchor (see `isLastRenderedChild`).
 * @returns The generated code, and the functions of the content and of the blocks following it.
 */
export async function generateDefer(node: DeferNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, _separated = false, last = false): Promise<GeneratorTransitionFunctionReturnType> {
  const key = getBlockIdentifier('defer', parentNode, index);
  const properties = getTriggerProperties(node, key, generatorContext);
  const functionsToProcess = new Map<string, GeneratorFunctionToProcess>();
  const contentAnchor = getContentAnchor(last);

  addBlock(properties, functionsToProcess, 'content', key, node, new GeneratorContext(generatorContext), contentAnchor);
  if (node.placeholder) {
    addBlock(properties, functionsToProcess, 'placeholder', getBlockIdentifier('placeholder', parentNode, index), node.placeholder, new GeneratorContext(generatorContext), contentAnchor);
    if (node.placeholder.minimum !== undefined) {
      properties.push(`placeholderMinimum: ${node.placeholder.minimum}`);
    }
  }

  if (node.loading) {
    const { after, minimum } = node.loading;
    addBlock(properties, functionsToProcess, 'loading', getBlockIdentifier('loading', parentNode, index), node.loading, new GeneratorContext(generatorContext), contentAnchor);
    if (after !== undefined) {
      properties.push(`loadingAfter: ${after}`);
    }

    if (minimum !== undefined) {
      properties.push(`loadingMinimum: ${minimum}`);
    }
  }

  if (node.error) {
    const { name } = node.error;
    const errorContext = new GeneratorContext(generatorContext);
    if (name) {
      errorContext.addIdentifier(name, 'value');
    }

    addBlock(properties, functionsToProcess, 'error', getBlockIdentifier('error', parentNode, index), node.error, errorContext, contentAnchor, name ? `context.addIdentifier('${name}', error);` : undefined);
  }

  appendBlockPosition(properties, last);

  return {
    code: [
      `_defer(${parentNode}, context, ${anchor}, ${generatorContext.declareConstant(`${key}$defer`, toObjectLiteral(properties))});`
    ],
    functionsToProcess
  };
}

/**
 * Adds the function rendering the content of a `@defer`, or a block following it, to the functions to generate, and
 * the property passing it to `_defer`.
 *
 * @param properties - The properties of the block passed to `_defer`.
 * @param functionsToProcess - The functions to generate.
 * @param property - The property of the function: the one of `error` takes the error too.
 * @param key - The name of the function.
 * @param block - The node of the block.
 * @param context - The generator context of the block.
 * @param anchor - The anchor the function forwards (see `getContentAnchor`).
 * @param precode - The code starting the function, if any.
 */
function addBlock(properties: string[], functionsToProcess: Map<string, GeneratorFunctionToProcess>, property: 'content' | 'placeholder' | 'loading' | 'error', key: string, block: GeneratorFunctionToProcess['fn']['node'], context: GeneratorContext, anchor: string | undefined, precode?: string): void {
  properties.push(`${property}: ${key}`);
  const args = [key, 'parentContext', 'anchor', 'nodeStrategy'];
  if (property === 'error') {
    args.push('error');
  }

  functionsToProcess.set(key, { fn: { node: block, parentNode: key, context, precode, anchor }, args });
}
