import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import type { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { resolveExpression } from '../generator/generator.utils';

/**
 * Generates the properties of the block a `@hydrate` or a `@defer` passes to the runtime about what it waits for: its
 * triggers written by name, the function reading the expression of its `when` trigger, if any, and the one loading the
 * modules of the components only its content renders (see `getDeferredModules`), if any.
 *
 * @example
 * getTriggerProperties(parseTemplate('@defer (idle, when ready()) { … }')[0], context);
 * // ["triggers: ['idle']", 'when: () => this.ready()']
 *
 * @param node - The block.
 * @param compilerContext - The compiler context of the block.
 * @returns The properties, as written in the object literal of the block.
 */
export function getTriggerProperties(node: HydrateNode | DeferNode, compilerContext: CompilerContext): string[] {
  const triggers = new Array<string>();
  let when: string | undefined;
  for (let i = 0; i < node.triggers.length; i++) {
    const trigger = node.triggers[i];
    trigger.kind === 'when'
      ? when = `when: () => ${resolveExpression(trigger.expressionNode, compilerContext).expression}`
      : triggers.push(`'${trigger.kind}'`);
  }

  const properties = [`triggers: [${triggers.join(', ')}]`];
  if (when) {
    properties.push(when);
  }

  const modules = compilerContext.deferredModules?.get(node);
  if (modules?.length) {
    properties.push(`load: () => Promise.all([${modules.map(path => `import(${JSON.stringify(path)})`).join(', ')}])`);
  }

  return properties;
}
