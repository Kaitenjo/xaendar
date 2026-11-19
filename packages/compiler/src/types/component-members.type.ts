/**
 * Members of a component class, inherited ones included, that change how its template is compiled:
 * result of the static extraction performed on the class.
 */
export type ComponentMembers = {
  /**
   * Names of the class members a template reads reactively, each listed once: the members backed by a signal,
   * inherited ones first, then the methods and getters reading a signal.
   */
  readonly reactiveMembers: readonly string[];
  /**
   * Names of the instance members (fields, accessors, methods), inherited ones included, named like
   * a global identifier, each listed once: a template reading one of those names reads the member.
   */
  readonly shadowingMembers: readonly string[];
  /**
   * Paths of every file, other than the component file itself, read to
   * resolve the inheritance chain (base class files and the re-exporting
   * barrels traversed to reach them). Editing any of them may change
   * `reactiveMembers` and `shadowingMembers`, so callers should watch them.
   */
  readonly dependencies: readonly string[];
};
