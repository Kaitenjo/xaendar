import type { LayoutItem } from './layout-item.type';
import type { LayoutAtom } from './layout-atom.type';

/**
 * An element, with the content between its tags as written.
 */
export type LayoutElement = {
  /**
   * Discriminant identifying the node as an element.
   */
  readonly kind: 'element';
  /**
   * The tag name.
   */
  readonly name: string;
  /**
   * The type arguments written between the parentheses after the tag name, `undefined` if the element declares none.
   */
  readonly typeArguments?: string;
  /**
   * The items of the opening tag.
   */
  readonly items: LayoutItem[];
  /**
   * Whether the element is written `<name ... />`: it has no content nor closing tag.
   */
  readonly selfClosing: boolean;
  /**
   * The children, `undefined` for an element without content (self-closing or void) or whose content is kept as written.
   */
  readonly children?: LayoutAtom[];
  /**
   * The content between the tags kept as written (`<pre>`, `<textarea>`, `<script>`, `<style>`), `undefined` otherwise.
   */
  readonly raw?: string;
};
