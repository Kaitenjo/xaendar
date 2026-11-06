import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import type { HydrateTrigger } from '../../../parser/types/triggers/hydrate-trigger.type';
import type { GeneratorContext } from '../../context/context';
import { resolveExpression } from '../generator/generator.utils';

/**
 * Generates the properties of the block a `@hydrate` or a `@defer` passes to the runtime about what it waits for: its
 * triggers, written by name or described with their arguments, `idle` when it declares none, the function reading the
 * expression of its `when` trigger, if any, and the one loading the modules of the components only its content renders
 * (see `getDeferredModules`), if any, together with the triggers following `prefetch`, which load them only.
 *
 * A trigger naming the element it watches reads it with a function, called once the template is rendered, and the
 * options of the observer of `visible` are evaluated where the block is.
 *
 * @example
 * getTriggerProperties(parseTemplate('@defer (hover(more), when ready()) { … }')[0], context);
 * // ["triggers: [{ kind: 'hover', target: () => context.get('more') }]", 'when: () => this.ready()']
 *
 * @param node - The block.
 * @param generatorContext - The generator context of the block.
 * @returns The properties, as written in the object literal of the block.
 */
export function getTriggerProperties(node: HydrateNode | DeferNode, generatorContext: GeneratorContext): string[] {
  const { triggers, when } = describeTriggers(node.triggers, generatorContext);
  // Without a trigger rendering the content, the block waits for the browser to be idle
  const properties = [`triggers: [${triggers.length || when ? triggers.join(', ') : '\'idle\''}]`];
  if (when) {
    properties.push(`when: () => ${when}`);
  }

  const modules = generatorContext.deferredModules?.get(node);
  if (modules?.length) {
    properties.push(`load: () => Promise.all([${modules.map(path => `import(${JSON.stringify(path)})`).join(', ')}])`);
    const prefetch = describeTriggers(node.prefetch, generatorContext);
    if (prefetch.triggers.length) {
      properties.push(`prefetch: [${prefetch.triggers.join(', ')}]`);
    }

    if (prefetch.when) {
      properties.push(`prefetchWhen: () => ${prefetch.when}`);
    }
  }

  return properties;
}

/**
 * Describes triggers as the runtime reads them: the ones written without arguments by name, the others as objects.
 *
 * @param triggers - The triggers.
 * @param generatorContext - The generator context of the block.
 * @returns The triggers, as written in an array literal, and the expression of the `when` among them, if any.
 */
function describeTriggers(triggers: readonly HydrateTrigger[], generatorContext: GeneratorContext): { triggers: string[], when?: string } {
  const described = new Array<string>();
  const result: { triggers: string[], when?: string } = { triggers: described };
  for (let i = 0; i < triggers.length; i++) {
    const trigger = triggers[i];
    switch (trigger.kind) {
      case 'when':
        result.when = resolveExpression(trigger.expressionNode, generatorContext).expression;
        break;

      case 'idle':
        described.push(trigger.timeout === undefined ? '\'idle\'' : `{ kind: 'idle', timeout: ${trigger.timeout} }`);
        break;

      case 'timer':
        described.push(`{ kind: 'timer', delay: ${trigger.delay} }`);
        break;

      case 'visible':
      case 'interaction':
      case 'hover': {
        const members = [`kind: '${trigger.kind}'`];
        if (trigger.target) {
          members.push(`target: () => ${resolveExpression(trigger.target.expressionNode, generatorContext).expression}`);
        }

        if (trigger.kind === 'visible' && trigger.options) {
          members.push(`options: ${resolveExpression(trigger.options.expressionNode, generatorContext).expression}`);
        }

        described.push(members.length > 1 ? `{ ${members.join(', ')} }` : `'${trigger.kind}'`);
        break;
      }

      default:
        described.push(`'${trigger.kind}'`);
    }
  }

  return result;
}
