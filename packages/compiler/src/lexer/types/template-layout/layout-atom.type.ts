import type { LayoutBlock } from './layout-block.type';
import type { LayoutElement } from './layout-element.type';
import type { LayoutRender } from './layout-render.type';
import type { LayoutLet } from './layout-let.type';

/**
 * A piece of the content of an element or block, in the order it is written in.
 */
export type LayoutAtom =
  | {
    /**
     * Discriminant identifying the atom as text.
     */
    readonly kind: 'text';
    /**
     * The text as written, the spaces and line breaks around it included.
     */
    readonly value: string;
  }
  | {
    /**
     * Discriminant identifying the atom as an interpolation.
     */
    readonly kind: 'interpolation';
    /**
     * The expression as written between the braces.
     */
    readonly expression: string;
  }
  | {
    /**
     * Discriminant identifying the atom as a comment.
     */
    readonly kind: 'comment';
    /**
     * The whole comment, `<!--` and `-->` included.
     */
    readonly value: string;
  }
  | LayoutElement
  | LayoutBlock<LayoutAtom[]>
  | LayoutRender
  | LayoutLet;
