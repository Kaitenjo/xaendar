/**
 * The modules a template depends on, resolved from its `@import` statements (see `resolveTemplateModules`).
 */
export type TemplateModules = {
  /**
   * The modules the module of the template imports for their side effects, in the order they are imported: the files
   * declaring the components and the directives it imports, which define them when they are evaluated, also when they
   * are imported through a barrel, and the modules of the other symbols. The ones of `@import lazy` are left out:
   * something else loads them.
   */
  readonly imported: readonly string[];
  /**
   * Every module the compiled template depends on, the ones of `@import lazy` included: editing any of them must compile
   * the template again, as its bindings depend on the metadata of the components and directives they declare.
   */
  readonly watched: readonly string[];
};
