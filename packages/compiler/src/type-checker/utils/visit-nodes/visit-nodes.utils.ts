import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';

/**
 * Visits the nodes of a template, each one before the nodes it holds: the ones of a `@placeholder` and of a `<template>`
 * included, which the template renders elsewhere.
 *
 * @example
 * visitNodes(parseTemplate('<p>@client { <b></b> }</p>'), ({ type }) => types.push(type)); // p, @client, b
 *
 * @param nodes - The nodes.
 * @param visit - The function called with each node.
 */
export function visitNodes(nodes: readonly ASTNode[], visit: (node: ASTNode) => void): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    visit(node);

    const nested = getNestedNodes(node);
    for (let j = 0; nested && j < nested.length; j++) {
      visitNodes(nested[j], visit);
    }
  }
}

/**
 * Returns the lists of nodes nested in a node.
 *
 * @param node - The node.
 * @returns The lists, `undefined` when it holds none.
 */
function getNestedNodes(node: ASTNode): Array<readonly ASTNode[]> | undefined {
  switch (node.type) {
    case ASTNodeType.Client:
      return node.placeholder ? [node.children, node.placeholder.children] : [node.children];

    case ASTNodeType.Try:
      return [node.children, node.catch.children];

    case ASTNodeType.Defer: {
      const lists: Array<readonly ASTNode[]> = [node.children];
      if (node.placeholder) {
        lists.push(node.placeholder.children);
      }

      if (node.loading) {
        lists.push(node.loading.children);
      }

      if (node.error) {
        lists.push(node.error.children);
      }

      return lists;
    }

    case ASTNodeType.If:
    case ASTNodeType.ElseIf:
      return node.alternate ? [node.children, [node.alternate]] : [node.children];

    case ASTNodeType.Switch:
      return node.children.map(({ children }) => children);

    case ASTNodeType.For:
      return node.empty ? [node.children, node.empty.children] : [node.children];

    case ASTNodeType.Element:
    case ASTNodeType.Else:
    case ASTNodeType.Template:
    case ASTNodeType.Hydrate:
      return [node.children];

    default:
      return undefined;
  }
}
