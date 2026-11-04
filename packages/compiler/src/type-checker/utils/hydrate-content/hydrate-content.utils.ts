import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import { visitNodes } from '../visit-nodes/visit-nodes.utils';

/**
 * Checks that a `@hydrate` with a trigger watching the elements of its content, `visible` or `interaction`, has some to
 * watch. The server has to render at least one: a `@client` without a `@placeholder` holding an element writes none, and
 * in the browser the trigger would never fire, silently waiting for the browser to be idle in its place.
 *
 * Only what is sure to render no element is an error: a block depending on the state, such as an `@if`, may render one,
 * and the browser falls back to `idle` when it does not.
 *
 * It is a check of its own, not of the state of the node, so that the editor keeps checking the content of the block.
 *
 * @example
 * checkHydrateContent(parseTemplate('@hydrate (visible) { @client { <x-a /> } }')); // [Error: The trigger "visible" …]
 * checkHydrateContent(parseTemplate('@hydrate (visible) { <p>Text</p> }'));         // []
 *
 * @param nodes - The nodes of the template.
 * @returns The errors, each one carrying the span of the trigger as its cause.
 */
export function checkHydrateContent(nodes: readonly ASTNode[]): Error[] {
  const errors = new Array<Error>;
  visitNodes(nodes, node => {
    const error = node.type === ASTNodeType.Hydrate ? checkTriggers(node) : undefined;
    if (error) {
      errors.push(error);
    }
  });

  return errors;
}

/**
 * Checks the triggers of a `@hydrate` against its content.
 *
 * @param node - The hydrate node.
 * @returns The error of the first trigger left without elements to watch, `undefined` when there is none.
 */
function checkTriggers({ triggers, children }: HydrateNode): Error | undefined {
  const trigger = triggers.find(({ kind }) => kind === 'visible' || kind === 'interaction');
  if (!trigger || mayRenderElement(children)) {
    return undefined;
  }

  return new Error(`The trigger "${trigger.kind}" watches the elements the server renders, and this @hydrate renders none: add an element, or a @placeholder holding one to its @client`, { cause: trigger.span });
}

/**
 * Tells whether the server may render an element for some nodes.
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

      case ASTNodeType.Client:
        return !!node.placeholder && mayRenderElement(node.placeholder.children);

      case ASTNodeType.Hydrate:
        return mayRenderElement(node.children);

      default:
        // An element, and what depends on the state, such as a block or a @render
        return true;
    }
  });
}
