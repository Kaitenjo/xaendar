import type { LayoutItem } from './layout-item.type';

/**
 * A directive or a structural directive applied to an element, `@@name<Type>(bindings)` or `*name(bindings)`.
 */
export type LayoutDirective = {
  /**
   * Discriminant identifying the item as a directive.
   */
  readonly kind: 'directive';
  /**
   * What the selector is written after: `@@` for a directive, `*` for a structural one.
   */
  readonly prefix: '@@' | '*';
  /**
   * The selector of the directive.
   */
  readonly name: string;
  /**
   * The type arguments as written between the angle brackets, `undefined` if the directive declares none.
   */
  readonly typeArguments?: string;
  /**
   * The bindings written between the parentheses, `undefined` if the directive has none.
   */
  readonly items?: LayoutItem[];
};
