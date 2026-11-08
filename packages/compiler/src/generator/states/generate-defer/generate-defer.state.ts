import { indent } from '@xaendar/common';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import { GeneratorContext } from '../../context/context';
import type { GeneratorFunctionToProcess } from '../../types/generator-function-to-process.type';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getBlockIdentifier } from '../../utils/generator/generator.utils';
import { getTriggerProperties } from '../../utils/trigger-properties/trigger-properties.utils';

/**
 * Generates the code of a `@defer` block: a `_defer(...)` call receiving its triggers, the function reading the
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
 * @returns The generated code, and the functions of the content and of the blocks following it.
 */
export async function generateDefer(node: DeferNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const properties = getTriggerProperties(node, generatorContext);
  const functionsToProcess = new Map<string, GeneratorFunctionToProcess>();

  addBlock(properties, functionsToProcess, 'content', getBlockIdentifier('defer', parentNode, index), node, new GeneratorContext(generatorContext));
  if (node.placeholder) {
    addBlock(properties, functionsToProcess, 'placeholder', getBlockIdentifier('placeholder', parentNode, index), node.placeholder, new GeneratorContext(generatorContext));
    if (node.placeholder.minimum !== undefined) {
      properties.push(`placeholderMinimum: ${node.placeholder.minimum}`);
    }
  }

  if (node.loading) {
    const { after, minimum } = node.loading;
    addBlock(properties, functionsToProcess, 'loading', getBlockIdentifier('loading', parentNode, index), node.loading, new GeneratorContext(generatorContext));
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

    addBlock(properties, functionsToProcess, 'error', getBlockIdentifier('error', parentNode, index), node.error, errorContext, name ? `context.addIdentifier('${name}', error);` : undefined);
  }

  return {
    code: [
      `_defer(${parentNode}, context, ${anchor}, {`,
      ...indent(properties.map((property, i) => i < properties.length - 1 ? `${property},` : property)),
      '});'
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
 * @param precode - The code starting the function, if any.
 */
function addBlock(properties: string[], functionsToProcess: Map<string, GeneratorFunctionToProcess>, property: 'content' | 'placeholder' | 'loading' | 'error', key: string, block: GeneratorFunctionToProcess['fn']['node'], context: GeneratorContext, precode?: string): void {
  properties.push(`${property}: ${key}.bind(this)`);
  const args = [key, 'parentContext', 'anchor', 'nodeStrategy'];
  if (property === 'error') {
    args.push('error');
  }

  functionsToProcess.set(key, { fn: { node: block, parentNode: key, context, precode, anchor: 'anchor' }, args });
}
