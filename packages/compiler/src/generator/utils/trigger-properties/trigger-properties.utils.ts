import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import type { HydrateTrigger } from '../../../parser/types/triggers/hydrate-trigger.type';
import type { GeneratorContext } from '../../context/context';
import type { DescribedTriggers } from '../../types/described-triggers.type';
import { isConstantExpression, resolveExpression } from '../generator/generator.utils';
import { declareExpression, toArrayLiteral, toObjectLiteral } from '../module-code/module-code.utils';

/**
 * Generates the members of the constant of the module a `@hydrate` or a `@defer` passes to the runtime about what it
 * waits for: its triggers, written by name or described with their arguments, `idle` when it declares none, the
 * function of the module computing the expression of its `when` trigger, if any, with the names of the variables of the
 * template it reads, and the one loading the modules of the components only its content renders (see
 * `getDeferredModules`), if any, together with the triggers following `prefetch`, which load them only. The functions
 * are named after the block (`div0__defer0$when`), and the runtime calls them with the component and the context.
 *
 * A trigger naming the element it watches reads it with a function, called once the template is rendered; the options
 * of the observer of `visible` are written in the constant when they read no name, computed by a function when the
 * trigger is armed otherwise.
 *
 * @example
 * getTriggerProperties(parseTemplate('@defer (hover(more), when ready()) { … }')[0], 'div0__defer0', context);
 * // ["triggers: [{ kind: 'hover', target: div0__defer0$hover_target }]", 'when: div0__defer0$when']
 *
 * @param node - The block.
 * @param owner - The name of the block, which the functions are named after.
 * @param generatorContext - The generator context of the block.
 * @returns The members, as written in the object literal of the block.
 */
export function getTriggerProperties(node: HydrateNode | DeferNode, owner: string, generatorContext: GeneratorContext): string[] {
  const { triggers, when, whenReads } = describeTriggers(node.triggers, `${owner}$`, generatorContext);
  // Without a trigger rendering the content, the block waits for the browser to be idle
  const properties = [`triggers: ${triggers.length || when ? toArrayLiteral(triggers) : '[\'idle\']'}`];
  if (when) {
    properties.push(`when: ${declareExpression(generatorContext, `${owner}$when`, when)}`);
    if (whenReads) {
      properties.push(`whenReads: ${whenReads}`);
    }
  }

  const modules = generatorContext.deferredModules?.get(node);
  if (modules?.length) {
    const load = generatorContext.declareFunction(`${owner}$load`, '', [`return Promise.all([${modules.map(path => `import(${JSON.stringify(path)})`).join(', ')}]);`]);
    properties.push(`load: ${load}`);
    const prefetch = describeTriggers(node.prefetch, `${owner}$prefetch_`, generatorContext);
    if (prefetch.triggers.length) {
      properties.push(`prefetch: ${toArrayLiteral(prefetch.triggers)}`);
    }

    if (prefetch.when) {
      properties.push(`prefetchWhen: ${declareExpression(generatorContext, `${owner}$prefetchWhen`, prefetch.when)}`);
      if (prefetch.whenReads) {
        properties.push(`prefetchWhenReads: ${prefetch.whenReads}`);
      }
    }
  }

  return properties;
}

/**
 * Describes triggers as the runtime reads them: the ones written without arguments by name, the others as objects, the
 * element a trigger names read by a function of the module.
 *
 * @param triggers - The triggers.
 * @param prefix - The start of the names of the functions: the name of the block, `$`, and `prefetch_` for the triggers
 *   following `prefetch`.
 * @param generatorContext - The generator context of the block.
 * @returns The triggers, as written in an array literal, the expression of the `when` among them, if any, and the
 *   constant listing the variables of the template it reads, if any.
 */
function describeTriggers(triggers: readonly HydrateTrigger[], prefix: string, generatorContext: GeneratorContext): DescribedTriggers {
  const described = new Array<string>();
  const result: DescribedTriggers = { triggers: described };
  for (let i = 0; i < triggers.length; i++) {
    const trigger = triggers[i];
    switch (trigger.kind) {
      case 'when': {
        const { expression, variables } = resolveExpression(trigger.expressionNode, generatorContext);
        result.when = expression;
        result.whenReads = generatorContext.getReads(variables);
        break;
      }

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
          members.push(`target: ${declareExpression(generatorContext, `${prefix}${trigger.kind}_target`, resolveExpression(trigger.target.expressionNode, generatorContext).expression)}`);
        }

        if (trigger.kind === 'visible' && trigger.options) {
          const { expressionNode } = trigger.options;
          const { expression } = resolveExpression(expressionNode, generatorContext);
          members.push(`options: ${isConstantExpression(expressionNode) ? expression : declareExpression(generatorContext, `${prefix}visible_options`, expression)}`);
        }

        described.push(members.length > 1 ? toObjectLiteral(members) : `'${trigger.kind}'`);
        break;
      }

      default:
        described.push(`'${trigger.kind}'`);
    }
  }

  return result;
}
