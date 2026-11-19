import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import type { HydrateTrigger } from '../../../parser/types/triggers/hydrate-trigger.type';
import type { TypeCheckContext } from '../../models/context/context';
import type { Line } from '../../types/line.type';
import { line, mapped } from '../line-builder/line-builder.utils';
import { mappedExpression } from '../mapped-expression/mapped-expression.utils';

/**
 * Type-checks the triggers of a `@defer` or of a `@hydrate`, the ones following `prefetch` too: the expression of `when`,
 * read as the condition of an `@if`, the element ref naming the element a trigger watches, which must be an element, and
 * the options of the observer of `visible`, the ones of an `IntersectionObserver` but its root, which is the viewport.
 *
 * @example
 * typeCheckTriggers(parseTemplate('@defer (hover(more), when ready()) { … }')[0], context);
 * // ['more satisfies Element;', 'if (root.ready()) { }']
 *
 * @param node - The block.
 * @param context - The scope the block is in.
 * @returns The generated type-check lines.
 */
export function typeCheckTriggers({ triggers, prefetch }: HydrateNode | DeferNode, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();
  typeCheckTriggerList(triggers, context, lines);
  typeCheckTriggerList(prefetch, context, lines);
  return lines;
}

/**
 * Type-checks a list of triggers (see `typeCheckTriggers`).
 *
 * @param list - The triggers.
 * @param context - The scope the block is in.
 * @param lines - The generated type-check lines, filled.
 */
function typeCheckTriggerList(list: readonly HydrateTrigger[], context: TypeCheckContext, lines: Line[]): void {
  for (let i = 0; i < list.length; i++) {
    const trigger = list[i];
    switch (trigger.kind) {
      case 'when':
        lines.push(line('if (', mappedExpression(trigger.expressionNode, context, trigger.span), ') { }'));
        break;

      case 'visible':
      case 'interaction':
      case 'hover':
        if (trigger.target) {
          // TypeScript reports what the name does not satisfy on the keyword, mapped onto the name too
          const { expressionNode, span } = trigger.target;
          lines.push(line(mappedExpression(expressionNode, context, span), ' ', mapped('satisfies', span), ' Element;'));
        }

        if (trigger.kind === 'visible' && trigger.options) {
          // The expression of an object literal is written between parentheses
          lines.push(line(mappedExpression(trigger.options.expressionNode, context, trigger.options.span), ' satisfies Omit<IntersectionObserverInit, \'root\'>;'));
        }
        break;

      default:
        // The other triggers read nothing of the template
        break;
    }
  }
}
