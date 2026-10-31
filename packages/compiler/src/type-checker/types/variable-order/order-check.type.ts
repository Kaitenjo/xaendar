import type { Level } from './level.type';
import type { Declaration } from './declaration.type';
import type { ScopeNames } from './scope-names.type';
import type { RenderSite } from './render-site.type';

/**
 * The state of the check of a template.
 */
export type OrderCheck = {
  /**
   * The names of the scopes enclosing the part being checked, the innermost last.
   */
  readonly scopes: ScopeNames[];
  /**
   * The part of the template being checked.
   */
  level: Level;
  /**
   * For each template, the element refs and the `@let` declared outside of it that its content, or a template it
   * renders, reads as soon as it is rendered, mapped to their names: whether they exist depends on where the template is
   * rendered.
   */
  readonly freeReads: Map<Level, Map<Declaration, string>>;
  /**
   * The `@render`s of the template.
   */
  readonly renders: RenderSite[];
  /**
   * The errors found so far, `undefined` while there are none.
   */
  errors?: Error[];
};
