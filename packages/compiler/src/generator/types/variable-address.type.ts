/**
 * Where a variable of a template lives at runtime, seen from a scope reading it (see `CompilerContext.addressOf`).
 */
export type VariableAddress = {
  /**
   * How many scopes up the chain of the declaring scopes the variable is declared, `0` for the scope itself.
   */
  readonly depth: number;
  /**
   * The slot of the variable in the scope declaring it.
   */
  readonly slot: number;
  /**
   * The identifier of the variable, unique in its template.
   */
  readonly id: number;
};
