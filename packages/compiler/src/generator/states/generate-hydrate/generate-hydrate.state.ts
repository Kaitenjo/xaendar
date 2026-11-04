import { indent } from '@xaendar/common';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getBlockIdentifier, resolveExpression } from '../../utils/generator/generator.utils';

/**
 * Generates the code of a `@hydrate` block: a `_hydrate(...)` call receiving its triggers, the function reading the
 * expression of its `when` trigger, the one loading the modules of the components only its content renders (see
 * `getDeferredModules`), and the function rendering its content, a scope of its own, rendered before the anchor it
 * receives.
 *
 * @param node - The hydrate node.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param compilerContext - Current render scope context.
 * @param anchor - The name of the anchor variable the block is rendered before, or `null` to append it.
 * @returns The generated code, and the function of the content.
 */
export async function generateHydrate(node: HydrateNode, parentNode: string, index: string, compilerContext: CompilerContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const properties = new Array<string>();

  const triggers = new Array<string>();
  for (let i = 0; i < node.triggers.length; i++) {
    const trigger = node.triggers[i];
    trigger.kind === 'when'
      ? properties.push(`when: () => ${resolveExpression(trigger.expressionNode, compilerContext).expression}`)
      : triggers.push(`'${trigger.kind}'`);
  }
  properties.unshift(`triggers: [${triggers.join(', ')}]`);

  const modules = compilerContext.deferredModules?.get(node);
  if (modules?.length) {
    properties.push(`load: () => Promise.all([${modules.map(path => `import(${JSON.stringify(path)})`).join(', ')}])`);
  }

  const key = getBlockIdentifier('hydrate', parentNode, index);
  properties.push(`content: ${key}.bind(this)`);

  return {
    code: [
      `_hydrate(${parentNode}, context, ${anchor}, {`,
      ...indent(properties.map((property, i) => i < properties.length - 1 ? `${property},` : property)),
      '});'
    ],
    functionsToProcess: new Map([[key, {
      fn: { node, parentNode: key, context: new CompilerContext(compilerContext), anchor: 'anchor' },
      args: [key, 'parentContext', 'anchor', 'nodeStrategy']
    }]])
  };
}
