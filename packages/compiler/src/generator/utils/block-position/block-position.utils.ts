import { ASTNodeType } from '../../../parser/types/node.enum';
import type { ASTNode } from '../../../parser/types/ast.type';

/**
 * Tells whether a node is the last one its parent renders: every sibling following it renders nothing (an `@import`, a
 * `<template>` declaration, a `@let`). A block in this position, when its parent ends where the node it is rendered into
 * does (the root of the template, the children of an element, the content of a block itself in this position), needs no
 * anchor: both generators read it here, the client to create none, the server to write no marker closing the block
 * (see `BlockPosition` of `@xaendar/core`).
 *
 * @example
 * isLastRenderedChild(parseTemplate('@if (a) { x } @let b = 1;'), 0); // true
 * isLastRenderedChild(parseTemplate('@if (a) { x } <p></p>'), 0);     // false
 *
 * @param siblings - The node and its siblings, in order.
 * @param index - The position of the node among them.
 * @returns `true` when no sibling following the node renders a node.
 */
export function isLastRenderedChild(siblings: readonly ASTNode[], index: number): boolean {
  for (let i = index + 1; i < siblings.length; i++) {
    switch (siblings[i].type) {
      case ASTNodeType.Import:
      case ASTNodeType.Template:
      case ASTNodeType.Let:
        break;

      default:
        return false;
    }
  }

  return true;
}

/**
 * Returns the anchor the functions rendering the content of a block forward to what they render: `anchor`, the node the
 * runtime renders the content before, or none for the last block of its parent, whose content is appended, the end of
 * the content being the end of the parent too, so that its own last block needs no anchor either.
 *
 * @param last - Whether the block is the last node of its parent (see {@link isLastRenderedChild}).
 * @returns The name of the anchor, `undefined` when the content renders at the end of the parent.
 */
export function getContentAnchor(last: boolean): string | undefined {
  return last ? undefined : 'anchor';
}

/**
 * Appends to the members of the constant of the module describing a block the one telling it is the last node of its
 * parent, which the runtime creates no anchor for, and the server closes with no marker (see `BlockPosition` of
 * `@xaendar/core`). It is left out otherwise.
 *
 * @param members - The members of the constant.
 * @param last - Whether the block is the last node of its parent.
 */
export function appendBlockPosition(members: string[], last: boolean): void {
  if (last) {
    members.push('last: true');
  }
}
