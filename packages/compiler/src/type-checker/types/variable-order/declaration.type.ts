import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import type { Level } from './level.type';

/**
 * A name a scope of the template declares.
 */
export type Declaration = {
  /**
   * When the name can be read: the position of the element an element ref names, which is created when the
   * render reaches it, the end of a `@let`, initialized when the render reaches it, or `null` for a name the scope
   * declares as soon as it is created (the item of a `@for` and its implicit variables, the parameters of a template, a
   * template).
   */
  readonly position: number | null;
  /**
   * The part of the template declaring the name.
   */
  readonly level: Level;
  /**
   * The template the name declares, if it declares one.
   */
  readonly template?: TemplateNode;
  /**
   * The `@let` declaring the name, if a `@let` declares it.
   */
  readonly let?: LetNode;
};
