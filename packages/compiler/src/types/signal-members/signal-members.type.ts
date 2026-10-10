/**
 * Result of the static signal extraction performed on a component class.
 */
export type SignalMembers = {
  /**
   * Names of the class members backed by a signal, each listed once, inherited ones first.
   */
  readonly members: readonly string[];
  /**
   * Paths of every file, other than the component file itself, read to
   * resolve the inheritance chain (base class files and the re-exporting
   * barrels traversed to reach them). Editing any of them may change
   * `members`, so callers should watch them.
   */
  readonly dependencies: readonly string[];
};
