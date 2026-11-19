/**
 * A name a type references in a module, through an `import()` type (`import('/lib/src/card').Card`).
 */
export type TypeReference = {
  /**
   * The module, as written between the quotes of the `import()` type.
   */
  readonly module: string;
  /**
   * The name the module exports.
   */
  readonly name: string;
};
