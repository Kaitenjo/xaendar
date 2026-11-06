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
 * `getTriggerProperties`), and the functions rendering its content and the blocks following it, each one a scope of its
 * own rendered before the anchor it receives. The function of the `@error` takes the error too, declared in its scope as a
 * value under the name the `@error` gives it, if any.
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

  const addBlock = (property: 'content' | 'placeholder' | 'loading' | 'error', prefix: 'defer' | 'placeholder' | 'loading' | 'error', block: GeneratorFunctionToProcess['fn']['node'], context = new GeneratorContext(generatorContext), precode?: string) => {
    const key = getBlockIdentifier(prefix, parentNode, index);
    properties.push(`${property}: ${key}.bind(this)`);
    const args = [key, 'parentContext', 'anchor', 'nodeStrategy'];
    if (prefix === 'error') {
      args.push('error');
    }

    functionsToProcess.set(key, { fn: { node: block, parentNode: key, context, precode, anchor: 'anchor' }, args });
  };

  addBlock('content', 'defer', node);
  if (node.placeholder) {
    addBlock('placeholder', 'placeholder', node.placeholder);
  }

  if (node.loading) {
    addBlock('loading', 'loading', node.loading);
  }

  if (node.error) {
    const { name } = node.error;
    const errorContext = new GeneratorContext(generatorContext);
    if (name) {
      errorContext.addIdentifier(name, 'value');
    }

    addBlock('error', 'error', node.error, errorContext, name ? `context.addIdentifier('${name}', error);` : undefined);
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
