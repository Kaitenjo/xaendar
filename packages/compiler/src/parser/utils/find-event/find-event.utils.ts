import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { ConditionalBindingBranchNode } from '../../types/nodes/conditional-binding-branch-node.type';
import type { EventNode } from '../../types/nodes/event-node.type';

/**
 * Finds the first listener declared in a list of nodes, at any depth: on an element, in its conditional bindings, in
 * its directives, or in the blocks and the children the nodes hold.
 *
 * @param nodes - The nodes.
 * @returns The listener, `undefined` when there is none.
 */
export function findEvent(nodes: readonly ASTNode[]): EventNode | undefined {
  for (let i = 0; i < nodes.length; i++) {
    const event = findNodeEvent(nodes[i]);
    if (event) {
      return event;
    }
  }

  return undefined;
}

/**
 * Finds the first listener a node declares or holds.
 *
 * @param node - The node.
 * @returns The listener, `undefined` when there is none.
 */
function findNodeEvent(node: ASTNode): EventNode | undefined {
  switch (node.type) {
    case ASTNodeType.Element:
      return findBindingEvent(node) ?? findEvent(node.children);

    case ASTNodeType.If:
    case ASTNodeType.ElseIf:
      return findEvent(node.children) ?? (node.alternate ? findNodeEvent(node.alternate) : undefined);

    case ASTNodeType.For:
      return findEvent(node.children) ?? (node.empty ? findEvent(node.empty.children) : undefined);

    case ASTNodeType.Else:
    case ASTNodeType.Switch:
    case ASTNodeType.Case:
    case ASTNodeType.Template:
    case ASTNodeType.Hydrate:
    case ASTNodeType.Client:
      return findEvent(node.children);

    case ASTNodeType.Try:
      return findEvent(node.children) ?? findEvent(node.catch.children);

    case ASTNodeType.Defer:
      return findEvent(node.children)
        ?? (node.placeholder ? findEvent(node.placeholder.children) : undefined)
        ?? (node.loading ? findEvent(node.loading.children) : undefined)
        ?? (node.error ? findEvent(node.error.children) : undefined);

    default:
      // Texts, interpolations, imports, @render and @let declare no listener
      return undefined;
  }
}

/**
 * Finds the first listener among the bindings of an element, of a directive or of a branch of a conditional binding.
 *
 * @param bindings - The bindings.
 * @returns The listener, `undefined` when there is none.
 */
function findBindingEvent(bindings: Pick<ConditionalBindingBranchNode, 'events' | 'conditionalBindings'> & Partial<Pick<ConditionalBindingBranchNode, 'directives'>>): EventNode | undefined {
  const { events, conditionalBindings, directives } = bindings;
  if (events.length) {
    return events[0];
  }

  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    for (let j = 0; j < branches.length; j++) {
      const event = findBindingEvent(branches[j]);
      if (event) {
        return event;
      }
    }
  }

  if (directives?.length) {
    for (let i = 0; i < directives.length; i++) {
      const event = findBindingEvent(directives[i]);
      if (event) {
        return event;
      }
    }
  }

  return undefined;
}
