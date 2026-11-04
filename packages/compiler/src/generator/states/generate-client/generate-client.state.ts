import type { ClientNode } from '../../../parser/types/nodes/client-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getBlockIdentifier } from '../../utils/generator/generator.utils';

/**
 * Generates the code of a `@client` block: a `_client(...)` call receiving the function rendering its content, a scope
 * of its own, rendered before the anchor it receives. The `@placeholder` has no code: only the server renders it.
 *
 * @param node - The client node.
 * @param parentNode - Variable name of the parent DOM node.
 * @param index - The index of the node among its siblings.
 * @param compilerContext - Current render scope context.
 * @param anchor - The name of the anchor variable the block is rendered before, or `null` to append it.
 * @returns The generated code, and the function of the content.
 */
export async function generateClient(node: ClientNode, parentNode: string, index: string, compilerContext: CompilerContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const key = getBlockIdentifier('client', parentNode, index);

  return {
    code: [`_client(${parentNode}, context, ${anchor}, ${key}.bind(this));`],
    functionsToProcess: new Map([[key, {
      fn: { node, parentNode: key, context: new CompilerContext(compilerContext), anchor: 'anchor' },
      args: [key, 'parentContext', 'anchor', 'nodeStrategy']
    }]])
  };
}
