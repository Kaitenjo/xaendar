import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import type { HydrateTrigger } from '../../../parser/types/triggers/hydrate-trigger.type';
import { visitNodes } from '../visit-nodes/visit-nodes.utils';

/**
 * Checks that a block with a trigger watching its elements, `visible`, `interaction` or `hover`, the ones following
 * `prefetch` too, has some to watch: a `@hydrate` watches the elements of its content the server renders, a `@defer` the
 * ones of its `@placeholder`, unless the trigger names the element it watches with an element ref. A `@client` without
 * a `@placeholder` holding an element writes none on the server, a `@defer` without a `@placeholder` holding one renders
 * none before its trigger, and the trigger would never fire, silently waiting for the browser to be idle in its place.
 *
 * Only what is sure to render no element is an error: a block depending on the state, such as an `@if`, may render one,
 * and the browser falls back to `idle` when it does not.
 *
 * It is a check of its own, not of the state of the node, so that the editor keeps checking the content of the block.
 *
 * @example
 * checkTriggerTargets(parseTemplate('@hydrate (visible) { @client { <x-a /> } }'));      // [Error: The trigger "visible" …]
 * checkTriggerTargets(parseTemplate('@defer (interaction) { <x-a /> }'));                // [Error: The trigger "interaction" …]
 * checkTriggerTargets(parseTemplate('@defer (visible) { <x-a /> } @placeholder { <p /> }')); // []
 *
 * @param nodes - The nodes of the template.
 * @returns The errors, each one carrying the span of the trigger as its cause.
 */
export function checkTriggerTargets(nodes: readonly ASTNode[]): Error[] {
  const errors = new Array<Error>;
  visitNodes(nodes, node => {
    let error: Error | undefined;
    switch (node.type) {
      case ASTNodeType.Hydrate:
        error = checkTriggers(node, node.children, 'watches the elements the server renders, and this @hydrate renders none: add an element, or a @placeholder holding one to its @client');
        break;

      case ASTNodeType.Defer:
        error = checkTriggers(node, node.placeholder?.children, 'watches the elements of the @placeholder, and this @defer renders none before its trigger: add a @placeholder holding an element, or name the element to watch with an element ref, such as hover(button)');
        break;
    }

    if (error) {
      errors.push(error);
    }
  });

  return errors;
}

/**
 * Checks the triggers of a block against the nodes they watch.
 *
 * @param node - The block.
 * @param watched - The nodes the triggers watch the elements of, `undefined` for none.
 * @param reason - Why the trigger watches no element, and how to fix it.
 * @returns The error of the first trigger left without elements to watch, `undefined` when there is none.
 */
function checkTriggers({ triggers, prefetch }: HydrateNode | DeferNode, watched: readonly ASTNode[] | undefined, reason: string): Error | undefined {
  const trigger = triggers.find(watchesBlock) ?? prefetch.find(watchesBlock);
  if (!trigger || (watched && mayRenderElement(watched))) {
    return undefined;
  }

  return new Error(`The trigger "${trigger.kind}" ${reason}`, { cause: trigger.span });
}

/**
 * Tells whether a trigger watches the elements of its block: `visible`, `interaction` and `hover`, without an element
 * ref naming the element to watch.
 *
 * @param trigger - The trigger.
 * @returns `true` when it watches the elements of its block.
 */
function watchesBlock(trigger: HydrateTrigger): boolean {
  switch (trigger.kind) {
    case 'visible':
    case 'interaction':
    case 'hover':
      return !trigger.target;

    default:
      return false;
  }
}

/**
 * Tells whether the server may render an element for some nodes, and the browser before any trigger fires.
 *
 * @param nodes - The nodes.
 * @returns `false` when it is sure to render none.
 */
function mayRenderElement(nodes: readonly ASTNode[]): boolean {
  return nodes.some(node => {
    switch (node.type) {
      case ASTNodeType.Text:
      case ASTNodeType.Interpolation:
      case ASTNodeType.Let:
      case ASTNodeType.Template:
        return false;

      // Before the browser renders their content, only their @placeholder is there
      case ASTNodeType.Client:
      case ASTNodeType.Defer:
        return !!node.placeholder && mayRenderElement(node.placeholder.children);

      case ASTNodeType.Hydrate:
        return mayRenderElement(node.children);

      default:
        // An element, and what depends on the state, such as a block or a @render
        return true;
    }
  });
}
