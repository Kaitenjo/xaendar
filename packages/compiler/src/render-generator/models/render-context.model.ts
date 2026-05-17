/**
 * Tracks identifier scope during render code generation.
 * Each `Context` instance represents one lexical scope (e.g. a `@for` loop body)
 * and can be chained to a parent context for outer-scope resolution.
 */
export class Context {
  /**
   * Creates a new scope context.
   *
   * @param _identifiers List of loop variable names declared in this scope.
   * @param _parent Optional parent context representing the enclosing scope.
   */
  constructor(
    private _identifiers = new Array<string>,
    private _parent?: Context
  ) { }

  public addIdentifier(name: string): void {
    if (this.getIdentifier(name)) {
      throw new Error(`Identifier "${name}" is already declared in this scope.`);
    }
    
    this._identifiers.push(name);
  }

  /**
   * Returns the innermost identifier in the current scope chain, or
   * delegates to the parent context if none is found in this scope.
   *
   * @returns The most recently declared identifier name, or `undefined` if none exists.
   */
  public getIdentifier(name: string): string | undefined {
    return this._identifiers.includes(name) ? name : this._parent?.getIdentifier(name);
  }
}
