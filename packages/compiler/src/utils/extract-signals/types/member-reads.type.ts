/**
 * What the body of a method or of a getter reads, to tell whether the member is reactive.
 */
export type MemberReads = {
  /**
   * Whether the member is a getter, read by accessing it rather than by calling it.
   */
  readonly getter: boolean;
  /**
   * Names of the members called through `this` (`this.count()`).
   */
  readonly calls: Set<string>;
  /**
   * Names of the members accessed through `this` without calling them (`this.label`).
   */
  readonly accesses: Set<string>;
  /**
   * Whether the body calls a module signal (`count()`).
   */
  readsModuleSignal: boolean;
}
